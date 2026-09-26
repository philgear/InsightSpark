#!/usr/bin/env node
/**
 * InsightSpark (Pivot & Pulse) — Unified Multi-Task DPO Dataset Generator
 * 
 * Generates canonical Hugging Face TRL pairwise preference datasets (.jsonl)
 * covering all 24 strategies in both [MODE: CREATIVE] and [MODE: CARE] (48 tasks total),
 * using task prefix tokens:
 *   [MODE: CARE] [STRATEGY: <ID>] Problem: ...
 *   [MODE: CREATIVE] [STRATEGY: <ID>] Problem: ...
 * 
 * Output: datasets/multitask-dpo.jsonl
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STRATEGIES } from '../src/models/creative-types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_JSONL = path.join(ROOT_DIR, 'datasets', 'multitask-dpo.jsonl');

const BASE_METADATA = {
  format: 'DPO_JSONL_PAIRWISE_PREFERENCES',
  version: '2.0.0',
  target_framework: 'Hugging Face TRL (DPOTrainer)',
  license: 'Apache-2.0',
  provenance: 'InsightSpark (Pivot & Pulse)',
  curator: 'Phil Gear',
  orcid: 'https://orcid.org/0009-0008-1372-5381',
  dataset_type: 'Unified Multi-Task (24 Strategies x 2 Modes = 48 Tasks)',
  prefix_token_schema: '[MODE: <CARE|CREATIVE>] [STRATEGY: <ID>]',
  exported_at: new Date().toISOString(),
};

// Exemplar scenarios tailored for each strategy
function getScenarioForStrategy(strategy, mode) {
  if (mode === 'care') {
    switch (strategy.id) {
      case 'what-if':
        return 'Elder recovering from knee replacement is afraid of walking on uneven garden flagstones.';
      case 'constraints':
        return 'Family has zero budget for professional home health aids; daughter works full-time while caring for mother with mild Parkinson’s.';
      case 'butterfly':
        return 'Elder repeatedly forgets midday medications because the alarm startles him and causes confusion.';
      case 'combinatorial':
        return 'Teenage grandson is absorbed in video games while grandfather with mild memory loss spends hours staring out the window.';
      case 'opposite':
        return 'Caregiver is exhausted from micromanaging every meal and reminding father to drink water every 20 minutes.';
      case 'future':
        return 'Grandmother diagnosed with early osteoarthritis is grieving the loss of her active mountain hiking routine.';
      case 'child':
        return 'Father with aphasia struggles to follow multi-step medical instructions handed to him on dense clinic sheets.';
      case 'alien':
        return 'Care team has gotten accustomed to cluttered hallway walkers, throw rugs, and dim hallway lighting as normal.';
      case 'nature':
        return 'Care recipient suffers from agitated sundowning symptoms every evening around 5:30 PM.';
      case 'superpower':
        return 'Caregiver feels trapped in the home 24/7 with zero outside assistance or family relief.';
      case 'simplify':
        return 'Caregiver is overwhelmed by 8 different tracking apps, 4 clipboards, and 12 medication bottles scattered across counters.';
      case 'random':
        return 'Elder with cognitive decline resists daily sitting-to-standing physical therapy repetitions.';
      case 'first-principles':
        return 'Family conflict over whether mother should move to assisted living or stay home despite recurrent minor falls.';
      case 'root-cause':
        return 'Grandfather refuses to attend senior day center, claiming the staff are boring and disrespectful.';
      case 'sensory-bridge':
        return 'Elder experiences severe anxiety, sensory agitation, and agitation during afternoon bathing routines.';
      case 'found-kinship':
        return 'Elder living alone has no biological family nearby; neighbors want to help but do not know how to coordinate.';
      case 'time-dilation':
        return 'Caregiver feels that daily routines are an endless blur of crisis management with zero perspective.';
      case 'fmea':
        return 'Elder is being discharged home after a 5-day post-acute stay with a new anticoagulant medication regimen.';
      case 'critical-path':
        return 'Transitioning elder from acute hospital care to home living with multiple scheduled follow-ups.';
      case 'perma-strengths':
        return 'Elder feels useless and depressed after stroke robbed him of his ability to play classical piano.';
      case 'kinship-triad':
        return 'Three generations living under one roof: working parents stressed about bills, grandparents needing daily care, children needing homework help.';
      case 'respite-pacing':
        return 'Sole family caregiver has not taken a single afternoon off in 9 months and is breaking down in tears daily.';
      case 'ethical-dignity':
        return 'Adult children discussing nursing home placement in front of mother as if she were not in the room.';
      case 'environmental-safety':
        return 'Elder with balance issues lives in an older home with slick wood floors, loose throw rugs, and steep porch steps.';
      default:
        return 'Balancing sustainable daily caregiving with personhood and family harmony.';
    }
  } else {
    // Creative mode scenarios
    switch (strategy.id) {
      case 'what-if':
        return 'Designing an autonomous community public transit system for rainy Pacific Northwest cities.';
      case 'constraints':
        return 'Building a mobile peer-to-peer educational workshop with zero internet connectivity and zero electricity.';
      case 'butterfly':
        return 'Increasing neighborhood civic participation in community council meetings from 2% to 40%.';
      case 'combinatorial':
        return 'Combining ancient Japanese timber joinery (Kigumi) with modular open-source 3D printed micro-housing.';
      case 'opposite':
        return 'A crowded coffee shop wants to eliminate customer waiting lines during morning peak hours.';
      case 'future':
        return 'Reimagining local municipal libraries in the year 2046 when all printed text is digitizable via optical implants.';
      case 'child':
        return 'Explaining quantum encryption to everyday smartphone users so they grasp trust boundaries.';
      case 'alien':
        return 'Critiquing modern automobile commute culture from an extraterrestrial perspective.';
      case 'nature':
        return 'Designing architectural cooling systems for desert urban density inspired by termite mound ventilation.';
      case 'superpower':
        return 'Creating the ultimate frictionless collaborative writing tool for distributed remote teams.';
      case 'simplify':
        return 'A bloated enterprise project management dashboard with 400 configuration settings.';
      case 'random':
        return 'Using a vintage mechanical pocket watch as an analog to redesign digital notification feeds.';
      case 'first-principles':
        return 'Rethinking home energy storage without relying on rare-earth chemical lithium batteries.';
      case 'root-cause':
        return 'Software developers experiencing persistent deployment fear and production release rollbacks.';
      case 'sensory-bridge':
        return 'Designing a tactile, non-visual navigation interface for pedestrians in dense pedestrian plazas.';
      case 'found-kinship':
        return 'Creating collaborative alliances between competing indie game studios to share server infrastructure.';
      case 'time-dilation':
        return 'Developing a personal knowledge archiving format designed to remain readable 200 years into the future.';
      case 'fmea':
        return 'Conducting a pre-mortem failure mode analysis on an open-source medical telemetry device.';
      case 'critical-path':
        return 'Sequencing the critical dependencies for bootstrapping an offline mesh emergency communication network.';
      case 'perma-strengths':
        return 'Transforming workplace retrospective meetings from finger-pointing into signature strength amplification.';
      case 'kinship-triad':
        return 'Designing a co-working and learning center where retirees teach technical craft to teenagers while parents work.';
      case 'respite-pacing':
        return 'Structuring sustainable open-source software maintainer sprints to eliminate burnout and abandonment.';
      case 'ethical-dignity':
        return 'Developing AI data provenance and consent mechanisms that guarantee permanent user data sovereignty.';
      case 'environmental-safety':
        return 'Ergonomic workshop redesign to prevent repetitive strain injuries in collaborative maker spaces.';
      default:
        return 'Overcoming creative stagnation on a mission-critical project.';
    }
  }
}

// Generates paired chosen (yw) and rejected (yl) responses
function generatePair(strategy, mode, scenario) {
  const prefix = `[MODE: ${mode.toUpperCase()}] [STRATEGY: ${strategy.id.toUpperCase()}]`;
  const prompt = `${prefix} Challenge: "${scenario}"`;

  let chosen = '';
  let rejected = '';
  let rationale = '';

  if (mode === 'care') {
    chosen = `Synthesize through ${strategy.careModeName || strategy.name} (PERMA+H & Kinship Mesh):
1. Asset-Based Reframing:
Reframe the situation around character strengths and intrinsic agency. Honor the person's dignity and living identity above clinical deficits.

2. Distributed Intergenerational Collaboration:
Disperse caregiving roles across family, youth, and trusted community allies so no single caregiver bears an unsustainable burden.

3. Protected Caregiver Respite Safeguard:
Mandate a guaranteed 3–4 hour weekly protected respite block for the primary caregiver with a designated handoff partner.

4. 72-Hour Closed-Loop Traction Step:
Execute an immediate low-stress micro-step within 72 hours (environmental safety check, medication simplification, or family check-in) to build early momentum.`;

    rejected = `The patient presents with non-compliance, functional decline, and impaired judgment. The primary caregiver must take total unilateral control of all daily routines, enforce strict behavioral monitoring, and restrict physical autonomy to prevent accidents.

Cancel all outside hobbies, isolate the family from outside interference, and maintain an around-the-clock symptom log. Respite care is an unnecessary expense and can only be considered after medical stabilization. If the patient resists, utilize punitive compliance measures.`;

    rationale = `Chosen (${strategy.careModeName}) amplifies personhood, distributes roles to prevent burnout, enforces mandatory respite, and provides immediate traction. Rejected pathologizes the elder, induces martyr caregiver guilt, and isolates the family.`;
  } else {
    // Creative mode
    chosen = `Execute divergent lateral provocation via ${strategy.name}:
1. Provocative Operation (PO):
Break cognitive orthodoxy by challenging the fundamental unspoken constraint of this problem.

2. Novel Combinatorial Breakthrough:
Fuse two previously unrelated concepts to open a fresh vector of possibilities that competitors miss.

3. Grounding Shelf Counterbalance:
Anchor this radical divergence with a concrete FMEA pre-mortem check and an immediate proof-of-concept traction test within 48 hours.`;

    rejected = `Follow industry best practices. Form a committee to review existing standard operating procedures. Brainstorm a list of common ideas, select the most familiar compromise, and proceed with cautious incremental tweaks to avoid making anyone uncomfortable.`;

    rationale = `Chosen leverages bold lateral thinking and PO constraint reversal balanced by practical grounding. Rejected defaults to generic corporate clichés and timid incrementalism.`;
  }

  return {
    system: mode === 'care'
      ? 'You are the InsightSpark Unified Multi-Task Model. When presented with [MODE: CARE], you enforce PERMA+H positive psychology, intergenerational kinship role distribution, mandatory 3-4h caregiver respite, and HIPAA zero-PII standards.'
      : 'You are the InsightSpark Unified Multi-Task Model. When presented with [MODE: CREATIVE], you deliver Edward de Bono lateral thinking provocations, PO reversals, and Grounding Shelf feasibility counterbalances.',
    prompt,
    chosen,
    rejected,
    metadata: {
      mode,
      strategy_id: strategy.id,
      strategy_name: mode === 'care' ? (strategy.careModeName || strategy.name) : strategy.name,
      persona: strategy.agentPersona,
      case_study: scenario,
      curator_orcid: BASE_METADATA.orcid,
      principles: mode === 'care' 
        ? ['PERMA+H', 'Kinship-Mesh', 'Caregiver-Respite', 'Dignity-Preservation']
        : ['Lateral-Thinking', 'Provocative-Operation', 'Grounding-Shelf', 'Combinatorial-Evolution'],
      preference_rationale: rationale,
    },
  };
}

function main() {
  console.log('🚀 Generating Unified Multi-Task DPO Dataset (24 Strategies x 2 Modes = 48 Tasks)...');

  const records = [];
  records.push({ _metadata: BASE_METADATA });

  let taskCount = 0;
  for (const strategy of STRATEGIES) {
    for (const mode of ['care', 'creative']) {
      const scenario = getScenarioForStrategy(strategy, mode);
      const pair = generatePair(strategy, mode, scenario);
      records.push(pair);
      taskCount++;
    }
  }

  const jsonlOutput = records.map((r) => JSON.stringify(r)).join('\n') + '\n';
  fs.writeFileSync(OUTPUT_JSONL, jsonlOutput, 'utf8');

  console.log(`✅ Generated ${taskCount} pairwise preference tasks across both modes.`);
  console.log(`📁 Saved to: ${OUTPUT_JSONL}`);
}

main();
