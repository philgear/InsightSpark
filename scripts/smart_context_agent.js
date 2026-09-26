#!/usr/bin/env node
/**
 * InsightSpark (Pivot & Pulse) — Smart Context & Local Edge Agent Engine
 * 
 * Implements:
 * 1. Smart Context Slotting & Compression (Identity, PERMA+H, Working Memory, Grounding)
 * 2. Local Edge Agent Execution via Lemonade / Ollama (llama3.2:3b, gemma4:latest)
 * 3. Local Confidential Clinical Triage (Zero-Egress HIPAA Shield)
 * 4. Synthetic DPO Pairwise Generator (TRL Preference Alignment)
 * 
 * Usage:
 *   node scripts/smart_context_agent.js triage "<health text>"
 *   node scripts/smart_context_agent.js generate --model <model> --persona <persona> "<prompt>"
 *   node scripts/smart_context_agent.js dpo-synth "<scenario>"
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function getLocalUrl() {
  const host = process.env.OLLAMA_HOST || 'http://localhost:11434';
  return host.startsWith('http://') || host.startsWith('https://') ? host : `http://${host}`;
}
const DEFAULT_LOCAL_URL = getLocalUrl();
const DEFAULT_MODEL = 'pivotpulse'; // Unified Multi-Task on-device model

/**
 * Smart Context Builder: Assembles structured, compressed context slots
 */
export function buildSmartContext({
  problem,
  mode = 'care',
  personaId = 'kinship-triad',
  workingMemory = {},
  invariants = ['perma', 'respite', 'de-identified'],
}) {
  const slots = {};

  // Slot 1: Core Persona & Stance
  if (personaId === 'kinship-triad') {
    slots.persona = 'You are the Intergenerational Kinship Coordinator, viewing situations through three generations: children, parents, and grandparents.';
  } else if (personaId === 'fmea') {
    slots.persona = 'You are the FMEA Risk Guardian, stress-testing plans to anticipate bottlenecks, safety risks, and caregiver fatigue.';
  } else if (personaId === 'what-if') {
    slots.persona = 'You are the Divergent Lateral Thinker, introducing provocative constraint reversals and radical reframes.';
  } else {
    slots.persona = 'You are a compassionate, dignified care planning partner.';
  }

  // Slot 2: Domain Invariants
  const invariantRules = [];
  if (invariants.includes('perma')) {
    invariantRules.push('Focus on PERMA+H positive psychology: Positive emotion, Engagement, Relationships, Meaning, Accomplishment, and Vitality.');
  }
  if (invariants.includes('respite')) {
    invariantRules.push('Protect caregiver sustainability: enforce at least 3-4 hours of weekly protected respite with designated handoff partners.');
  }
  if (invariants.includes('de-identified')) {
    invariantRules.push('Strict Zero-PII: Never repeat or output names, dates of birth, MRNs, phone numbers, or addresses.');
  }
  slots.invariants = invariantRules.join('\n');

  // Slot 3: Dynamic Working Memory (Compact Key-Value Store)
  if (Object.keys(workingMemory).length > 0) {
    slots.workingMemory = Object.entries(workingMemory)
      .map(([k, v]) => `[${k}]: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join('\n');
  }

  // Slot 4: Assembled System Instruction
  const systemInstruction = `
Role: ${slots.persona}

Operational Guardrails:
${slots.invariants}

${slots.workingMemory ? `Working Memory State:\n${slots.workingMemory}` : ''}
  `.trim();

  // Slot 5: User Query
  const formattedPrompt = `
Mode: ${mode.toUpperCase()}
Input Challenge: "${problem}"

Instructions:
Synthesize 2-3 actionable, asset-framed insights directly addressing this situation. Avoid pathologizing deficit language.
  `.trim();

  return {
    slots,
    systemInstruction,
    formattedPrompt,
  };
}

/**
 * Query local model on localhost:11434 via native fetch
 */
export async function queryLocalModel({
  model = DEFAULT_MODEL,
  prompt,
  system,
  temperature = 0.2,
  endpoint = DEFAULT_LOCAL_URL,
}) {
  const url = `${endpoint}/api/generate`;
  const startTime = Date.now();

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      system,
      stream: false,
      options: { temperature },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Local model request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const elapsedMs = Date.now() - startTime;

  return {
    model: data.model,
    response: data.response.trim(),
    elapsedMs,
    evalCount: data.eval_count,
    tokensPerSec: data.eval_count && data.eval_duration ? Number((data.eval_count / (data.eval_duration / 1e9)).toFixed(1)) : null,
  };
}

/**
 * Confidential Local Edge Triage (Zero-Egress PII & Emergency Scan)
 */
export async function evaluateClinicalTriage({
  input,
  model = DEFAULT_MODEL,
  endpoint = DEFAULT_LOCAL_URL,
}) {
  const triageSystem = `
You are an edge clinical safety classifier. Given a user query, output strict JSON with:
{
  "has_pii": boolean,
  "urgent_crisis": boolean, // suicidal, chest pain, stroke, acute emergency
  "triage_category": "routine" | "caregiver_burnout" | "emergency",
  "safe_summary": string // fully de-identified 1-sentence essence
}
Do NOT include markdown formatting or reasoning outside the JSON.
  `.trim();

  const result = await queryLocalModel({
    model,
    prompt: input,
    system: triageSystem,
    temperature: 0.1,
    endpoint,
  });

  try {
    const cleanJson = result.response.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch {
    return { rawResponse: result.response, parsed: false };
  }
}

/**
 * Synthetic DPO Pairwise Generator for Hugging Face TRL Fine-Tuning
 */
export async function generateDpoPair({
  scenario,
  model = 'gemma4:latest',
  endpoint = DEFAULT_LOCAL_URL,
}) {
  const dpoSystem = `
You are a Direct Preference Optimization (DPO) curator specializing in positive psychology and caregiver sustainability.
Generate a training pair in strict JSON with:
{
  "prompt": "The caregiving challenge",
  "chosen": "The preferred response (yw): Asset-based, honors autonomy, shares family burden, enforces respite, closed-loop 72h handoffs.",
  "rejected": "The penalized response (yl): Pathologizing deficit language, dumps 100% burden on single caregiver, paternalistic.",
  "rationale": "Why yw is preferred over yl"
}
Output ONLY valid JSON.
  `.trim();

  const result = await queryLocalModel({
    model,
    prompt: scenario,
    system: dpoSystem,
    temperature: 0.3,
    endpoint,
  });

  try {
    const cleanJson = result.response.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch {
    return { rawResponse: result.response, parsed: false };
  }
}

// CLI Execution Entrypoint
async function main() {
  const [,, command, ...args] = process.argv;

  if (!command || command === 'help') {
    console.log(`
InsightSpark Smart Context & Edge Agent Engine:
  node scripts/smart_context_agent.js triage "<query>"
  node scripts/smart_context_agent.js run --model <model> --persona <persona> "<problem>"
  node scripts/smart_context_agent.js dpo-synth "<scenario>"
    `);
    process.exit(0);
  }

  switch (command) {
    case 'triage': {
      const input = args.join(' ');
      if (!input) throw new Error('Specify text to triage.');
      console.log('🔒 Executing 100% confidential local edge triage...');
      const res = await evaluateClinicalTriage({ input });
      console.log(JSON.stringify(res, null, 2));
      break;
    }

    case 'run': {
      let model = DEFAULT_MODEL;
      let personaId = 'kinship-triad';
      let problem = '';

      for (let i = 0; i < args.length; i++) {
        if (args[i] === '--model' && args[i + 1]) {
          model = args[++i];
        } else if (args[i] === '--persona' && args[i + 1]) {
          personaId = args[++i];
        } else {
          problem += (problem ? ' ' : '') + args[i];
        }
      }

      if (!problem) throw new Error('Problem statement is required.');

      console.log(`🧠 Assembling smart context for persona "${personaId}" on model "${model}"...`);
      const context = buildSmartContext({ problem, personaId });
      const result = await queryLocalModel({
        model,
        prompt: context.formattedPrompt,
        system: context.systemInstruction,
      });

      console.log(`\n⏱️ Speed: ${result.tokensPerSec || '—'} tokens/sec (${result.elapsedMs} ms)`);
      console.log(`\n--- Agent Insights (${model}) ---\n${result.response}\n`);
      break;
    }

    case 'dpo-synth': {
      const scenario = args.join(' ');
      if (!scenario) throw new Error('Specify care scenario for DPO pair generation.');
      console.log('⚖️ Curating DPO preference pair (yw ≻ yl) via local Gemma/Llama...');
      const dpo = await generateDpoPair({ scenario });
      console.log(JSON.stringify(dpo, null, 2));
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('Fatal Error:', err.message);
    process.exit(1);
  });
}
