import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BrandDriftCalibratorService,
  BRAND_STRATEGY_AXES,
  STRATEGY_OUTCOME_CONTRACTS,
} from '../src/services/brand-drift-calibrator.service.ts';
import { STRATEGIES } from '../src/models/creative-types.ts';

test('BrandDriftCalibratorService: defines 6 contrastive Brand & Strategy axes (12 poles)', () => {
  const service = new BrandDriftCalibratorService();
  assert.equal(BRAND_STRATEGY_AXES.length, 6);
  assert.equal(service.currentTurn().poleScores.length, 12);
});

test('BrandDriftCalibratorService: computes unit Difference-in-Means vector', () => {
  const service = new BrandDriftCalibratorService();
  const unit = service.computeDifferenceInMeansVector([[3, 0], [5, 0]], [[1, 0], [-1, 0]]);
  assert.deepEqual(unit, [1, 0]);
});

test('BrandDriftCalibratorService: autoHealBrandOutput strips AI slop, steers output, and records DPO pair', () => {
  const service = new BrandDriftCalibratorService();
  let steeringCallbackCount = 0;
  service.registerSteeringCallback(() => {
    steeringCallbackCount++;
  });
  const result = service.autoHealBrandOutput(
    'Sure thing! Let us delve into this game-changing tapestry of synergistic paradigms to skyrocket 100x!',
    'branddesk:latest'
  );
  assert.equal(result.healed, true);
  assert.equal(result.turn.isDrifting, false);
  assert.ok(!/delve into|tapestry of|synergistic paradigms|skyrocket|100x/i.test(result.outputText));
  assert.ok(/examine|system of|coordinated mechanisms/i.test(result.outputText));
  assert.ok(!result.outputText.includes('[Anchored in 3 falsifiable milestones'));
  assert.equal(steeringCallbackCount, 0, 'autoHealBrandOutput must not trigger steering callback or overwrite user strategies');
  assert.equal(service.selfHealingDpoQueue().length, 1);
  assert.ok(service.selfHealingDpoQueue()[0].hazardReducedFrom >= 0.55);
  assert.ok(service.selfHealingDpoQueue()[0].hazardReducedTo <= 0.15);
});

test('BrandDriftCalibratorService: maps all 29 strategies accurately with secondary axis blend and 6 axis-aligned exemplars', () => {
  const service = new BrandDriftCalibratorService();
  assert.equal(service.lateralExemplars.length, 6);

  // Select strategies from Axis 4 (Dignity & Agency) + Axis 1 (Falsifiable Thesis)
  service.syncWheelFromManualStrategies(['ethical-dignity', 'perspective-inversion', 'root-cause']);
  assert.equal(service.focusedAxisIndex(), 4);
  assert.equal(service.secondaryAxisIndex(), 1);
  assert.ok(service.getSteeringSystemDirective().includes('Secondary Blend: Falsifiable Thesis'));

  // Nudge steering gains within bounded range [0.25..0.95]
  service.nudgeSteeringGains(0.05, 0.10);
  assert.equal(service.steeringAlpha(), 0.75);
  assert.equal(service.steeringBeta(), 0.65);
});

test('BrandDriftCalibratorService: defines Expected Outcome Contracts for all 29 canonical strategies and scores outcome fulfillment', () => {
  const service = new BrandDriftCalibratorService();
  assert.equal(Object.keys(STRATEGY_OUTCOME_CONTRACTS).length, 29);
  for (const s of STRATEGIES) {
    assert.ok(STRATEGY_OUTCOME_CONTRACTS[s.id], `Missing outcome contract for strategy: ${s.id}`);
  }

  service.syncWheelFromManualStrategies(['butterfly', 'fmea']);
  assert.equal(service.activeOutcomeContracts().length, 2);
  assert.ok(service.getSteeringSystemDirective().includes('Expected Strategy Outcomes: [butterfly:'));

  const fulfilledEval = service.evaluateStrategyOutcome(
    'Start with a 2-minute micro-trigger habit by staging the kettle tray first to unlock a domino cascade across the morning routine.',
    'The Butterfly Effect'
  );
  const orthodoxyEval = service.evaluateStrategyOutcome(
    'Communicate better and stay organized with a calendar while you delve into a tapestry of paradigms.',
    'The Butterfly Effect'
  );

  assert.equal(fulfilledEval.contract.id, 'butterfly');
  assert.ok(fulfilledEval.fulfillmentScore >= 0.90, `Expected high fulfillment score, got ${fulfilledEval.fulfillmentScore}`);
  assert.ok(orthodoxyEval.fulfillmentScore <= 0.45, `Expected low orthodoxy fulfillment score, got ${orthodoxyEval.fulfillmentScore}`);

  // Verify 4-Slot Output Model Switcher & parameter gain tuning
  assert.equal(service.outputModelCatalog.length, 4);
  service.selectOutputModel('pocketgull-clinical:latest');
  assert.equal(service.activeModel(), 'pocketgull-clinical:latest');
  assert.equal(service.steeringAlpha(), 0.78);
  assert.equal(service.steeringBeta(), 0.62);
});

test('BrandDriftCalibratorService: autonomouslyDecideCalibration routes challenges and buildMachineTeachingCurriculum exports JSONL', () => {
  const service = new BrandDriftCalibratorService();

  // Clinical / caregiver fatigue scenario -> should route to pocketgull-clinical:latest and Axis 6 (4-Slot Cognitive Calm)
  const careReceipt = service.autonomouslyDecideCalibration(
    'Primary caregiver is exhausted with cerebellar ataxia tremor and needs a weekly respite handoff schedule.',
    'care'
  );
  assert.equal(careReceipt.selectedModel, 'pocketgull-clinical:latest');
  assert.equal(careReceipt.selectedAxisIndex, 5);
  assert.deepEqual(careReceipt.recommendedStrategyIds, ['butterfly', 'respite-pacing', 'critical-path']);
  assert.ok(careReceipt.falsificationCriterion.includes('Override'));

  // Machine Teaching Curriculum should include the 6 base concept lessons + any self-healed live lessons
  service.autoHealBrandOutput(
    'Sure thing! Let us delve into this game-changing holistic tapestry of synergistic paradigms to skyrocket 100x!',
    'branddesk:latest'
  );
  const curriculum = service.buildMachineTeachingCurriculum();
  assert.equal(curriculum.length, 7);
  const jsonl = service.exportMachineTeachingJsonl();
  assert.equal(jsonl.split('\n').length, 7);
});
