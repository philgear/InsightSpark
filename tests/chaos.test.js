import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { GeminiService, ApiRetryError } from '../src/services/gemini.service.ts';

// Setup environment and mocks
const originalFetch = globalThis.fetch;
const originalSetTimeout = globalThis.setTimeout;

describe('GeminiService Chaos Engineering & Retry Resilience', () => {
  let service;
  let delayCalls = [];

  let store = {};
  before(() => {
    // Mock global localStorage
    globalThis.localStorage = {
      getItem: (key) => store[key] || null,
      setItem: (key, val) => { store[key] = String(val); },
      removeItem: (key) => { delete store[key]; }
    };

    // Mock global fetch
    globalThis.fetch = async (url, options) => {
      if (url === '/api/structure') {
        return {
          ok: true,
          json: async () => ({
            title: 'Structured Goal',
            condition: 'Simulated Condition',
            goal: 'Simulated Goal',
            barriers: ['Barrier 1']
          })
        };
      }
      return {
        ok: true,
        json: async () => []
      };
    };

    // Mock setTimeout to run instantly and record delays
    globalThis.setTimeout = (cb, ms) => {
      delayCalls.push(ms);
      return originalSetTimeout(cb, 0);
    };
  });

  after(() => {
    // Restore mocks
    globalThis.fetch = originalFetch;
    globalThis.setTimeout = originalSetTimeout;
    delete globalThis.localStorage;
  });

  test('Normal Mode: Should succeed on first attempt without retrying', async () => {
    service = new GeminiService();
    service.simulatedFailureType = null;
    delayCalls = [];

    const result = await service.structureHealthGoal('Test Problem');
    
    assert.strictEqual(result.title, 'Structured Goal');
    assert.strictEqual(delayCalls.length, 0, 'Should not have triggered any retries');
  });

  test('Model Configuration: Should forward x-gemini-model header when configured', async () => {
    let capturedHeaders = null;
    const prevFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      capturedHeaders = options?.headers;
      return { ok: true, json: async () => ({ title: 'Structured Goal' }) };
    };
    globalThis.localStorage.setItem('spark_model_val', 'gemini-4-hydrogen');
    try {
      service = new GeminiService();
      await service.structureHealthGoal('Test Problem');
      assert.strictEqual(capturedHeaders['x-gemini-model'], 'gemini-4-hydrogen');
    } finally {
      globalThis.fetch = prevFetch;
      globalThis.localStorage.removeItem('spark_model_val');
    }
  });

  test('Language Configuration: Should forward x-target-language header when configured', async () => {
    let capturedHeaders = null;
    const prevFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      capturedHeaders = options?.headers;
      return { ok: true, json: async () => ({ title: 'Structured Goal' }) };
    };
    globalThis.localStorage.setItem('spark_lang_val', 'ja');
    try {
      service = new GeminiService();
      await service.structureHealthGoal('Test Problem');
      assert.strictEqual(capturedHeaders['x-target-language'], 'ja');
    } finally {
      globalThis.fetch = prevFetch;
      globalThis.localStorage.removeItem('spark_lang_val');
    }
  });

  test('Transient 429 Mode: Should retry twice, wait exponentially, and resolve on the 3rd attempt', async () => {
    service = new GeminiService();
    service.simulatedFailureType = '429';
    service.simulatedFailureBehavior = 'transient';
    delayCalls = [];

    const result = await service.structureHealthGoal('Test Problem');

    assert.strictEqual(result.title, 'Structured Goal');
    assert.deepStrictEqual(delayCalls, [1000, 2000], 'Should have retried with exponential backoff delays (1s, 2s)');
  });

  test('Permanent 429 Mode: Should retry and throw ApiRetryError after max retries exceeded', async () => {
    service = new GeminiService();
    service.simulatedFailureType = '429';
    service.simulatedFailureBehavior = 'permanent';
    delayCalls = [];

    await assert.rejects(
      async () => {
        await service.structureHealthGoal('Test Problem');
      },
      (err) => {
        assert.ok(err instanceof ApiRetryError, 'Error should be an instance of ApiRetryError');
        assert.match(err.message, /failed after multiple attempts/, 'Should have a user-friendly failure message');
        return true;
      }
    );

    assert.deepStrictEqual(delayCalls, [1000, 2000], 'Should have retried twice before failing');
  });

  test('Transient 500 Mode: Should retry twice and succeed on 3rd attempt', async () => {
    service = new GeminiService();
    service.simulatedFailureType = '500';
    service.simulatedFailureBehavior = 'transient';
    delayCalls = [];

    const result = await service.structureHealthGoal('Test Problem');

    assert.strictEqual(result.title, 'Structured Goal');
    assert.deepStrictEqual(delayCalls, [1000, 2000], 'Should have retried with delays (1s, 2s)');
  });

  test('Permanent 500 Mode: Should retry and throw ApiRetryError', async () => {
    service = new GeminiService();
    service.simulatedFailureType = '500';
    service.simulatedFailureBehavior = 'permanent';
    delayCalls = [];

    await assert.rejects(
      async () => {
        await service.structureHealthGoal('Test Problem');
      },
      ApiRetryError
    );
  });

  test('Transient Network Drop: Should retry twice and succeed', async () => {
    service = new GeminiService();
    service.simulatedFailureType = 'drop';
    service.simulatedFailureBehavior = 'transient';
    delayCalls = [];

    const result = await service.structureHealthGoal('Test Problem');

    assert.strictEqual(result.title, 'Structured Goal');
    assert.deepStrictEqual(delayCalls, [1000, 2000]);
  });

  test('Permanent Network Drop: Should throw ApiRetryError', async () => {
    service = new GeminiService();
    service.simulatedFailureType = 'drop';
    service.simulatedFailureBehavior = 'permanent';
    delayCalls = [];

    await assert.rejects(
      async () => {
        await service.structureHealthGoal('Test Problem');
      },
      ApiRetryError
    );
  });

  describe('Demo Mode offline mocking', () => {
    let originalGetItem;
    
    before(() => {
      originalGetItem = globalThis.localStorage.getItem;
      globalThis.localStorage.getItem = (key) => {
        if (key === 'user_gemini_api_key' || key === 'spark_cfg_val') return 'demo-key-active';
        return null;
      };
    });

    after(() => {
      globalThis.localStorage.getItem = originalGetItem;
    });

    test('Demo Mode: should return mock structured problem instantly without fetch', async () => {
      service = new GeminiService();
      // Even if set to fail, Demo Mode should bypass API calls and succeed instantly
      service.simulatedFailureType = '500';
      service.simulatedFailureBehavior = 'permanent';
      
      const result = await service.structureHealthGoal('Test Grandma Hip Fracture');
      assert.strictEqual(result.condition, 'Post-hip fracture recovery');
      assert.ok(result.barriers.length > 0);
    });

    test('Demo Mode: should return mock insights for creative mode and care mode', async () => {
      service = new GeminiService();
      
      const creativeResult = await service.generateInsights(
        'Municipal park flood risk',
        [{ id: 'butterfly', name: 'Butterfly Effect' }],
        'creative'
      );
      assert.ok(creativeResult.length > 0);
      assert.strictEqual(creativeResult[0].strategyName, 'Butterfly Effect');
      
      const careResult = await service.generateInsights(
        'Grandmother fracture garden',
        [{ id: 'what-if', name: 'What-If', careModeName: 'What-If' }],
        'care'
      );
      assert.ok(careResult.length > 0);
    });
  });

  test('Edge 503 Resilience: Should fail fast on 503 and seamlessly fall back to client-side synthesis without retries', async () => {
    const prevFetch = globalThis.fetch;
    globalThis.localStorage.setItem('spark_cfg_val', 'webgpu-active');
    globalThis.fetch = async () => ({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      json: async () => { throw new Error('HTML 503 body'); }
    });
    try {
      service = new GeminiService();
      service.simulatedFailureType = null;
      delayCalls = [];

      const insights = await service.generateInsights(
        'Municipal park flood risk',
        [{ id: 'simplify', name: 'Eliminate & Simplify' }],
        'creative'
      );
      assert.ok(insights.length > 0, 'Should return client-side synthesized insights on 503');
      assert.strictEqual(delayCalls.length, 0, 'Should fail fast on 503 without wasting retry delays');

      const structured = await service.structureHealthGoal('Grandmother hip recovery garden');
      assert.ok(structured.title.length > 0, 'Should return structured problem on 503');
      assert.ok(service.fallbackNotice() && service.fallbackNotice().includes('503'), 'Should set fallbackNotice on 503 fallback');
    } finally {
      globalThis.fetch = prevFetch;
      globalThis.localStorage.removeItem('spark_cfg_val');
    }
  });

  test('SSE Framing: Reassembles split SSE chunks across TCP boundaries without dropping data', async () => {
    const prevFetch = globalThis.fetch;
    const payload = JSON.stringify({
      results: [
        { strategyName: 'What If?', insights: [{ text: 'Split-chunk insight one' }, { text: 'Split-chunk insight two' }] }
      ]
    });
    const sseFrame = `data: ${JSON.stringify({ text: payload })}\n\ndata: [DONE]\n\n`;
    const midpoint = Math.floor(sseFrame.length / 2);
    const encoder = new TextEncoder();
    const chunks = [
      encoder.encode(sseFrame.slice(0, midpoint)),
      encoder.encode(sseFrame.slice(midpoint))
    ];

    globalThis.fetch = async () => ({
      ok: true,
      body: new ReadableStream({
        start(controller) {
          for (const c of chunks) controller.enqueue(c);
          controller.close();
        }
      })
    });

    try {
      service = new GeminiService();
      service.simulatedFailureType = null;
      const updates = [];
      const res = await service.generateInsights(
        'How to coordinate volunteer garden shifts',
        [{ id: 'what-if', name: 'What If?' }],
        'creative',
        undefined,
        undefined,
        (partial) => updates.push(partial)
      );
      assert.strictEqual(res.length, 1);
      assert.strictEqual(res[0].strategyName, 'What If?');
      assert.strictEqual(res[0].insights.length, 2);
      assert.strictEqual(res[0].insights[0].text, 'Split-chunk insight one');
      assert.strictEqual(res[0].insights[1].text, 'Split-chunk insight two');
      assert.strictEqual(service.fallbackNotice(), null, 'Live 200 response should clear fallbackNotice');
    } finally {
      globalThis.fetch = prevFetch;
    }
  });

  test('SSE Error Propagation: Mid-stream error event rejects instead of returning empty array', async () => {
    const prevFetch = globalThis.fetch;
    const encoder = new TextEncoder();
    const sseError = `data: ${JSON.stringify({ error: 'Local Ollama error (404): model missing' })}\n\n`;

    globalThis.fetch = async () => ({
      ok: true,
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(sseError));
          controller.close();
        }
      })
    });

    try {
      service = new GeminiService();
      service.simulatedFailureType = null;
      await assert.rejects(
        async () => {
          await service.generateInsights(
            'Stream error test prompt',
            [{ id: 'what-if', name: 'What If?' }],
            'creative'
          );
        },
        /Local Ollama error \(404\)/
      );
    } finally {
      globalThis.fetch = prevFetch;
    }
  });

  test('Extraction Resilience: Filters empty stubs and extracts Ollama map & wrapped object formats', async () => {
    const prevFetch = globalThis.fetch;
    const encoder = new TextEncoder();
    const strategies = [{ id: 'what-if', name: 'What If?' }];

    const cases = [
      JSON.stringify({ 'What If?': ['String idea A', 'String idea B'] }),
      JSON.stringify({ results: [{ strategyName: 'What If?', insights: [{}, { text: 'Valid insight' }] }] }),
      JSON.stringify({ insights: [{ text: 'Flat insight A' }, { text: 'Flat insight B' }] })
    ];

    try {
      for (let idx = 0; idx < cases.length; idx++) {
        const bodyText = `data: ${JSON.stringify({ text: cases[idx] })}\n\ndata: [DONE]\n\n`;
        globalThis.fetch = async () => ({
          ok: true,
          body: new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode(bodyText));
              controller.close();
            }
          })
        });

        service = new GeminiService();
        service.simulatedFailureType = null;
        const res = await service.generateInsights(
          `Extraction test ${idx}`,
          strategies,
          'creative'
        );
        assert.strictEqual(res.length, 1);
        assert.strictEqual(res[0].strategyName, 'What If?');
        assert.ok(res[0].insights.every(item => typeof item.text === 'string' && item.text.length > 0));
      }
    } finally {
      globalThis.fetch = prevFetch;
    }
  });

  test('Mock Scenario Matching: Avoids substring false-positives on "start" or "parking"', async () => {
    const prevGetItem = globalThis.localStorage.getItem;
    globalThis.localStorage.getItem = (key) => {
      if (key === 'spark_cfg_val') return 'demo-key-active';
      return null;
    };

    try {
      service = new GeminiService();
      const startRes = await service.generateInsights(
        'How to start a community tool library',
        [{ id: 'simplify', name: 'Eliminate & Simplify' }],
        'creative'
      );
      assert.ok(
        startRes[0].insights.some(i => i.text.includes('How to start a community tool library')),
        'Should route custom "start" prompt to custom dynamic fallback, not unrelated starter scenario'
      );

      const parkRes = await service.generateInsights(
        'Parking lot solar canopy retrofit',
        [{ id: 'simplify', name: 'Eliminate & Simplify' }],
        'creative'
      );
      assert.ok(
        parkRes[0].insights.some(i => i.text.includes('Parking lot solar canopy retrofit')),
        'Should route custom "Parking" prompt to custom dynamic fallback, not municipal flood park'
      );
    } finally {
      globalThis.localStorage.getItem = prevGetItem;
    }
  });
});

