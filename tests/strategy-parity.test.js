import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STRATEGIES } from '../src/models/creative-types.ts';
import { STARTER_SCENARIOS } from '../src/models/starter-scenarios.ts';
import { WordCloudWarehouseService } from '../src/services/wordcloud-warehouse.service.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Strategy ID Parity & Zero-Blandness Regression Suite', () => {
  const validIds = new Set(STRATEGIES.map(s => s.id));

  test('All 25 canonical STRATEGIES have non-empty name, description, and agentPersona', () => {
    assert.ok(STRATEGIES.length >= 25, `Expected at least 25 strategies, found ${STRATEGIES.length}`);
    for (const s of STRATEGIES) {
      assert.ok(s.id && s.id.trim().length > 0, 'Strategy id must be non-empty');
      assert.ok(s.name && s.name.trim().length > 0, `Strategy ${s.id} name must be non-empty`);
      assert.ok(s.description && s.description.trim().length > 0, `Strategy ${s.id} description must be non-empty`);
      assert.ok(s.agentPersona && s.agentPersona.trim().length > 10, `Strategy ${s.id} agentPersona must be vivid and non-empty`);
    }
  });

  test('Every STARTER_SCENARIO recommendedStrategies ID exists in canonical STRATEGIES', () => {
    for (const scenario of STARTER_SCENARIOS) {
      assert.ok(
        Array.isArray(scenario.recommendedStrategies) && scenario.recommendedStrategies.length > 0,
        `Scenario ${scenario.id} must have recommendedStrategies`
      );
      for (const stratId of scenario.recommendedStrategies) {
        assert.ok(
          validIds.has(stratId),
          `Scenario "${scenario.id}" references unknown strategy ID "${stratId}". Valid IDs: ${[...validIds].join(', ')}`
        );
      }
    }
  });

  test('Every server.js STRATEGY_MAP key matches canonical STRATEGIES exactly', () => {
    const serverPath = path.join(__dirname, '..', 'server.js');
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    const mapMatch = serverContent.match(/const STRATEGY_MAP\s*=\s*\{([\s\S]*?)\n\};/);
    assert.ok(mapMatch, 'Could not locate STRATEGY_MAP in server.js');

    const keyRegex = /^\s*'([a-z0-9-]+)'\s*:/gm;
    const serverIds = new Set();
    let match;
    while ((match = keyRegex.exec(mapMatch[1])) !== null) {
      serverIds.add(match[1]);
    }

    for (const id of validIds) {
      assert.ok(serverIds.has(id), `Canonical strategy "${id}" is missing from server.js STRATEGY_MAP`);
    }
    for (const id of serverIds) {
      assert.ok(validIds.has(id), `server.js STRATEGY_MAP contains unknown strategy "${id}"`);
    }
  });

  test('WordCloudWarehouseService generates 100% distinct, prompt-grounded insights across any 3 chosen strategies', () => {
    const warehouse = new WordCloudWarehouseService();
    const prompt = 'Architecting a public winter reading pavilion that uses automated heliostat mirrors and circadian light spectrums to banish seasonal fatigue and nurture community warmth.';
    const chosen = STRATEGIES.filter(s => ['constraints', 'future', 'sensory-bridge'].includes(s.id));
    assert.equal(chosen.length, 3);

    const results = warehouse.synthesizeFromWarehouse(prompt, chosen, 'creative');
    assert.equal(results.length, 3);

    const allTexts = new Set();
    for (const group of results) {
      assert.equal(group.insights.length, 3);
      for (const item of group.insights) {
        assert.ok(!allTexts.has(item.text), `Duplicate insight text detected across strategies: "${item.text}"`);
        allTexts.add(item.text);
        assert.ok(
          /heliostat|pavilion|winter|reading|circadian|light|mirrors|seasonal|warmth/i.test(item.text),
          `Insight must weave prompt keywords into text: "${item.text}"`
        );
      }
    }
    assert.equal(allTexts.size, 9, 'All 9 generated cards across 3 strategies must be 100% unique');
    assert.ok(warehouse.activeWordCloud().length >= 6, 'Active WordCloud tokens should be populated');
  });
});
