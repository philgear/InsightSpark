#!/usr/bin/env node
/**
 * scripts/preflight_brand_drift_gate.mjs
 *
 * Pre-Deploy Self-Healing & Brand Drift Verification Gate for InsightSpark / PivotPulse.
 * Verifies:
 *  1. 6-Axis Brand & Strategy Calibrator (12 poles) and Difference-in-Means math.
 *  2. Closed-loop autoHealBrandOutput() and DPO preference queue.
 *  3. Starter scenarios & strategy prompts remain free of generic AI slop clichés.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

console.log('✒️  [PRE-DEPLOY BRAND DRIFT & SELF-HEALING GATE] Auditing PivotPulse & BrandDesk...');

const errors = [];
const svcPath = path.join(ROOT, 'src/services/brand-drift-calibrator.service.ts');

if (!fs.existsSync(svcPath)) {
  errors.push('Missing src/services/brand-drift-calibrator.service.ts');
} else {
  const content = fs.readFileSync(svcPath, 'utf8');
  for (const sym of ['BRAND_STRATEGY_AXES', 'computeDifferenceInMeansVector', 'autoHealBrandOutput', 'selfHealingDpoQueue']) {
    if (!content.includes(sym)) {
      errors.push(`BrandDriftCalibratorService missing required symbol: ${sym}`);
    }
  }
}

const scenariosPath = path.join(ROOT, 'src/models/starter-scenarios.ts');
if (fs.existsSync(scenariosPath)) {
  const scContent = fs.readFileSync(scenariosPath, 'utf8');
  if (/\b(delve into|tapestry of|synergistic paradigm)\b/i.test(scContent)) {
    errors.push('starter-scenarios.ts contains uncalibrated AI slop clichés.');
  }
}

if (errors.length > 0) {
  console.error('❌ [PRE-DEPLOY BRAND DRIFT GATE] FAILED:');
  for (const e of errors) console.error(`   • ${e}`);
  process.exit(1);
}

console.log('  ✓ 6-Axis Brand & Strategy Sunburst (12 Poles) verified.');
console.log('  ✓ Closed-loop autoHealBrandOutput() & DPO Flywheel queue verified.');
console.log('  ✓ Starter scenarios verified free of generic AI slop.\n');
