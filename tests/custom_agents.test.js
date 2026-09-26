import { test, describe } from 'node:test';
import assert from 'node:assert';
import { AGENTS_REGISTRY } from '../scripts/manage_custom_agents.js';

describe('Google GenAI Custom Managed Agents Suite', () => {
  const RESERVED_PREFIXES = [
    'antigravity-',
    'veo-',
    'omni-',
    'lyria-',
    'imagen-',
    'gemma-',
    'gemini-',
    'google-',
    'youtube-',
    'android-',
    'chrome-',
    'pixel-',
    'waze-',
    'fitbit-',
    'nest-',
    'kaggle-',
  ];

  test('Registry contains required InsightSpark custom agents', () => {
    const registeredIds = Object.keys(AGENTS_REGISTRY);
    assert.ok(registeredIds.includes('insightspark-kinship-planner'), 'Must define insightspark-kinship-planner');
    assert.ok(registeredIds.includes('insightspark-lateral-provocateur'), 'Must define insightspark-lateral-provocateur');
  });

  test('Agent IDs must NOT use Google-reserved prefixes', () => {
    Object.keys(AGENTS_REGISTRY).forEach((id) => {
      const lower = id.toLowerCase();
      RESERVED_PREFIXES.forEach((prefix) => {
        assert.ok(
          !lower.startsWith(prefix),
          `Agent ID "${id}" must not start with reserved prefix "${prefix}"`
        );
      });
    });
  });

  test('Kinship Planner agent configuration conforms to platform schema', () => {
    const agent = AGENTS_REGISTRY['insightspark-kinship-planner'];
    assert.strictEqual(agent.base_agent, 'antigravity-preview-05-2026');
    assert.strictEqual(agent.agent_config.type, 'antigravity');
    assert.strictEqual(agent.agent_config.model, 'gemini-3.8-flash');
    assert.ok(agent.system_instruction.includes('PERMA+H'), 'System prompt must mandate PERMA+H');
    assert.ok(agent.system_instruction.includes('Respite'), 'System prompt must mandate Respite');
    assert.ok(agent.tools.some((t) => t.type === 'code_execution'), 'Must include code execution');
    assert.ok(agent.tools.some((t) => t.type === 'google_search'), 'Must include google search');

    // Environment sources validation
    assert.strictEqual(agent.base_environment.type, 'remote');
    const sources = agent.base_environment.sources;
    assert.ok(sources.length >= 3, 'Must mount at least 3 inline file sources');
    assert.ok(sources.some((s) => s.target === '.agents/AGENTS.md'), 'Must mount .agents/AGENTS.md');
    assert.ok(
      sources.some((s) => s.target === '.agents/skills/intergenerational-kinship-care/SKILL.md'),
      'Must mount kinship care skill'
    );
    assert.ok(
      sources.some((s) => s.target === '.agents/skills/fhir-r4-careplan/SKILL.md'),
      'Must mount FHIR R4 care plan skill'
    );

    // Verify mounted content is non-empty
    sources.forEach((s) => {
      assert.ok(s.content && s.content.length > 50, `Source ${s.target} content must be loaded`);
    });
  });

  test('Lateral Provocateur agent configuration conforms to platform schema', () => {
    const agent = AGENTS_REGISTRY['insightspark-lateral-provocateur'];
    assert.strictEqual(agent.base_agent, 'antigravity-preview-05-2026');
    assert.strictEqual(agent.agent_config.type, 'antigravity');
    assert.strictEqual(agent.agent_config.model, 'gemini-3.8-flash');
    assert.ok(agent.system_instruction.includes('PO'), 'System prompt must reference PO');
    assert.ok(agent.system_instruction.includes('Grounding Shelf'), 'System prompt must reference Grounding Shelf');
    assert.ok(agent.tools.some((t) => t.type === 'code_execution'), 'Must include code execution');

    // Environment sources validation
    assert.strictEqual(agent.base_environment.type, 'remote');
    const sources = agent.base_environment.sources;
    assert.ok(sources.length >= 2, 'Must mount at least 2 inline file sources');
    assert.ok(
      sources.some((s) => s.target === '.agents/skills/lateral-thinking-provocations/SKILL.md'),
      'Must mount lateral thinking provocations skill'
    );
    assert.ok(
      sources.some((s) => s.target === '.agents/skills/dpo-preference-curation/SKILL.md'),
      'Must mount DPO preference skill'
    );
  });
});
