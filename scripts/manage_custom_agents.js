#!/usr/bin/env node
/**
 * InsightSpark (Pivot & Pulse) — Google GenAI Custom Managed Agents
 * 
 * Provides CLI commands and programmatic utilities to provision, inspect,
 * invoke, and manage persistent sandboxed agents via client.agents.create()
 * and client.interactions.create().
 * 
 * Usage:
 *   node scripts/manage_custom_agents.js list
 *   node scripts/manage_custom_agents.js create [agent-id]
 *   node scripts/manage_custom_agents.js get <agent-id>
 *   node scripts/manage_custom_agents.js delete <agent-id>
 *   node scripts/manage_custom_agents.js interact <agent-id> "<prompt>"
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Helper to load .env.local
function loadEnv() {
  const envPath = path.join(ROOT_DIR, '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val.trim();
      }
    });
  }
}

loadEnv();

function getClient(apiKeyOverride) {
  const apiKey = apiKeyOverride || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set. Check .env.local or pass an API key.');
  }
  return new GoogleGenAI({ apiKey });
}

// Read markdown files safely to mount into base_environment
function readFileSafe(relPath) {
  const fullPath = path.join(ROOT_DIR, relPath);
  if (fs.existsSync(fullPath)) {
    return fs.readFileSync(fullPath, 'utf8');
  }
  return '';
}

/**
 * Registry of InsightSpark Managed Agents definitions
 */
export const AGENTS_REGISTRY = {
  'insightspark-kinship-planner': {
    id: 'insightspark-kinship-planner',
    description: 'Intergenerational Care Planner & Kinship Mesh Synthesizer with PERMA+H & Respite Guardrails',
    base_agent: 'antigravity-preview-05-2026',
    agent_config: {
      type: 'antigravity',
      model: 'gemini-3.8-flash',
    },
    system_instruction: `
You are the InsightSpark Intergenerational Kinship Care Coordinator.
Your mission is to synthesize collaborative care plans, protect against caregiver burnout, and empower family autonomy.

Core Invariants:
1. Positive Psychology (PERMA+H): Frame every plan around strengths (Positive Emotion, Engagement, Relationships, Meaning, Accomplishment, and Vitality).
2. Caregiver Respite Safeguards: Mandate minimum 3-4 hours/week of protected respite with designated handoff partners.
3. Critical Transition Checklists: Provide closed-loop 72h / 30d post-transition handoffs (medication reconciliation, environmental safety).
4. Dignity-First & HIPAA-Compliant: Under no circumstances repeat or store PII. Always use person-centered, de-identified language.
5. Standard Output: When asked for a care plan, output both human-readable Markdown and structured HL7 FHIR R4 Bundle resources.
    `.trim(),
    tools: [
      { type: 'code_execution' },
      { type: 'google_search' },
      { type: 'url_context' },
    ],
    base_environment: {
      type: 'remote',
      sources: [
        {
          type: 'inline',
          target: '.agents/AGENTS.md',
          content: readFileSafe('AGENTS.md'),
        },
        {
          type: 'inline',
          target: '.agents/skills/intergenerational-kinship-care/SKILL.md',
          content: readFileSafe('.agents/skills/intergenerational-kinship-care/SKILL.md'),
        },
        {
          type: 'inline',
          target: '.agents/skills/fhir-r4-careplan/SKILL.md',
          content: readFileSafe('.agents/skills/fhir-r4-careplan/SKILL.md'),
        },
      ],
    },
  },

  'insightspark-lateral-provocateur': {
    id: 'insightspark-lateral-provocateur',
    description: 'Lateral Thinking Provocateur & Divergent Brainstorm Engine based on Edward de Bono & Grounding Shelf',
    base_agent: 'antigravity-preview-05-2026',
    agent_config: {
      type: 'antigravity',
      model: 'gemini-3.8-flash',
    },
    system_instruction: `
You are the InsightSpark Lateral Thinking Provocateur.
Your mission is to break cognitive fixation and shatter default assumptions using Edward de Bono's lateral thinking methodologies.

Methodologies:
1. Provocative Operations (PO): Challenge orthodoxies by stating deliberate exaggerations or reversals.
2. 14 Lateral Provocation Strategies: What If, Redefine Constraints, Butterfly Effect, Combinatorial Evolution, Opposite Day, etc.
3. Grounding Shelf Counterbalances: Always balance extreme lateral ideas with practical execution (FMEA Pre-Mortem risk analysis and Critical Path Method dependencies).
4. DPO Pairwise Preferences: Prioritize asset-based, creative empowerment over pathologizing deficit language.
    `.trim(),
    tools: [
      { type: 'code_execution' },
      { type: 'google_search' },
    ],
    base_environment: {
      type: 'remote',
      sources: [
        {
          type: 'inline',
          target: '.agents/skills/lateral-thinking-provocations/SKILL.md',
          content: readFileSafe('.agents/skills/lateral-thinking-provocations/SKILL.md'),
        },
        {
          type: 'inline',
          target: '.agents/skills/dpo-preference-curation/SKILL.md',
          content: readFileSafe('.agents/skills/dpo-preference-curation/SKILL.md'),
        },
      ],
    },
  },
};

/**
 * List all custom agents
 */
export async function listAgents(client = getClient()) {
  const result = await client.agents.list();
  return result?.agents || [];
}

/**
 * Create or overwrite a custom agent
 */
export async function createAgent(client = getClient(), agentId) {
  const definition = AGENTS_REGISTRY[agentId];
  if (!definition) {
    throw new Error(`Agent ID "${agentId}" is not registered in AGENTS_REGISTRY. Available: ${Object.keys(AGENTS_REGISTRY).join(', ')}`);
  }

  console.log(`🚀 Provisioning managed agent "${definition.id}" with base runtime "${definition.base_agent}"...`);
  const agent = await client.agents.create(definition);
  console.log(`✅ Managed agent successfully created: ${agent.id}`);
  return agent;
}

/**
 * Get details of a custom agent
 */
export async function getAgent(client = getClient(), agentId) {
  return await client.agents.get(agentId);
}

/**
 * Delete a custom agent
 */
export async function deleteAgent(client = getClient(), agentId) {
  console.log(`🗑️ Deleting managed agent "${agentId}"...`);
  await client.agents.delete(agentId);
  console.log(`✅ Agent "${agentId}" successfully deleted.`);
}

/**
 * Send an interaction to a custom agent
 */
export async function interactWithAgent(client = getClient(), agentId, inputPrompt) {
  console.log(`💬 Invoking custom agent "${agentId}"...`);
  const interaction = await client.interactions.create({
    agent: agentId,
    input: inputPrompt,
    environment: 'remote',
  });
  return interaction;
}

// CLI Execution Entrypoint
async function main() {
  const [,, command, targetId, ...rest] = process.argv;

  if (!command || command === 'help') {
    console.log(`
InsightSpark Custom Managed Agents CLI:
  node scripts/manage_custom_agents.js list
  node scripts/manage_custom_agents.js create [agent-id | all]
  node scripts/manage_custom_agents.js get <agent-id>
  node scripts/manage_custom_agents.js delete <agent-id>
  node scripts/manage_custom_agents.js interact <agent-id> "<prompt>"
    `);
    process.exit(0);
  }

  const client = getClient();

  switch (command) {
    case 'list': {
      console.log('🔍 Querying managed agents in project...');
      const agents = await listAgents(client);
      if (agents.length === 0) {
        console.log('No custom managed agents found in this project.');
      } else {
        console.table(agents.map(a => ({
          ID: a.id,
          Description: a.description || '—',
          BaseAgent: a.base_agent || '—',
          Created: a.create_time || '—',
        })));
      }
      break;
    }

    case 'create': {
      const targets = !targetId || targetId === 'all' 
        ? Object.keys(AGENTS_REGISTRY) 
        : [targetId];

      for (const id of targets) {
        try {
          await createAgent(client, id);
        } catch (err) {
          console.error(`❌ Failed to create agent "${id}":`, err.message);
        }
      }
      break;
    }

    case 'get': {
      if (!targetId) throw new Error('Specify agent-id to fetch: node scripts/manage_custom_agents.js get <agent-id>');
      const agent = await getAgent(client, targetId);
      console.log(JSON.stringify(agent, null, 2));
      break;
    }

    case 'delete': {
      if (!targetId) throw new Error('Specify agent-id to delete: node scripts/manage_custom_agents.js delete <agent-id>');
      await deleteAgent(client, targetId);
      break;
    }

    case 'interact': {
      if (!targetId) throw new Error('Specify agent-id: node scripts/manage_custom_agents.js interact <agent-id> "<prompt>"');
      const prompt = rest.join(' ');
      if (!prompt) throw new Error('Prompt is required.');
      const response = await interactWithAgent(client, targetId, prompt);
      console.log('\n--- Agent Output ---');
      console.log(response.output_text || JSON.stringify(response, null, 2));
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('Fatal CLI Error:', err.message);
    process.exit(1);
  });
}
