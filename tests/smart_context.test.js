import { test, describe } from 'node:test';
import assert from 'node:assert';
import { buildSmartContext } from '../scripts/smart_context_agent.js';

describe('Smart Context Assembly & Edge Agent Suite', () => {
  test('buildSmartContext should inject persona, PERMA+H invariants, and respite guardrails', () => {
    const ctx = buildSmartContext({
      problem: 'Helping grandfather recover after surgery while balancing school runs',
      mode: 'care',
      personaId: 'kinship-triad',
      invariants: ['perma', 'respite', 'de-identified'],
    });

    assert.ok(ctx.systemInstruction.includes('Intergenerational Kinship Coordinator'));
    assert.ok(ctx.systemInstruction.includes('PERMA+H'));
    assert.ok(ctx.systemInstruction.includes('respite'));
    assert.ok(ctx.systemInstruction.includes('Zero-PII'));
    assert.ok(ctx.formattedPrompt.includes('Helping grandfather recover'));
  });

  test('buildSmartContext should format working memory key-value slots into prompt', () => {
    const ctx = buildSmartContext({
      problem: 'Elder mobility routine',
      workingMemory: {
        burnoutScore: 'high (7/10)',
        confirmedAllies: ['Neighbor Bob', 'Daughter Sarah'],
        weeklyRespiteHoursLogged: 1.5,
      },
    });

    assert.ok(ctx.systemInstruction.includes('[burnoutScore]: high (7/10)'));
    assert.ok(ctx.systemInstruction.includes('[weeklyRespiteHoursLogged]: 1.5'));
    assert.ok(ctx.systemInstruction.includes('Neighbor Bob'));
  });

  test('buildSmartContext should adjust lens for FMEA and What-If personas', () => {
    const fmeaCtx = buildSmartContext({
      problem: 'Stairs safety',
      personaId: 'fmea',
    });
    assert.ok(fmeaCtx.systemInstruction.includes('FMEA Risk Guardian'));

    const whatIfCtx = buildSmartContext({
      problem: 'Nutrition tracking',
      personaId: 'what-if',
    });
    assert.ok(whatIfCtx.systemInstruction.includes('Divergent Lateral Thinker'));
  });
});
