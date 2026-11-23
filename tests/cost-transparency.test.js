import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import {
  MODEL_PRICING_CATALOG,
  estimateUsageCostUsd,
  summarizeSessionUsage,
  resolveModelPricing,
  formatUsd,
} from '../src/utils/cost-model.ts';
import {
  WEBGPU_MODEL_CATALOG,
  resolveWebGpuModelSpec,
  BrowserWebGpuEngine,
  formatWebGpuError,
} from '../src/utils/webgpu-engine.ts';
import { GeminiService } from '../src/services/gemini.service.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

describe('Cost Model, Telemetry & Transparency Audit Suite', () => {
  test('Server MODEL_PRICING_CATALOG matches client src/utils/cost-model.ts exactly', () => {
    const serverSource = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
    const match = serverSource.match(/const MODEL_PRICING_CATALOG = Object\.freeze\((\{[\s\S]*?\n\})\);/);
    assert.ok(match, 'Could not locate MODEL_PRICING_CATALOG in server.js');

    const serverCatalog = JSON.parse(JSON.stringify(vm.runInNewContext(`(${match[1]})`)));
    const clientKeys = Object.keys(MODEL_PRICING_CATALOG).sort();
    const serverKeys = Object.keys(serverCatalog).sort();
    assert.deepStrictEqual(serverKeys, clientKeys, 'Model catalog keys must match between server.js and cost-model.ts');

    for (const key of clientKeys) {
      const c = MODEL_PRICING_CATALOG[key];
      const s = serverCatalog[key];
      assert.strictEqual(s.inputPer1M, c.inputPer1M, `${key} inputPer1M mismatch`);
      assert.strictEqual(s.outputPer1M, c.outputPer1M, `${key} outputPer1M mismatch`);
      assert.strictEqual(s.cachedInputPer1M, c.cachedInputPer1M, `${key} cachedInputPer1M mismatch`);
      assert.strictEqual(s.freeTierAvailable, c.freeTierAvailable, `${key} freeTierAvailable mismatch`);
      assert.strictEqual(s.billingTier, c.billingTier, `${key} billingTier mismatch`);
      assert.deepStrictEqual(s.scheduledRateChange, c.scheduledRateChange, `${key} scheduledRateChange mismatch`);
    }
  });

  test('estimateUsageCostUsd computes accurate USD across all model tiers and Dec 1 Argon rate hike', () => {
    // Hydrogen: $1.50/1M in, $7.50/1M out+thought, $0.075/1M cached
    const hydrogenUsd = estimateUsageCostUsd(
      'gemini-4-hydrogen',
      { inputTokens: 1_000_000, outputTokens: 500_000, thoughtTokens: 500_000, cachedTokens: 200_000 },
      '2026-11-23'
    );
    // 800k * 1.50 + 200k * 0.075 + 1M * 7.50 = 1.20 + 0.015 + 7.50 = 8.715
    assert.strictEqual(hydrogenUsd, 8.715);

    // Argon pre-Dec 1 ($2/$10) vs post-Dec 1 ($4/$20)
    const argonNovUsd = estimateUsageCostUsd(
      'gemini-4-argon',
      { inputTokens: 1_000_000, outputTokens: 1_000_000, thoughtTokens: 0, cachedTokens: 0 },
      '2026-11-30'
    );
    assert.strictEqual(argonNovUsd, 12.0);

    const argonDecUsd = estimateUsageCostUsd(
      'gemini-4-argon',
      { inputTokens: 1_000_000, outputTokens: 1_000_000, thoughtTokens: 0, cachedTokens: 0 },
      '2026-12-01'
    );
    assert.strictEqual(argonDecUsd, 24.0);

    // Flash-Lite: $0.30/1M in, $2.50/1M out
    const flashLiteUsd = estimateUsageCostUsd(
      'gemini-3.5-flash-lite',
      { inputTokens: 1_000_000, outputTokens: 1_000_000 },
      '2026-11-23'
    );
    assert.strictEqual(flashLiteUsd, 2.8);

    // Zero-cost tiers
    for (const freeModel of ['gemma-4-31b-it', 'on-device-nano', 'window.ai', 'webgpu', 'ollama:pivotpulse', 'local:gemma4', 'demo']) {
      const resolved = resolveModelPricing(freeModel);
      assert.strictEqual(resolved.effectiveInputPer1M, 0, `${freeModel} input rate should be $0`);
      assert.strictEqual(
        estimateUsageCostUsd(freeModel, { inputTokens: 50_000, outputTokens: 20_000, thoughtTokens: 10_000 }),
        0,
        `${freeModel} cost must be $0`
      );
    }

    assert.strictEqual(formatUsd(0), '$0.00');
    assert.strictEqual(formatUsd(0.00005), '< $0.0001');
    assert.strictEqual(formatUsd(0.0123), '$0.0123');
    assert.strictEqual(formatUsd(1.256), '$1.26');
  });

  test('summarizeSessionUsage rolls up totals, zero-cost share, and estimated cloud savings', () => {
    const entries = [
      {
        endpoint: '/api/structure',
        model: 'gemini-4-hydrogen',
        billingSource: 'hosted',
        billingTier: 'cloud-default',
        inputTokens: 1000,
        outputTokens: 300,
        thoughtTokens: 500,
        cachedTokens: 0,
        totalTokens: 1800,
        estimatedCostUsd: estimateUsageCostUsd('gemini-4-hydrogen', {
          inputTokens: 1000,
          outputTokens: 300,
          thoughtTokens: 500,
        }),
        estimated: false,
        callCount: 1,
        timestamp: '2026-11-23T05:00:00Z',
      },
      {
        endpoint: '/api/insights',
        model: 'ollama:pivotpulse',
        billingSource: 'local-ollama',
        billingTier: 'local-vram',
        inputTokens: 1500,
        outputTokens: 800,
        thoughtTokens: 0,
        cachedTokens: 0,
        totalTokens: 2300,
        estimatedCostUsd: 0,
        estimated: false,
        callCount: 1,
        timestamp: '2026-11-23T05:01:00Z',
      },
    ];

    const summary = summarizeSessionUsage(entries, '2026-11-23');
    assert.strictEqual(summary.callCount, 2);
    assert.strictEqual(summary.requestCount, 2);
    assert.strictEqual(summary.totalInputTokens, 2500);
    assert.strictEqual(summary.totalOutputTokens, 1100);
    assert.strictEqual(summary.totalThoughtTokens, 500);
    assert.strictEqual(summary.totalTokens, 4100);
    assert.strictEqual(summary.zeroCostCallCount, 1);
    assert.strictEqual(summary.zeroCostPercent, 50);
    assert.strictEqual(summary.totalEstimatedCostUsd, 0.0075);
    // Savings on 1500 in + 800 out at Hydrogen rates: (1500*1.5 + 800*7.5)/1e6 = 0.00825
    assert.strictEqual(summary.estimatedCloudSavingsUsd, 0.00825);
  });

  test('GeminiService captures X-Token-Usage headers, SSE usage frames, Demo receipts, and handles headerless mocks', async () => {
    const prevFetch = globalThis.fetch;
    const prevStorage = globalThis.localStorage;
    const store = new Map();
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    };

    try {
      // 1. Unary header capture + resilience on headerless mocks
      const service = new GeminiService();
      const unaryReceipt = {
        endpoint: '/api/structure',
        model: 'gemini-4-hydrogen',
        billingSource: 'hosted',
        billingTier: 'cloud-default',
        inputTokens: 900,
        outputTokens: 250,
        thoughtTokens: 400,
        cachedTokens: 0,
        totalTokens: 1550,
        estimatedCostUsd: 0.006225,
        estimated: false,
        callCount: 1,
        timestamp: '2026-11-23T05:02:00Z',
      };

      globalThis.fetch = async (url) => {
        if (url === '/api/structure') {
          return {
            ok: true,
            headers: new Headers({ 'x-token-usage': JSON.stringify(unaryReceipt) }),
            json: async () => ({ title: 'Header Test', condition: 'Recovery', goal: 'Walk', barriers: [] }),
          };
        }
        // Intentionally omit headers to mimic lightweight mocks like chaos.test.js
        return {
          ok: true,
          json: async () => ({
            personGoal: 'Goal',
            keyInterventions: [],
            monitoringPlan: [],
            guidanceAndEducation: [],
            positiveAchievements: [],
            recommendations: [],
          }),
        };
      };

      await service.structureHealthGoal('Unary header test prompt');
      await service.generateCarePlan('Headerless mock test', [{ text: 'Insight 1', strategyName: 'What If?', problem: 'Test', mode: 'care' }]);
      assert.strictEqual(service.sessionUsageEntries().length, 1);
      assert.strictEqual(service.sessionCostSummary().totalTokens, 1550);

      // 2. SSE usage frames on /api/insights and /api/agent/pipeline
      const encoder = new TextEncoder();
      const insightsUsage = { ...unaryReceipt, endpoint: '/api/insights', totalTokens: 2000, estimatedCostUsd: 0.01 };
      const pipelineUsage = { ...unaryReceipt, endpoint: '/api/agent/pipeline', totalTokens: 6000, callCount: 4, estimatedCostUsd: 0.03 };

      globalThis.fetch = async (url) => {
        if (url === '/api/insights') {
          const sse =
            `data: ${JSON.stringify({ text: JSON.stringify([{ strategyName: 'What If?', insights: [{ text: 'Idea A' }] }]) })}\n\n` +
            `data: ${JSON.stringify({ usage: insightsUsage })}\n\n` +
            `data: [DONE]\n\n`;
          return {
            ok: true,
            body: new ReadableStream({
              start(c) {
                c.enqueue(encoder.encode(sse));
                c.close();
              },
            }),
          };
        }
        const pipelineSse =
          `data: ${JSON.stringify({ phase: 'generating', result: [{ strategyName: 'What If?', insights: [{ text: 'Idea B' }] }] })}\n\n` +
          `data: ${JSON.stringify({
            phase: 'complete',
            result: {
              selection: { selectedIds: ['what-if'], reasoning: 'ok', problemCategory: 'test' },
              initialInsights: [{ strategyName: 'What If?', insights: [{ text: 'Idea B' }] }],
              debate: [],
              refinedInsights: [],
              consensus: 'Done',
            },
            usage: pipelineUsage,
          })}\n\n` +
          `data: ${JSON.stringify({ usage: pipelineUsage })}\n\n` +
          `data: [DONE]\n\n`;
        return {
          ok: true,
          body: new ReadableStream({
            start(c) {
              c.enqueue(encoder.encode(pipelineSse));
              c.close();
            },
          }),
        };
      };

      await service.generateInsights('SSE insights usage test', [{ id: 'what-if', name: 'What If?', description: '', icon: 'sparkles', color: '#8E75C2' }], 'creative');
      await service.runAgenticPipeline('SSE pipeline usage test', 'creative', () => {}, () => {});

      assert.strictEqual(service.sessionUsageEntries().length, 3, 'Pipeline should not double-record complete + trailing usage frames');
      assert.strictEqual(service.sessionCostSummary().totalTokens, 1550 + 2000 + 6000);
      assert.strictEqual(service.sessionCostSummary().callCount, 6);

      // 3. Demo mode $0 receipt tracking
      store.set('spark_cfg_val', 'demo-key-active');
      await service.structureHealthGoal('Demo tracking test');
      assert.strictEqual(service.sessionUsageEntries().length, 4);
      const demoEntry = service.sessionUsageEntries()[3];
      assert.strictEqual(demoEntry.billingSource, 'demo');
      assert.strictEqual(demoEntry.estimatedCostUsd, 0);
    } finally {
      globalThis.fetch = prevFetch;
      if (prevStorage === undefined) {
        delete globalThis.localStorage;
      } else {
        globalThis.localStorage = prevStorage;
      }
    }
  });

  test('public/transparency.html & server.js satisfy Observatory CSP, routing, and OPSEC guardrails', () => {
    const html = fs.readFileSync(path.join(ROOT, 'public', 'transparency.html'), 'utf8');
    assert.ok(!/<script\b/i.test(html), 'transparency.html must not contain <script> tags (Observatory CSP)');
    assert.ok(!/\son[a-z]+\s*=/i.test(html), 'transparency.html must not contain inline on* event handlers');
    assert.ok(html.includes('gemini-4-hydrogen') && html.includes('gemini-4-argon'), 'transparency.html must document active models');

    const ledgerMd = fs.readFileSync(path.join(ROOT, 'docs', 'cost_transparency_ledger.md'), 'utf8');
    const cocomoMd = fs.readFileSync(path.join(ROOT, 'docs', 'cocomo_breakdown.md'), 'utf8');
    const forbiddenPublicTokens = [
      'insightspark-82c75',
      'BILLING_DISABLED',
      'run-sources-',
      'pkg.dev',
      '00052',
      'Users/philg',
      'file:///',
      'maxScale',
    ];
    for (const [name, content] of [
      ['public/transparency.html', html],
      ['docs/cost_transparency_ledger.md', ledgerMd],
      ['docs/cocomo_breakdown.md', cocomoMd],
    ]) {
      for (const token of forbiddenPublicTokens) {
        assert.ok(!content.includes(token), `${name} must not expose OPSEC token "${token}"`);
      }
    }

    assert.ok(
      fs.existsSync(path.join(ROOT, 'scratch', 'operator-gcp-audit.md')),
      'Private operator GCP audit should be generated in gitignored scratch/operator-gcp-audit.md'
    );

    const serverSource = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
    assert.ok(serverSource.includes("exposedHeaders: ['X-Token-Usage']"), 'server.js CORS must expose X-Token-Usage');
    assert.ok(serverSource.includes('ALLOWED_CORS_ORIGINS'), 'server.js must enforce strict CORS origin allowlist');
    assert.ok(serverSource.includes('HOSTED_MODEL_ALLOWLIST'), 'server.js must enforce hosted-key model allowlist');
    assert.ok(serverSource.includes('options.isPipeline'), 'server.js must enforce hosted thinking caps');
    assert.ok(serverSource.includes("app.get('/api/transparency/pricing'"), 'server.js must expose /api/transparency/pricing');
    assert.ok(serverSource.includes("app.get(['/transparency', '/transparency.html']"), 'server.js must serve /transparency');

    const pricingEndpointMatch = serverSource.match(/app\.get\('\/api\/transparency\/pricing'[\s\S]*?\n\}\);/);
    assert.ok(pricingEndpointMatch, 'Could not locate /api/transparency/pricing handler');
    assert.ok(!pricingEndpointMatch[0].includes('maxInstances'), '/api/transparency/pricing must not expose maxInstances');
    assert.ok(!pricingEndpointMatch[0].includes('maxApiRequestsPerIp'), '/api/transparency/pricing must not expose maxApiRequestsPerIp');
  });

  test('Gemma 4 26B A4B MoE & WebGPU/HF prefixes resolve at $0 and pass server sanitization', () => {
    const moeSpec = MODEL_PRICING_CATALOG['gemma-4-26b-a4b-it'];
    assert.ok(moeSpec, 'MODEL_PRICING_CATALOG must define gemma-4-26b-a4b-it');
    assert.strictEqual(moeSpec.inputPer1M, 0);
    assert.strictEqual(moeSpec.outputPer1M, 0);
    assert.strictEqual(moeSpec.billingTier, 'cloud-open-free');
    assert.strictEqual(
      estimateUsageCostUsd('gemma-4-26b-a4b-it', { inputTokens: 100_000, outputTokens: 25_000 }),
      0
    );

    for (const prefixModel of [
      'webgpu:onnx-community/gemma-4-E2B-it-ONNX',
      'hf:HuggingFaceTB/SmolLM3-3B-ONNX',
    ]) {
      const resolved = resolveModelPricing(prefixModel);
      assert.strictEqual(resolved.id, 'on-device-nano');
      assert.strictEqual(resolved.effectiveInputPer1M, 0);
      assert.strictEqual(resolved.billingTier, 'on-device-ram');
    }

    const serverSource = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
    assert.ok(serverSource.includes("'gemma-4-26b-a4b-it'"), 'server.js must include gemma-4-26b-a4b-it in allowlist & catalog');
    assert.ok(serverSource.includes("lower.startsWith('webgpu:') || lower.startsWith('hf:')"), 'server.js getModel must sanitize webgpu:/hf: prefixes');

    const html = fs.readFileSync(path.join(ROOT, 'public', 'transparency.html'), 'utf8');
    assert.ok(html.includes('gemma-4-26b-a4b-it'), 'transparency.html must document gemma-4-26b-a4b-it');
  });

  test('WebGPU ONNX catalog, BrowserWebGpuEngine, and GeminiService helpers operate safely in Node', async () => {
    assert.strictEqual(WEBGPU_MODEL_CATALOG['smollm3-3b'].hfModelId, 'HuggingFaceTB/SmolLM3-3B-ONNX');
    assert.strictEqual(WEBGPU_MODEL_CATALOG['smollm3-3b'].dtype, 'q4f16');
    assert.strictEqual(WEBGPU_MODEL_CATALOG['gemma4-e2b'].hfModelId, 'onnx-community/gemma-4-E2B-it-ONNX');
    assert.strictEqual(WEBGPU_MODEL_CATALOG['gemma4-e2b'].isGemma4Multimodal, true);
    assert.strictEqual(WEBGPU_MODEL_CATALOG['medgemma-4b'].hfModelId, 'suhaibrashid17/medgemma-1.5-4b-it-ONNX-webgpu');
    assert.strictEqual(WEBGPU_MODEL_CATALOG['medgemma-4b'].dtype, 'q4');

    assert.strictEqual(resolveWebGpuModelSpec('webgpu:gemma4-e2b').key, 'gemma4-e2b');
    assert.strictEqual(resolveWebGpuModelSpec('hf:suhaibrashid17/medgemma-1.5-4b-it-ONNX-webgpu').key, 'medgemma-4b');
    assert.strictEqual(resolveWebGpuModelSpec('unknown-model').key, 'smollm3-3b');

    const engine = new BrowserWebGpuEngine();
    const support = await engine.checkWebGpuSupport();
    assert.strictEqual(support.supported, false);

    const cspMsg = formatWebGpuError('WebAssembly.instantiate blocked by Content Security Policy');
    assert.ok(cspMsg.includes("'wasm-unsafe-eval'"), 'formatWebGpuError must explain CSP wasm-unsafe-eval requirement');

    const prevStorage = globalThis.localStorage;
    const store = new Map();
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    };
    try {
      const service = new GeminiService();
      assert.strictEqual(service.getSelectedWebGpuModelKey(), 'smollm3-3b');
      service.setSelectedWebGpuModelKey('gemma4-e2b');
      assert.strictEqual(service.getSelectedWebGpuModelKey(), 'gemma4-e2b');
      const ok = await service.preloadWebGpuModel('gemma4-e2b');
      assert.strictEqual(ok, false);
      assert.strictEqual(service.webGpuProgress()?.status, 'error');
      assert.strictEqual(service.webGpuReadyModel(), null);
    } finally {
      globalThis.localStorage = prevStorage;
    }
  });

  test('TRL DPO scripts, Observatory CSP, and NGSW asset exclusions match modern baselines', () => {
    const trainScript = fs.readFileSync(path.join(ROOT, 'scripts', 'train_dpo_unified.py'), 'utf8');
    const datasetsReadme = fs.readFileSync(path.join(ROOT, 'datasets', 'README.md'), 'utf8');
    for (const [label, src] of [
      ['scripts/train_dpo_unified.py', trainScript],
      ['datasets/README.md', datasetsReadme],
    ]) {
      assert.ok(src.includes('processing_class=tokenizer'), `${label} must use modern TRL processing_class=tokenizer`);
      assert.ok(src.includes('eval_strategy="no"'), `${label} must use modern transformers eval_strategy="no"`);
      assert.ok(src.includes('max_length=1024') && src.includes('max_prompt_length=512'), `${label} must configure lengths inside DPOConfig`);
      assert.ok(!src.includes('tokenizer=tokenizer'), `${label} must not use deprecated tokenizer=tokenizer arg`);
      assert.ok(!src.includes('evaluation_strategy='), `${label} must not use deprecated evaluation_strategy= arg`);
    }

    const serverSource = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
    assert.ok(serverSource.includes(`scriptSrc: ["'self'", "'wasm-unsafe-eval'"]`), 'server.js CSP must allow wasm-unsafe-eval only');
    assert.ok(serverSource.includes(`workerSrc: ["'self'", "blob:"]`), 'server.js CSP must allow same-origin + blob workers');
    for (const hfHost of [
      'https://huggingface.co',
      'https://*.huggingface.co',
      'https://*.hf.co',
      'https://*.xethub.hf.co',
    ]) {
      assert.ok(serverSource.includes(hfHost), `server.js CSP connectSrc must include ${hfHost}`);
    }

    const firebaseJson = fs.readFileSync(path.join(ROOT, 'firebase.json'), 'utf8');
    assert.ok(firebaseJson.includes("script-src 'self';"), 'firebase.json must keep strict static script-src');
    assert.ok(firebaseJson.includes("worker-src 'self' blob:;"), 'firebase.json must allow WebGPU worker-src');
    assert.ok(firebaseJson.includes('https://huggingface.co'), 'firebase.json connect-src must include Hugging Face Hub');

    const ngsw = JSON.parse(fs.readFileSync(path.join(ROOT, 'ngsw-config.json'), 'utf8'));
    const assetFiles = ngsw.assetGroups.find((g) => g.name === 'assets')?.resources?.files || [];
    assert.ok(assetFiles.includes('!/assets/ort/**'), 'ngsw-config.json must exclude /assets/ort/** from eager prefetch');
    assert.ok(ngsw.navigationUrls.includes('!/transparency'), 'ngsw-config.json must exclude /transparency from SPA fallback');
    assert.ok(ngsw.navigationUrls.includes('!/transparency.html'), 'ngsw-config.json must exclude /transparency.html from SPA fallback');
  });
});
