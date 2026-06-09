import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { GeminiService, ApiRetryError } from '../src/services/gemini.service.js';

// Setup environment and mocks
const originalFetch = globalThis.fetch;
const originalSetTimeout = globalThis.setTimeout;

describe('GeminiService Chaos Engineering & Retry Resilience', () => {
  let service;
  let delayCalls = [];

  before(() => {
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
  });

  test('Normal Mode: Should succeed on first attempt without retrying', async () => {
    service = new GeminiService();
    service.simulatedFailureType = null;
    delayCalls = [];

    const result = await service.structureHealthGoal('Test Problem');
    
    assert.strictEqual(result.title, 'Structured Goal');
    assert.strictEqual(delayCalls.length, 0, 'Should not have triggered any retries');
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
});
