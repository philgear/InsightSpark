#!/usr/bin/env node
/**
 * scripts/cost-simulator.mjs
 *
 * Reproducible Unit Economics & Cost Transparency Simulator for Pivot & Pulse (InsightSpark).
 * Empirically inspects server.js system prompts & strategy definitions, models per-endpoint
 * token footprints across thinking levels and model tiers, simulates monthly traffic
 * scenarios & worst-case burst exposure, and generates docs/cost_transparency_ledger.md.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const serverPath = path.join(ROOT, 'server.js');
const serverSource = fs.readFileSync(serverPath, 'utf8');

function estimateTokensFromChars(chars) {
  return Math.max(0, Math.ceil(chars / 4));
}

function measureServerPrompts(src) {
  const civicMatch = src.match(/const CIVIC_NEUTRALITY_INSTRUCTION = `([\s\S]*?)`;/);
  const hipaaMatch = src.match(/const HIPAA_SYSTEM_INSTRUCTION = `([\s\S]*?)`;/);
  const strategyMapMatch = src.match(/const STRATEGY_MAP = \{([\s\S]*?)\n\};/);

  const civicText = civicMatch ? civicMatch[1] : '';
  const hipaaRaw = hipaaMatch ? hipaaMatch[1] : '';
  const hipaaText = hipaaRaw.replace('${CIVIC_NEUTRALITY_INSTRUCTION}', civicText);
  const strategyBlock = strategyMapMatch ? strategyMapMatch[1] : '';
  const strategyCount = (strategyBlock.match(/^\s*'[a-z0-9-]+'\s*:/gm) || []).length;

  return {
    civicChars: civicText.length,
    civicTokens: estimateTokensFromChars(civicText.length),
    hipaaChars: hipaaText.length,
    hipaaTokens: estimateTokensFromChars(hipaaText.length),
    strategyCount,
    strategyMapChars: strategyBlock.length,
    strategyMapTokens: estimateTokensFromChars(strategyBlock.length),
  };
}

const MODEL_RATES = {
  'gemini-4-hydrogen': {
    id: 'gemini-4-hydrogen',
    label: 'Gemini 4 Hydrogen (Default)',
    inputPer1M: 1.50,
    outputPer1M: 7.50,
    cachedInputPer1M: 0.075,
    freeTier: 'Yes (rate-limited)',
    tierLabel: 'Cloud Default',
  },
  'gemini-4-argon-nov': {
    id: 'gemini-4-argon',
    label: 'Gemini 4 Argon (through 2026-11-30)',
    inputPer1M: 2.00,
    outputPer1M: 10.00,
    cachedInputPer1M: 0.20,
    freeTier: 'No (Paid only)',
    tierLabel: 'Cloud Fast (Nov 2026)',
  },
  'gemini-4-argon-dec': {
    id: 'gemini-4-argon (Dec 1+)',
    label: 'Gemini 4 Argon (from 2026-12-01)',
    inputPer1M: 4.00,
    outputPer1M: 20.00,
    cachedInputPer1M: 0.40,
    freeTier: 'No (Paid only)',
    tierLabel: 'Cloud Fast (2x Scheduled)',
  },
  'gemini-3.5-flash-lite': {
    id: 'gemini-3.5-flash-lite',
    label: 'Gemini 3.5 Flash-Lite',
    inputPer1M: 0.30,
    outputPer1M: 2.50,
    cachedInputPer1M: 0.03,
    freeTier: 'Yes (high RPM)',
    tierLabel: 'Cloud Budget',
  },
  'gemma-4-31b-it': {
    id: 'gemma-4-31b-it',
    label: 'Gemma 4 31B (Google Hosted)',
    inputPer1M: 0.00,
    outputPer1M: 0.00,
    cachedInputPer1M: 0.00,
    freeTier: 'Yes ($0 Open-Weight)',
    tierLabel: 'Cloud Open-Weight Free',
  },
  'gemma-4-26b-a4b-it': {
    id: 'gemma-4-26b-a4b-it',
    label: 'Gemma 4 26B A4B MoE (Google Hosted)',
    inputPer1M: 0.00,
    outputPer1M: 0.00,
    cachedInputPer1M: 0.00,
    freeTier: 'Yes ($0 Open-Weight MoE)',
    tierLabel: 'Cloud Open-Weight MoE (3.8B Active)',
  },
  'on-device-nano': {
    id: 'on-device-nano',
    label: 'In-Browser RAM (window.ai / WebGPU)',
    inputPer1M: 0.00,
    outputPer1M: 0.00,
    cachedInputPer1M: 0.00,
    freeTier: 'Yes (0 bytes egress)',
    tierLabel: 'On-Device RAM',
  },
  ollama: {
    id: 'ollama:pivotpulse',
    label: 'Workstation Ollama (Local VRAM)',
    inputPer1M: 0.00,
    outputPer1M: 0.00,
    cachedInputPer1M: 0.00,
    freeTier: 'Yes (Self-hosted GPU)',
    tierLabel: 'Local VRAM',
  },
};

const THINKING_MULTIPLIERS = {
  low: 1.0,
  medium: 1.6,
  high: 2.5,
  xhigh: 4.0,
};

function computeEndpointProfiles(measured) {
  return [
    {
      endpoint: '/api/structure',
      label: 'Structure Goal + DSRP',
      calls: 1,
      inputTokens: measured.hipaaTokens + 340,
      outputTokens: 320,
      baseThoughtTokens: 220,
    },
    {
      endpoint: '/api/insights',
      label: 'Stream Insights (3 strategies)',
      calls: 1,
      inputTokens: measured.hipaaTokens + 620,
      outputTokens: 780,
      baseThoughtTokens: 360,
    },
    {
      endpoint: '/api/care-plan',
      label: 'Synthesize Care Plan',
      calls: 1,
      inputTokens: measured.hipaaTokens + 740,
      outputTokens: 680,
      baseThoughtTokens: 340,
    },
    {
      endpoint: '/api/creative-plan',
      label: 'Synthesize Creative Plan',
      calls: 1,
      inputTokens: measured.civicTokens + 620,
      outputTokens: 560,
      baseThoughtTokens: 300,
    },
    {
      endpoint: '/api/translate',
      label: 'Translate Plan / Card',
      calls: 1,
      inputTokens: 580,
      outputTokens: 540,
      baseThoughtTokens: 120,
    },
    {
      endpoint: '/api/agent/pipeline',
      label: '4-Phase Agentic Debate',
      calls: 4,
      inputTokens: measured.hipaaTokens * 2 + measured.strategyMapTokens + 1650,
      outputTokens: 2150,
      baseThoughtTokens: 960,
    },
  ];
}

function estimateEndpointCostUsd(profile, rate, thinkingLevel = 'high') {
  const mult = THINKING_MULTIPLIERS[thinkingLevel] ?? 2.5;
  const thoughtTokens = Math.round(profile.baseThoughtTokens * mult);
  const billableOutput = profile.outputTokens + thoughtTokens;
  const usd =
    (profile.inputTokens * rate.inputPer1M + billableOutput * rate.outputPer1M) / 1_000_000;
  return {
    inputTokens: profile.inputTokens,
    outputTokens: profile.outputTokens,
    thoughtTokens,
    totalTokens: profile.inputTokens + billableOutput,
    usd,
  };
}

function formatCents(usd) {
  if (usd <= 0) return '$0.000¢';
  const cents = usd * 100;
  return `${cents.toFixed(3)}¢`;
}

function formatMoney(usd) {
  if (usd <= 0) return '$0.00';
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

function buildReport() {
  const measured = measureServerPrompts(serverSource);
  const profiles = computeEndpointProfiles(measured);

  // Typical caregiver/ideation session mix (1 session = 1 structure + 1 insights + 0.5 care-plan + 0.2 pipeline + 0.2 translate)
  const SESSION_WEIGHTS = {
    '/api/structure': 1.0,
    '/api/insights': 1.0,
    '/api/care-plan': 0.5,
    '/api/creative-plan': 0.0,
    '/api/translate': 0.2,
    '/api/agent/pipeline': 0.2,
  };

  const sessionCost = (rateKey, thinkingLevel) => {
    const rate = MODEL_RATES[rateKey];
    let total = 0;
    for (const p of profiles) {
      const w = SESSION_WEIGHTS[p.endpoint] || 0;
      if (w > 0) {
        total += w * estimateEndpointCostUsd(p, rate, thinkingLevel).usd;
      }
    }
    return total;
  };

  const defaultCloudSessionUsd = sessionCost('gemini-4-hydrogen', 'high');
  const optimizedCloudSessionUsd =
    // Flash-Lite low thinking for structure & translate; Flash-Lite medium for insights/care-plan; Hydrogen medium for pipeline
    1.0 * estimateEndpointCostUsd(profiles[0], MODEL_RATES['gemini-3.5-flash-lite'], 'low').usd +
    1.0 * estimateEndpointCostUsd(profiles[1], MODEL_RATES['gemini-3.5-flash-lite'], 'medium').usd +
    0.5 * estimateEndpointCostUsd(profiles[2], MODEL_RATES['gemini-3.5-flash-lite'], 'medium').usd +
    0.2 * estimateEndpointCostUsd(profiles[4], MODEL_RATES['gemini-3.5-flash-lite'], 'low').usd +
    0.2 * estimateEndpointCostUsd(profiles[5], MODEL_RATES['gemini-4-hydrogen'], 'medium').usd;
  const hybrid60LocalSessionUsd = 0.4 * optimizedCloudSessionUsd;

  const mauTiers = [100, 1000, 10000, 50000];
  const sessionsPerMau = 3;

  // Worst-case single-IP burst: server.js apiLimiter = 20 req / 15 min = 80 req/hr
  const pipelineProfile = profiles.find((p) => p.endpoint === '/api/agent/pipeline');
  const burstHourlyHydrogen =
    80 * estimateEndpointCostUsd(pipelineProfile, MODEL_RATES['gemini-4-hydrogen'], 'xhigh').usd;
  const burstHourlyArgonNov =
    80 * estimateEndpointCostUsd(pipelineProfile, MODEL_RATES['gemini-4-argon-nov'], 'xhigh').usd;
  const burstHourlyArgonDec =
    80 * estimateEndpointCostUsd(pipelineProfile, MODEL_RATES['gemini-4-argon-dec'], 'xhigh').usd;

  const lines = [];
  lines.push('# Pivot & Pulse (InsightSpark) — Unit Economics & Cost Transparency Ledger');
  lines.push('');
  lines.push('> Generated reproducibly by `scripts/cost-simulator.mjs` from live prompt constants in `server.js` and verified November 2026 Gemini API rate cards.');
  lines.push('');
  lines.push('## Empirical Prompt Overhead Measured from `server.js`');
  lines.push('');
  lines.push('| System Constant | Measured Characters | Estimated Tokens (~4 chars/tok) | Scope |');
  lines.push('|---|---:|---:|---|');
  lines.push(`| \`CIVIC_NEUTRALITY_INSTRUCTION\` | ${measured.civicChars.toLocaleString()} | ${measured.civicTokens.toLocaleString()} | Creative endpoints |`);
  lines.push(`| \`HIPAA_SYSTEM_INSTRUCTION\` (incl. Civic) | ${measured.hipaaChars.toLocaleString()} | ${measured.hipaaTokens.toLocaleString()} | Care & structure endpoints |`);
  lines.push(`| \`STRATEGY_MAP\` (${measured.strategyCount} strategies) | ${measured.strategyMapChars.toLocaleString()} | ${measured.strategyMapTokens.toLocaleString()} | \`/api/agent/select\` & pipeline Phase 1 |`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 1. Model Pricing Rate Card (USD per 1M Tokens)');
  lines.push('');
  lines.push('> [!WARNING]');
  lines.push('> **Scheduled Rate Change (2026-12-01):** `gemini-4-argon` doubles from `$2.00 / $10.00` per 1M tokens (through 2026-11-30) to **`$4.00 / $20.00` per 1M tokens** starting **2026-12-01** and has **no Free Tier**. `gemini-4-hydrogen` (`$1.50 / $7.50`) and `gemma-4-31b-it` (`$0.00`) remain far more cost-effective defaults.');
  lines.push('');
  lines.push('| Model / Engine | Billing Tier | Input / 1M | Output + Thought / 1M | Cached Input / 1M | Free Tier |');
  lines.push('|---|---|---:|---:|---:|---|');
  for (const key of Object.keys(MODEL_RATES)) {
    const r = MODEL_RATES[key];
    lines.push(
      `| \`${r.id}\` | ${r.tierLabel} | $${r.inputPer1M.toFixed(2)} | $${r.outputPer1M.toFixed(2)} | $${r.cachedInputPer1M.toFixed(3)} | ${r.freeTier} |`
    );
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 2. Per-Action Cost Matrix (Cents USD per Click)');
  lines.push('');
  lines.push('Reasoning (`thoughtTokens`) is billed at each model’s **output token rate**. Default UI thinking level is **`high`** (~2.5× base thought tokens); **`low`** (~1.0×) cuts reasoning overhead by 60%.');
  lines.push('');
  lines.push('| Endpoint | Action | Calls | Est. Tokens (`high`) | Hydrogen (`high`) | Hydrogen (`low`) | Flash-Lite (`low`) | Argon Dec 1+ (`high`) | Gemma 4 31B / Local |');
  lines.push('|---|---|---:|---:|---:|---:|---:|---:|---:|');
  for (const p of profiles) {
    const hHigh = estimateEndpointCostUsd(p, MODEL_RATES['gemini-4-hydrogen'], 'high');
    const hLow = estimateEndpointCostUsd(p, MODEL_RATES['gemini-4-hydrogen'], 'low');
    const flLow = estimateEndpointCostUsd(p, MODEL_RATES['gemini-3.5-flash-lite'], 'low');
    const argDec = estimateEndpointCostUsd(p, MODEL_RATES['gemini-4-argon-dec'], 'high');
    lines.push(
      `| \`${p.endpoint}\` | ${p.label} | ${p.calls} | ${hHigh.totalTokens.toLocaleString()} | ${formatCents(hHigh.usd)} | ${formatCents(hLow.usd)} | ${formatCents(flLow.usd)} | ${formatCents(argDec.usd)} | $0.00 |`
    );
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 3. Monthly Traffic Scenario Simulator (3 Sessions / Active User / Month)');
  lines.push('');
  lines.push('Session blend modeled per user-month (3 sessions total): `1.0× /api/structure` + `1.0× /api/insights` + `0.5× /api/care-plan` + `0.2× /api/agent/pipeline` + `0.2× /api/translate` per session.');
  lines.push('');
  lines.push(`- **100% Cloud Default (\`gemini-4-hydrogen\`, \`high\` thinking):** ${formatMoney(defaultCloudSessionUsd)} / session`);
  lines.push(`- **Optimized Cloud (\`gemini-3.5-flash-lite\` low/med + Hydrogen med pipeline):** ${formatMoney(optimizedCloudSessionUsd)} / session`);
  lines.push(`- **60% Local-First Hybrid (60% Ollama / \`window.ai\` / Gemma 4 31B @ $0 + 40% Optimized Cloud):** ${formatMoney(hybrid60LocalSessionUsd)} / session`);
  lines.push('');
  lines.push('| Monthly Active Users (MAU) | Monthly Sessions | 100% Cloud Default | Optimized Cloud | 60% Local-First Hybrid | Monthly Savings vs. Default |');
  lines.push('|---:|---:|---:|---:|---:|---:|');
  for (const mau of mauTiers) {
    const sessions = mau * sessionsPerMau;
    const defCost = sessions * defaultCloudSessionUsd;
    const optCost = sessions * optimizedCloudSessionUsd;
    const hybCost = sessions * hybrid60LocalSessionUsd;
    lines.push(
      `| ${mau.toLocaleString()} | ${sessions.toLocaleString()} | ${formatMoney(defCost)} | ${formatMoney(optCost)} | ${formatMoney(hybCost)} | ${formatMoney(defCost - hybCost)} |`
    );
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 4. Cost Containment & Zero-Retention Architecture');
  lines.push('');
  lines.push('- **Scale-to-Zero Serverless Hosting:** Static frontend assets are served from CDN while the stateless Node/Express API proxy scales down to zero idle instances (`$0.00` baseline idle compute).');
  lines.push('- **Hosted-Key Guardrails:** Anonymous requests routed through the maintainer-hosted key are constrained to the approved cost-bounded model allowlist (`gemini-4-hydrogen`, `gemini-3.5-flash-lite`, `gemma-4-31b-it`, `gemma-4-26b-a4b-it`), with reasoning capped at `medium` (`low` for 4-phase dialectic debates).');
  lines.push('- **BYOK & $0 Local Offload:** Supplying your own Gemini API key or switching to `window.ai` / WebGPU / local Ollama (`pivotpulse`) unlocks unrestricted tiers while shifting cloud cost to `$0.00`.');
  lines.push('- **Zero Disk Retention:** All Gemini Interactions calls specify `store: false`, and session token receipts remain strictly in browser memory with zero prompt or PII persistence.');
  lines.push('');

  const auditLines = [];
  auditLines.push('# Operator Private GCP & Burst Audit (Gitignored)');
  auditLines.push('');
  auditLines.push('> Generated locally into `scratch/operator-gcp-audit.md` (gitignored). Do not commit internal infrastructure identifiers or abuse-ceiling calculations.');
  auditLines.push('');
  auditLines.push('## 1. Worst-Case Burst & Abuse Ceiling (Pre-Hardening Reference vs. Hosted Caps)');
  auditLines.push('');
  auditLines.push('`server.js` enforces an in-memory per-IP rate limit of **20 requests / 15 minutes** (`80 req/hr`) on `/api/*`. If a single IP continuously saturates the 4-call `/api/agent/pipeline` endpoint at `xhigh` thinking (possible only with BYOK after hosted thinking-cap hardening):');
  auditLines.push('');
  auditLines.push('| Scenario | Requests / Hour | Model & Thinking | Hourly Burst Exposure | 24-Hour Single-IP Ceiling |');
  auditLines.push('|---|---:|---|---:|---:|');
  auditLines.push(`| Default Cloud Burst | 80 | \`gemini-4-hydrogen\` (\`xhigh\`) | ${formatMoney(burstHourlyHydrogen)}/hr | ${formatMoney(burstHourlyHydrogen * 24)}/day |`);
  auditLines.push(`| Argon Burst (Nov 2026) | 80 | \`gemini-4-argon\` (\`xhigh\`) | ${formatMoney(burstHourlyArgonNov)}/hr | ${formatMoney(burstHourlyArgonNov * 24)}/day |`);
  auditLines.push(`| Argon Burst (Dec 1+, 2×) | 80 | \`gemini-4-argon\` (\`xhigh\`) | ${formatMoney(burstHourlyArgonDec)}/hr | ${formatMoney(burstHourlyArgonDec * 24)}/day |`);
  auditLines.push('');
  auditLines.push('**Infrastructure Compute Ceiling:** Cloud Run `pivot-pulse` is capped at `maxScale: 5` containers (`80` concurrent requests each = 400 max concurrent requests, `1 vCPU`, `512Mi`, `300s` timeout). Because `apiLimiter` is stored in-memory per container instance, a distributed attack across `5` warm instances allows up to `5 × 80 = 400 req/hr` per IP unless fronted by Cloud Armor / API key BYOK.');
  auditLines.push('');
  auditLines.push('## 2. Audited GCP / Firebase Infrastructure Baseline (`insightspark-82c75`)');
  auditLines.push('');
  auditLines.push('Read-only inspection executed via `gcloud` against project `insightspark-82c75`:');
  auditLines.push('');
  auditLines.push('| Attribute | Audited Live Value | Cost & Operational Implication |');
  auditLines.push('|---|---|---|');
  auditLines.push('| **Hosting & Routing** | Firebase Hosting (`dist/`) → Cloud Run `pivot-pulse` (`us-west1`) | Static assets served globally; dynamic `/api/*` rewritten to Cloud Run |');
  auditLines.push('| **Latest Ready Revision** | `pivot-pulse-00052-z8h` (52 revisions since `2026-06-09`) | 100% traffic routed to latest revision; `Ready=True` |');
  auditLines.push('| **Scaling Posture** | `minScale` unset (**scales to 0**), `maxScale: "5"`, `concurrency: 80` | **$0.00 idle compute cost**; bounded blast radius during spikes |');
  auditLines.push('| **Container Resources** | `1000m` (1 vCPU), `512Mi` RAM, `300s` request timeout | Request-based CPU billing; Cloud Run free tier covers 180k vCPU-s & 360k GiB-s/mo |');
  auditLines.push('| **Project Billing State** | `BILLING_DISABLED` (`403 PERMISSION_DENIED` on Artifact Registry check as of 2026-11-23) | **Live GCP spend is `$0.00/mo`** while billing is disabled |');
  auditLines.push('| **Hidden Storage Risk** | 52+ container images in `us-west1-docker.pkg.dev/insightspark-82c75/cloud-run-source-deploy/pivot-pulse` + `gs://run-sources-insightspark-82c75-us-west1` | If billing is re-enabled, Artifact Registry free tier is `0.5 GB/mo`; old revisions accumulate monthly GB-month charges |');
  auditLines.push('');
  auditLines.push('### Operator Guardrails Checklist (Manual Authorization Required)');
  auditLines.push('');
  auditLines.push('- [ ] **Enable Budget Alerts:** Set GCP Billing budget alerts at `$5`, `$25`, and `$50` before re-enabling billing.');
  auditLines.push('- [ ] **Artifact Registry Cleanup Policy:** Configure a keep-most-recent-5 policy on `cloud-run-source-deploy` to prune the 47+ legacy container images.');
  auditLines.push('- [ ] **Gemini API Key Caps:** Enforce monthly spending caps and per-minute quota limits in Google AI Studio / Cloud Console, and encourage **Local Ollama (`pivotpulse`)**, **In-Browser (`window.ai`)**, or **Gemma 4 31B (`$0`)** for high-frequency exploration.');
  auditLines.push('');

  return {
    publicMarkdown: lines.join('\n'),
    privateAuditMarkdown: auditLines.join('\n'),
  };
}

const { publicMarkdown, privateAuditMarkdown } = buildReport();
const outPath = path.join(ROOT, 'docs', 'cost_transparency_ledger.md');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, publicMarkdown, 'utf8');

const privateOutPath = path.join(ROOT, 'scratch', 'operator-gcp-audit.md');
fs.mkdirSync(path.dirname(privateOutPath), { recursive: true });
fs.writeFileSync(privateOutPath, privateAuditMarkdown, 'utf8');

console.log('✅ Public cost transparency ledger generated at docs/cost_transparency_ledger.md');
console.log('🔒 Private operator GCP audit generated at scratch/operator-gcp-audit.md (gitignored)');
