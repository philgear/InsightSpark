import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  buildSmartContext,
  buildTriadSwarmContext,
  verifyAndHealAgentOutput,
} from '../scripts/smart_context_agent.js';

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
    assert.ok(whatIfCtx.systemInstruction.includes('Expected Outcome Contract (what-if)'));
  });

  test('buildTriadSwarmContext should assemble Spark x Bridge x Anchor triad with Autonomous Routing Receipt', () => {
    const swarm = buildTriadSwarmContext({
      problem: 'Nighttime bathroom fall risk and caregiver exhaustion after hip surgery discharge',
      mode: 'care',
    });

    assert.strictEqual(swarm.triadIds.length, 3);
    assert.strictEqual(swarm.contracts.length, 3);
    assert.strictEqual(swarm.receipt.selectedModel, 'pocketgull-clinical:latest');
    assert.ok(swarm.systemInstruction.includes('[SPARK AGENT'));
    assert.ok(swarm.systemInstruction.includes('[BRIDGE AGENT'));
    assert.ok(swarm.systemInstruction.includes('[ANCHOR AGENT'));
    assert.ok(swarm.formattedPrompt.includes('Popperian H0 Override Rule:'));
  });

  test('verifyAndHealAgentOutput should score outcome fulfillment, heal drift in 0ms, and emit Machine Teaching lesson', () => {
    const verified = verifyAndHealAgentOutput({
      rawText: 'Sure thing! Let us delve into this game-changing tapestry of synergistic paradigms to skyrocket 100x with a 2-minute micro-trigger domino habit today!',
      strategyId: 'butterfly',
      sourceModel: 'branddesk:latest',
    });

    assert.strictEqual(verified.healed, true);
    assert.strictEqual(verified.isDrifting, false);
    assert.ok(!/delve into|tapestry of|skyrocket|100x/i.test(verified.outputText));
    assert.ok(verified.outcomeFulfillmentScore >= 0.90);
    assert.ok(verified.machineTeachingLesson, 'Must emit Machine Teaching DPO lesson when drift is healed');
  });
});
