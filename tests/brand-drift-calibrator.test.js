import test from 'node:test';
import assert from 'node:assert/strict';
import { BrandDriftCalibratorService, BRAND_STRATEGY_AXES } from '../src/services/brand-drift-calibrator.service.ts';

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
  const result = service.autoHealBrandOutput(
    'Sure thing! Let us delve into this game-changing tapestry of synergistic paradigms to skyrocket 100x!',
    'branddesk:latest'
  );
  assert.equal(result.healed, true);
  assert.equal(result.turn.isDrifting, false);
  assert.ok(!/delve into|tapestry of/i.test(result.outputText));
  assert.equal(service.selfHealingDpoQueue().length, 1);
  assert.ok(service.selfHealingDpoQueue()[0].hazardReducedFrom >= 0.55);
  assert.ok(service.selfHealingDpoQueue()[0].hazardReducedTo <= 0.15);
});
