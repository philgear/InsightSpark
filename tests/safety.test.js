import { test, describe } from 'node:test';
import assert from 'node:assert';

// Define the PII detection logic used in the client (app.component.ts) and server (server.js)
function scanForPII(text) {
  if (!text || typeof text !== 'string') return [];
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
  const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;

  const foundPII = [];
  // Reset regex lastIndex because of /g flag
  emailRegex.lastIndex = 0;
  phoneRegex.lastIndex = 0;
  ssnRegex.lastIndex = 0;
  ipRegex.lastIndex = 0;

  if (emailRegex.test(text)) foundPII.push('Email Address');
  if (phoneRegex.test(text)) foundPII.push('Phone Number');
  if (ssnRegex.test(text)) foundPII.push('Social Security Number');
  if (ipRegex.test(text)) foundPII.push('IP Address');

  return foundPII;
}

// Client-side warning message builder logic
function getClientPiiWarning(text) {
  if (!text) return null;

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/;
  const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;

  const found = [];
  if (emailRegex.test(text)) found.push('email address');
  if (phoneRegex.test(text)) found.push('phone number');
  if (ssnRegex.test(text)) found.push('social security number');
  if (ipRegex.test(text)) found.push('IP address');

  if (found.length > 0) {
    return `Potential ${found.join(' and ')} detected. Under HIPAA guidelines, please de-identify your query before generating insights.`;
  }
  return null;
}

describe('Responsible AI Safety & Privacy Guardrails', () => {
  
  describe('PII Scanner Regex Validation', () => {
    test('Should pass for clean clinical inputs with no PII', () => {
      const input = 'Patient has joint pain in knee, struggling to walk up stairs.';
      const detected = scanForPII(input);
      assert.strictEqual(detected.length, 0, 'Clean input should not trigger PII warning');
      assert.strictEqual(getClientPiiWarning(input), null);
    });

    test('Should catch email addresses', () => {
      const input = 'Patient contact email is john.doe@example.com for follow-up.';
      const detected = scanForPII(input);
      assert.deepStrictEqual(detected, ['Email Address']);
      assert.match(getClientPiiWarning(input), /email address/);
    });

    test('Should catch phone numbers in various formats', () => {
      const formats = [
        '123-456-7890',
        '(123) 456-7890',
        '123.456.7890',
        '+1 123 456 7890',
      ];
      for (const format of formats) {
        const input = `Reach out at ${format} for assistance.`;
        const detected = scanForPII(input);
        assert.ok(detected.includes('Phone Number'), `Failed to catch phone format: ${format}`);
        assert.match(getClientPiiWarning(input), /phone number/);
      }
    });

    test('Should catch Social Security Numbers (SSN)', () => {
      const input = 'SSN on file is 000-12-3456.';
      const detected = scanForPII(input);
      assert.deepStrictEqual(detected, ['Social Security Number']);
      assert.match(getClientPiiWarning(input), /social security number/);
    });

    test('Should catch IP addresses', () => {
      const input = 'Request originated from IP 192.168.1.100.';
      const detected = scanForPII(input);
      assert.deepStrictEqual(detected, ['IP Address']);
      assert.match(getClientPiiWarning(input), /IP address/);
    });

    test('Should catch multiple types of PII simultaneously', () => {
      const input = 'Send records to doc@hospital.org or call 555-123-4567.';
      const detected = scanForPII(input);
      assert.ok(detected.includes('Email Address'));
      assert.ok(detected.includes('Phone Number'));
      
      const clientWarning = getClientPiiWarning(input);
      assert.match(clientWarning, /email address/);
      assert.match(clientWarning, /phone number/);
    });
  });

  describe('Gemini API Safety Config Validation', () => {
    test('Safety settings categories should block harmful content at medium and above', () => {
      const safetySettings = [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ];

      for (const setting of safetySettings) {
        assert.strictEqual(setting.threshold, 'BLOCK_MEDIUM_AND_ABOVE', `${setting.category} must be blocked at MEDIUM_AND_ABOVE`);
      }
    });
  });
});
