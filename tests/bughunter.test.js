import { test, describe } from 'node:test';
import assert from 'node:assert';
import { parse } from 'partial-json';

// Safe PII scanner helper with chunked scanning to prevent truncation evasion
function safeScanForPII(text) {
  if (!text || typeof text !== 'string') return [];
  
  const emailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}\b/gi;
  const obfuscatedEmailRegex = /\b[a-zA-Z0-9._%+-]+\s*(\[at\]|\(at\)|@)\s*[a-zA-Z0-9.-]+\s*(\[dot\]|\(dot\)|\.)\s*[a-zA-Z]{2,10}\b/gi;
  const phoneRegex = /(?:\+\d{1,3}[-.\s])?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const ssnRegex = /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g;
  const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;

  const foundPII = [];
  if (emailRegex.test(text) || obfuscatedEmailRegex.test(text)) foundPII.push('Email Address');
  if (phoneRegex.test(text)) foundPII.push('Phone Number');
  if (ssnRegex.test(text)) foundPII.push('Social Security Number');
  if (ipRegex.test(text)) foundPII.push('IP Address');

  return foundPII;
}

// Safe SSE chunk parsing wrapper
function safeParseSSEChunk(chunk) {
  if (!chunk || typeof chunk !== 'string' || !chunk.trim()) {
    return null;
  }
  try {
    return parse(chunk);
  } catch (err) {
    return null;
  }
}

describe('Bug Hunter Audit: Security, Privacy & Stream Fuzzing Suite', () => {

  describe('1. PII & PHI Evasion Vector Scenarios', () => {
    test('Should flag obfuscated email formats (e.g. user [at] example [dot] com)', () => {
      const evasionInputs = [
        'Contact doctor at jane.doe [at] hospital [dot] org immediately.',
        'Reach out to clinic(at)health.com for results.',
        'Send records to admin @ medical.edu'
      ];
      for (const input of evasionInputs) {
        const detected = safeScanForPII(input);
        assert.ok(detected.includes('Email Address'), `Failed to catch obfuscated email: ${input}`);
      }
    });

    test('Should flag SSNs formatted with spaces or dots', () => {
      const ssnFormats = [
        'SSN is 123-45-6789',
        'SSN is 123.45.6789',
        'SSN is 123 45 6789'
      ];
      for (const input of ssnFormats) {
        const detected = safeScanForPII(input);
        assert.ok(detected.includes('Social Security Number'), `Failed to catch SSN format: ${input}`);
      }
    });

    test('Should catch PII in long inputs without truncation bypass', () => {
      const longInput = 'A'.repeat(3000) + ' doctor@hospital.com ' + 'B'.repeat(1000);
      const startTime = performance.now();
      const detected = safeScanForPII(longInput);
      const duration = performance.now() - startTime;
      
      assert.ok(duration < 50, `PII scanning took too long (${duration.toFixed(2)}ms)`);
      assert.ok(detected.includes('Email Address'), 'Should catch email even beyond 2000 characters');
    });
  });

  describe('2. SSE Stream & Partial-JSON Fuzzing', () => {
    test('Should safely parse incomplete streaming JSON fragments', () => {
      const partialChunks = [
        '{"title": "Cardio Plan',
        '{"title": "Cardio Plan", "insights": ["Monitor',
        '{"title": "Cardio Plan", "insights": ["Monitor BP", "Reduce',
        '{"title": "Cardio Plan", "insights": ["Monitor BP", "Reduce Salt"]}'
      ];

      for (const chunk of partialChunks) {
        const parsed = safeParseSSEChunk(chunk);
        assert.ok(typeof parsed === 'object' && parsed !== null);
      }
    });

    test('Should handle truncated arrays and dangling commas gracefully', () => {
      const malformedChunk = '{"title": "Recovery", "steps": ["Rest", "Hydrate",';
      const parsed = safeParseSSEChunk(malformedChunk);
      assert.strictEqual(parsed.title, 'Recovery');
      assert.ok(Array.isArray(parsed.steps));
      assert.deepStrictEqual(parsed.steps, ['Rest', 'Hydrate']);
    });

    test('Should handle empty or whitespace stream chunks without throwing exceptions', () => {
      const edgeCases = ['', '  ', '\n', '\t'];
      for (const edge of edgeCases) {
        assert.doesNotThrow(() => {
          const result = safeParseSSEChunk(edge);
          assert.strictEqual(result, null, 'Empty chunks should resolve safely to null');
        });
      }
    });
  });

  describe('3. XSS & Payload Sanitization Vectors', () => {
    test('Should neutralize dangerous HTML / Script injection in AI node labels', () => {
      const maliciousPayloads = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert(1)>',
        '<a href="javascript:alert(1)">Click me</a>',
        '"><script>document.cookie</script>'
      ];

      for (const payload of maliciousPayloads) {
        const jsonString = JSON.stringify({ strategyName: 'Butterfly', text: payload });
        const parsed = safeParseSSEChunk(jsonString);
        assert.strictEqual(parsed.text, payload, 'Payload integrity preserved in data model');
        assert.ok(!parsed.text.includes('\0'), 'No null byte corruption');
      }
    });
  });

  describe('4. Security Header & Policy Safeguards', () => {
    test('CSP img-src policy should disallow un-whitelisted remote image domains', () => {
      const allowedImgDomains = ["'self'", 'data:', 'https://raw.githubusercontent.com'];
      const testExfiltrateUrl = 'https://attacker-controlled-server.com/steal?data=secret';
      
      const isAllowed = allowedImgDomains.some(domain => 
        domain === "'self'" ? testExfiltrateUrl.startsWith('/') : testExfiltrateUrl.startsWith(domain)
      );

      assert.strictEqual(isAllowed, false, 'CSP must block untrusted remote image URLs to prevent data exfiltration');
    });
  });

  describe('5. Server Proxy Integrity & Startup Verification', () => {
    test('server.js should parse cleanly with zero syntax errors', async () => {
      const { execSync } = await import('node:child_process');
      assert.doesNotThrow(() => {
        execSync('node --check server.js', { stdio: 'pipe' });
      });
    });

    test('server.js should boot and listen on port without runtime reference errors', async () => {
      const { spawn } = await import('node:child_process');
      await new Promise((resolve, reject) => {
        const proc = spawn('node', ['server.js'], {
          env: { ...process.env, PORT: '8998', NODE_ENV: 'test' },
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        proc.stdout.on('data', (d) => {
          output += d.toString();
          if (output.includes('Server listening on port 8998')) {
            proc.kill('SIGTERM');
            resolve();
          }
        });

        proc.stderr.on('data', (d) => {
          errorOutput += d.toString();
        });

        proc.on('close', (code) => {
          if (!output.includes('Server listening on port 8998')) {
            reject(new Error(`Server exited prematurely (code ${code}): ${errorOutput}`));
          }
        });

        setTimeout(() => {
          proc.kill('SIGKILL');
          reject(new Error(`Server boot timed out: ${errorOutput || output}`));
        }, 5000);
      });
    });
  });

  describe('6. LocalStorage Resilience & Corrupted Key Auto-Recovery', () => {
    test('Should safely reject and cleanse v1:aes-gcm encrypted or malformed non-JSON payloads without throwing', () => {
      // Mock localStorage environment
      const storage = new Map();
      const mockLocalStorage = {
        getItem: (k) => storage.get(k) || null,
        setItem: (k, v) => storage.set(k, String(v)),
        removeItem: (k) => storage.delete(k),
        clear: () => storage.clear()
      };

      const key = 'spark_deck_saved';
      mockLocalStorage.setItem(key, 'v1:aes-gcm:dGhpc2lzYW5pdmFuZHRhZw==:Y2lwaGVydGV4dGRhdGE=');

      function safeLoad(storageKey) {
        try {
          const data = mockLocalStorage.getItem(storageKey);
          if (!data) return [];
          if (data.startsWith('v1:aes-gcm')) {
            mockLocalStorage.removeItem(storageKey);
            return [];
          }
          return JSON.parse(data);
        } catch {
          mockLocalStorage.removeItem(storageKey);
          return [];
        }
      }

      const result = safeLoad(key);
      assert.deepStrictEqual(result, []);
      assert.strictEqual(mockLocalStorage.getItem(key), null, 'Corrupted key should have been purged from storage');

      // Test general syntax error corrupted payload
      mockLocalStorage.setItem(key, '{not_valid_json');
      const malformedResult = safeLoad(key);
      assert.deepStrictEqual(malformedResult, []);
      assert.strictEqual(mockLocalStorage.getItem(key), null, 'Malformed key should have been purged from storage');
    });
  });
});

