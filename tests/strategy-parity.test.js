import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STRATEGIES } from '../src/models/creative-types.ts';
import { STARTER_SCENARIOS } from '../src/models/starter-scenarios.ts';

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
});
