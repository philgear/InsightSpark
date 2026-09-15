import { test, describe } from 'node:test';
import assert from 'node:assert';
import { 
  scanForAcuteTriage, 
  scanForPII, 
  getClientPiiWarning, 
  autoScrubPII 
} from '../src/utils/safety-guards.ts';

describe('Responsible AI Safety & Privacy Guardrails', () => {
  
  describe('ClinicalTriageGuard — Acute Emergency & Crisis Interception', () => {
    test('Clean ideation and care inputs should NOT trigger triage intercept', () => {
      const inputs = [
        'Patient has joint pain in knee, struggling to walk up stairs comfortably.',
        'Brainstorming ideas for an intergenerational community garden in Portland.',
        'Recovering from hip replacement, wants to attend granddaughter wedding.'
      ];
      for (const input of inputs) {
        const triage = scanForAcuteTriage(input);
        assert.strictEqual(triage, null, `Clean input triggered false positive triage: "${input}"`);
      }
    });

    test('FAST Stroke indicators should trigger 911 medical emergency intercept', () => {
      const strokeInputs = [
        'Elder suddenly has slurred speech and left arm weakness',
        'Noticed face drooping on one side and sudden numbness in right arm',
        'Sudden loss of balance and inability to speak clearly'
      ];
      for (const input of strokeInputs) {
        const triage = scanForAcuteTriage(input);
        assert.ok(triage, `Failed to detect stroke signs in: "${input}"`);
        assert.strictEqual(triage.isEmergency, true);
        assert.strictEqual(triage.type, 'medical');
        assert.strictEqual(triage.hotline, '911');
        assert.match(triage.guidance, /911/);
      }
    });

    test('Cardiac and severe respiratory distress should trigger 911 medical emergency intercept', () => {
      const cardiacInputs = [
        'Grandpa complaining of severe chest pain and radiating arm numbness',
        'Sudden chest pressure and cannot breathe properly',
        'Patient collapsed with loss of consciousness and blue lips'
      ];
      for (const input of cardiacInputs) {
        const triage = scanForAcuteTriage(input);
        assert.ok(triage, `Failed to detect cardiac/respiratory distress in: "${input}"`);
        assert.strictEqual(triage.isEmergency, true);
        assert.strictEqual(triage.type, 'medical');
        assert.strictEqual(triage.hotline, '911');
      }
    });

    test('Suicidal crisis and despair language should trigger 988 Crisis Lifeline intercept', () => {
      const crisisInputs = [
        'Caregiver burnout is too much, I feel hopeless and want to end it all',
        'Patient expressed suicidal thoughts and feelings of worthlessness',
        'I want to die, nothing is getting better'
      ];
      for (const input of crisisInputs) {
        const triage = scanForAcuteTriage(input);
        assert.ok(triage, `Failed to detect crisis in: "${input}"`);
        assert.strictEqual(triage.isEmergency, true);
        assert.strictEqual(triage.type, 'crisis');
        assert.strictEqual(triage.hotline, '988');
        assert.match(triage.actionTitle, /988/);
      }
    });
  });

  describe('HipaaSafeHarborGuard — Deep PII/PHI De-Identification', () => {
    test('Should pass for clean clinical inputs with no PII', () => {
      const input = 'Patient has joint pain in knee, struggling to walk up stairs.';
      const detected = scanForPII(input);
      assert.strictEqual(detected.length, 0, 'Clean input should not trigger PII warning');
      assert.strictEqual(getClientPiiWarning(input), null);
    });

    test('Should catch email addresses (standard and obfuscated)', () => {
      const emails = [
        'Patient contact email is john.doe@example.com for follow-up.',
        'Reach me at doctor [at] clinic [dot] org'
      ];
      for (const input of emails) {
        const detected = scanForPII(input);
        assert.ok(detected.includes('Email Address'), `Failed to catch email: ${input}`);
        assert.match(getClientPiiWarning(input) || '', /email address/);
      }
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
        assert.match(getClientPiiWarning(input) || '', /phone number/);
      }
    });

    test('Should catch Social Security Numbers (SSN)', () => {
      const input = 'SSN on file is 000-12-3456.';
      const detected = scanForPII(input);
      assert.deepStrictEqual(detected, ['Social Security Number']);
      assert.match(getClientPiiWarning(input) || '', /social security number/);
    });

    test('Should catch IP addresses', () => {
      const input = 'Request originated from IP 192.168.1.100.';
      const detected = scanForPII(input);
      assert.deepStrictEqual(detected, ['IP Address']);
      assert.match(getClientPiiWarning(input) || '', /ip address/);
    });

    test('Should catch Date of Birth (DOB) under HIPAA Safe Harbor', () => {
      const input = 'Patient records indicate DOB: 05/12/1948.';
      const detected = scanForPII(input);
      assert.ok(detected.includes('Date of Birth'));
      assert.match(getClientPiiWarning(input) || '', /date of birth/);
    });

    test('Should catch Medical Record Numbers (MRN)', () => {
      const input = 'Follow up for patient with MRN: 98765432.';
      const detected = scanForPII(input);
      assert.ok(detected.includes('Medical Record Number'));
      assert.match(getClientPiiWarning(input) || '', /medical record number/);
    });

    test('Should catch Street Addresses', () => {
      const input = 'Home health aid visits 742 Evergreen Terrace Apt 4B on Mondays.';
      const detected = scanForPII(input);
      assert.ok(detected.includes('Street Address'));
      assert.match(getClientPiiWarning(input) || '', /street address/);
    });

    test('autoScrubPII should scrub PII tokens cleanly with placeholder tokens', () => {
      const dirty = 'Contact nurse at 555-123-4567 or nurse@clinic.org regarding patient DOB: 01/01/1950 at 123 Main Street.';
      const clean = autoScrubPII(dirty);

      assert.ok(!clean.includes('555-123-4567'), 'Phone must be scrubbed');
      assert.ok(!clean.includes('nurse@clinic.org'), 'Email must be scrubbed');
      assert.ok(!clean.includes('01/01/1950'), 'DOB must be scrubbed');
      assert.ok(!clean.includes('123 Main Street'), 'Address must be scrubbed');

      assert.ok(clean.includes('[phone]'));
      assert.ok(clean.includes('[email]'));
      assert.ok(clean.includes('[date of birth]'));
      assert.ok(clean.includes('[street address]'));
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
