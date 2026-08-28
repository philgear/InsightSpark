import { test, describe } from 'node:test';
import assert from 'node:assert';
import { SUPPORTED_LANGUAGES_LIST, TRANSLATIONS } from '../src/services/translation.service.ts';

describe('Translation & Internationalization Suite', () => {
  test('Supported Languages should contain all 19 target locales including Portland Sister Cities', () => {
    assert.strictEqual(SUPPORTED_LANGUAGES_LIST.length, 19);

    const sisterCities = SUPPORTED_LANGUAGES_LIST.filter(l => l.isSisterCity);
    assert.strictEqual(sisterCities.length, 9, 'Should have exactly 9 Portland Sister Cities');

    sisterCities.forEach(city => {
      assert.ok(city.cityContext, `Sister city entry ${city.name} must have cityContext label`);
    });
  });

  test('UI Translation Dictionary should have complete keys for supported languages', () => {
    const requiredKeys = [
      'app.title',
      'mode.creative',
      'mode.care',
      'input.generate.btn',
      'input.custom.role',
      'plan.export.fhir',
      'plan.export.md',
      'results.translate'
    ];

    // English baseline
    const enDict = TRANSLATIONS['en'];
    assert.ok(enDict, 'English dictionary must exist');

    requiredKeys.forEach(k => {
      assert.ok(enDict[k], `English dictionary missing key: ${k}`);
    });

    // Check Spanish, Japanese, and Italian dictionaries
    ['es', 'ja', 'it'].forEach(lang => {
      const dict = TRANSLATIONS[lang];
      assert.ok(dict, `Dictionary for ${lang} must exist`);
      requiredKeys.forEach(k => {
        assert.ok(dict[k], `Language ${lang} missing translation key: ${k}`);
      });
    });
  });

  test('FHIR R4 Bundle Builder structure conforms to HL7 FHIR specifications', () => {
    const sampleCarePlan = {
      personGoal: 'Maintain independence and comfort',
      keyInterventions: ['Daily gentle walking', 'Medication check'],
      monitoringPlan: ['Blood pressure checks every morning'],
      guidanceAndEducation: ['Nutritional balance and hydration'],
      positiveAchievements: ['Walking 15 minutes without pain'],
      recommendations: ['Follow up in 2 weeks']
    };

    const bundle = {
      resourceType: 'Bundle',
      id: `careplan-bundle-test`,
      type: 'collection',
      timestamp: new Date().toISOString(),
      entry: [
        {
          fullUrl: 'urn:uuid:condition-1',
          resource: {
            resourceType: 'Condition',
            clinicalStatus: { coding: [{ code: 'active' }] },
            code: { text: 'Chronic Pain' }
          }
        },
        {
          fullUrl: 'urn:uuid:goal-1',
          resource: {
            resourceType: 'Goal',
            lifecycleStatus: 'active',
            description: { text: sampleCarePlan.personGoal }
          }
        },
        {
          fullUrl: 'urn:uuid:careplan-1',
          resource: {
            resourceType: 'CarePlan',
            status: 'active',
            intent: 'plan',
            addresses: [{ reference: 'urn:uuid:condition-1' }],
            goal: [{ reference: 'urn:uuid:goal-1' }],
            activity: sampleCarePlan.keyInterventions.map(i => ({
              detail: { kind: 'ServiceRequest', description: i }
            }))
          }
        }
      ]
    };

    assert.strictEqual(bundle.resourceType, 'Bundle');
    assert.strictEqual(bundle.entry.length, 3);
    assert.strictEqual(bundle.entry[0].resource.resourceType, 'Condition');
    assert.strictEqual(bundle.entry[1].resource.resourceType, 'Goal');
    assert.strictEqual(bundle.entry[2].resource.resourceType, 'CarePlan');
    assert.strictEqual(bundle.entry[2].resource.activity.length, 2);
  });

  test('STRATEGIES includes VIA Strengths & PERMA+H Strategy with dual-mode semantics', async () => {
    const { STRATEGIES } = await import('../src/models/creative-types.ts');
    const permaStrategy = STRATEGIES.find(s => s.id === 'perma-strengths');
    
    assert.ok(permaStrategy, 'perma-strengths strategy must be present in STRATEGIES list');
    assert.strictEqual(permaStrategy.name, 'VIA Strengths & Optimism');
    assert.strictEqual(permaStrategy.careModeName, 'PERMA+H & Strengths');
    assert.ok(permaStrategy.careModeDescription.includes('PERMA+H'), 'careModeDescription should cite PERMA+H framework');
    assert.ok(permaStrategy.agentPersona.includes('strengths'), 'agentPersona should reflect asset-based amplification');
  });

  test('GeminiService exportDpoDataset formats items into standard Hugging Face/TRL JSONL preference pairs', async () => {
    const { GeminiService } = await import('../src/services/gemini.service.ts');
    const service = new GeminiService();

    const sampleSavedItems = [
      {
        id: '1',
        type: 'insight',
        problem: 'Post-op knee rehabilitation anxiety',
        strategyName: 'PERMA+H & Strengths',
        text: 'Frame daily 10-step milestones as micro-masteries, pairing gentle flexion with listening to favorite audiobooks.',
        timestamp: Date.now()
      },
      {
        id: '2',
        type: 'care-plan',
        problem: 'Diabetes management routine',
        plan: {
          personGoal: 'Feel energetic and in control',
          keyInterventions: ['Morning 10-min garden walk'],
          monitoringPlan: ['Daily blood sugar log'],
          guidanceAndEducation: ['Nutritional balance tips'],
          positiveAchievements: ['Consistent readings for 5 days'],
          recommendations: ['Follow up with dietitian']
        },
        timestamp: Date.now()
      }
    ];

    const jsonl = service.exportDpoDataset(sampleSavedItems, '0009-0008-1372-5381', 'Phil Gear');
    const lines = jsonl.trim().split('\n');

    assert.strictEqual(lines.length, 3, 'Should produce 1 metadata header line + 2 data records');
    
    const meta = JSON.parse(lines[0]);
    assert.strictEqual(meta._metadata.format, 'DPO_JSONL_PAIRWISE_PREFERENCES');
    assert.strictEqual(meta._metadata.orcid, 'https://orcid.org/0009-0008-1372-5381');

    const rec1 = JSON.parse(lines[1]);
    assert.ok(rec1.prompt.includes('Post-op knee'));
    assert.ok(rec1.chosen.includes('micro-masteries'));
    assert.ok(rec1.rejected.length > 0);

    const rec2 = JSON.parse(lines[2]);
    assert.ok(rec2.prompt.includes('Diabetes management'));
    assert.strictEqual(rec2.type, 'care-plan');
  });

  test('STRATEGIES includes Intergenerational Kinship (kinship-triad) Strategy with family care semantics', async () => {
    const { STRATEGIES } = await import('../src/models/creative-types.ts');
    const kinshipStrategy = STRATEGIES.find(s => s.id === 'kinship-triad');
    
    assert.ok(kinshipStrategy, 'kinship-triad strategy must be present in STRATEGIES list');
    assert.strictEqual(kinshipStrategy.name, 'Intergenerational Kinship');
    assert.strictEqual(kinshipStrategy.careModeName, 'Family Kinship & Legacy');
    assert.ok(kinshipStrategy.careModeDescription.includes('generations'), 'careModeDescription should cite generations');
    assert.ok(kinshipStrategy.agentPersona.includes('three generations'), 'agentPersona should reflect multi-generational synthesis');
  });

  test('Anchor strategies (fmea, critical-path, perma-strengths, kinship-triad) have category anchor', async () => {
    const { STRATEGIES } = await import('../src/models/creative-types.ts');
    const anchorIds = ['fmea', 'critical-path', 'perma-strengths', 'kinship-triad'];
    for (const id of anchorIds) {
      const s = STRATEGIES.find(item => item.id === id);
      assert.ok(s, `Strategy ${id} must exist`);
      assert.strictEqual(s.category, 'anchor', `Strategy ${id} must have category anchor`);
    }
  });
});
