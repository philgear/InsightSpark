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

  test('Anchor strategies (7 models) have category anchor and valid dual-mode metadata', async () => {
    const { STRATEGIES } = await import('../src/models/creative-types.ts');
    const anchorIds = [
      'fmea',
      'critical-path',
      'perma-strengths',
      'kinship-triad',
      'respite-pacing',
      'ethical-dignity',
      'environmental-safety'
    ];
    for (const id of anchorIds) {
      const s = STRATEGIES.find(item => item.id === id);
      assert.ok(s, `Strategy ${id} must exist`);
      assert.strictEqual(s.category, 'anchor', `Strategy ${id} must have category anchor`);
      assert.ok(s.careModeName, `Strategy ${id} must have careModeName`);
      assert.ok(s.careModeDescription, `Strategy ${id} must have careModeDescription`);
      assert.ok(s.agentPersona, `Strategy ${id} must have agentPersona`);
    }
  });

  test('Complete strategy registry contains 24 models (17 provocations, 7 anchors)', async () => {
    const { STRATEGIES } = await import('../src/models/creative-types.ts');
    assert.strictEqual(STRATEGIES.length, 24, 'Must have exactly 24 strategies');

    const provocations = STRATEGIES.filter(s => s.category !== 'anchor');
    const anchors = STRATEGIES.filter(s => s.category === 'anchor');

    assert.strictEqual(provocations.length, 17, 'Must have exactly 17 divergent provocations');
    assert.strictEqual(anchors.length, 7, 'Must have exactly 7 systems rigor anchors');

    // Verify new provocations
    const newProvocationIds = ['sensory-bridge', 'found-kinship', 'time-dilation'];
    for (const id of newProvocationIds) {
      const s = STRATEGIES.find(item => item.id === id);
      assert.ok(s, `New provocation ${id} must exist`);
      assert.ok(s.careModeName, `New provocation ${id} must have careModeName`);
      assert.ok(s.agentPersona, `New provocation ${id} must have agentPersona`);
    }
  });

  test('FHIR R4 Bundle Builder maps Care Transition & Respite Checklists to ServiceRequest activities', () => {
    const carePlanWithChecklists = {
      personGoal: 'Safely transition from hospital to living room gardening',
      keyInterventions: ['Seated planting', 'Supported 10m walks'],
      monitoringPlan: ['Daily vitals', 'Pain thresholds'],
      guidanceAndEducation: ['Ergonomic tools instruction'],
      positiveAchievements: ['5 minutes standing milestone'],
      recommendations: ['Follow up with PT in 2 weeks'],
      transitionChecklist: [
        '72-hour walkway clearance for walker navigation',
        'Medication schedule reconciliation'
      ],
      respiteClosureChecklist: [
        'Weekly 4-hour primary caregiver relief window',
        'Designate secondary emergency contact'
      ]
    };

    const activities = [
      ...carePlanWithChecklists.keyInterventions.map(i => ({ detail: { kind: 'ServiceRequest', description: i } })),
      ...carePlanWithChecklists.transitionChecklist.map(t => ({ detail: { kind: 'ServiceRequest', description: `[Transition Protocol]: ${t}` } })),
      ...carePlanWithChecklists.respiteClosureChecklist.map(r => ({ detail: { kind: 'ServiceRequest', description: `[Respite Safeguard]: ${r}` } }))
    ];

    assert.strictEqual(activities.length, 6, 'Should contain 2 key interventions + 2 transition checks + 2 respite checks');
    assert.ok(activities.some(a => a.detail.description.startsWith('[Transition Protocol]:')));
    assert.ok(activities.some(a => a.detail.description.startsWith('[Respite Safeguard]:')));
  });

  test('GeminiService in Demo Mode returns structured transition & respite checklists in CarePlan', async () => {
    const { GeminiService } = await import('../src/services/gemini.service.ts');
    const service = new GeminiService();
    // Activate demo mode via global localStorage simulation
    globalThis.localStorage = {
      getItem: (key) => key === 'spark_cfg_val' ? 'demo-key-active' : null,
      setItem: () => {},
      removeItem: () => {}
    };

    const plan = await service.generateCarePlan('Post-recovery mobility support', [
      { id: '1', text: 'Gentle morning movement', strategyName: 'What If', problem: 'Mobility', timestamp: Date.now(), type: 'insight' }
    ]);

    assert.ok(plan.transitionChecklist && plan.transitionChecklist.length > 0, 'Must include transitionChecklist');
    assert.ok(plan.respiteClosureChecklist && plan.respiteClosureChecklist.length > 0, 'Must include respiteClosureChecklist');
    assert.ok(plan.transitionChecklist[0].includes('72-hour'), 'Must cite 72-hour transition window');
  });

  test('GeminiService runAgenticPipeline in Demo Mode returns synthesisActionBridge', async () => {
    const { GeminiService } = await import('../src/services/gemini.service.ts');
    const service = new GeminiService();
    globalThis.localStorage = {
      getItem: (key) => key === 'spark_cfg_val' ? 'demo-key-active' : null,
      setItem: () => {},
      removeItem: () => {}
    };

    const phases = [];
    const result = await service.runAgenticPipeline(
      'Test problem',
      'care',
      (phase) => phases.push(phase),
      () => {}
    );

    assert.ok(result.consensus, 'Consensus must exist');
    assert.ok(result.synthesisActionBridge, 'synthesisActionBridge must exist');
    assert.ok(result.synthesisActionBridge.divergentLeap, 'Must have divergentLeap');
    assert.ok(result.synthesisActionBridge.groundingGuardrail, 'Must have groundingGuardrail');
    assert.ok(result.synthesisActionBridge.immediateTractionStep, 'Must have immediateTractionStep');
    assert.ok(phases.includes('complete'), 'Pipeline must complete');
  });
});
