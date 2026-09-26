import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

describe('Unified Multi-Task DPO Preference Suite (Option B)', () => {
  const jsonlPath = path.join(ROOT_DIR, 'datasets', 'multitask-dpo.jsonl');
  const parquetPath = path.join(ROOT_DIR, 'datasets', 'multitask-dpo.parquet');

  test('multitask-dpo.jsonl exists and contains exactly 48 paired tasks + 1 metadata header', () => {
    assert.ok(fs.existsSync(jsonlPath), 'multitask-dpo.jsonl must exist');
    const lines = fs.readFileSync(jsonlPath, 'utf8').trim().split('\n');
    assert.strictEqual(lines.length, 49, 'Must have 49 lines (1 metadata + 48 task pairs)');

    const metadata = JSON.parse(lines[0]);
    assert.strictEqual(metadata._metadata.format, 'DPO_JSONL_PAIRWISE_PREFERENCES');
    assert.strictEqual(metadata._metadata.curator, 'Phil Gear');
  });

  test('All 48 tasks have valid task prefix tokens, chosen yw, and rejected yl', () => {
    const lines = fs.readFileSync(jsonlPath, 'utf8').trim().split('\n').slice(1);
    let careCount = 0;
    let creativeCount = 0;

    lines.forEach((line, idx) => {
      const record = JSON.parse(line);
      assert.ok(record.prompt, `Row ${idx + 1} must have a prompt`);
      assert.ok(record.chosen, `Row ${idx + 1} must have chosen (yw)`);
      assert.ok(record.rejected, `Row ${idx + 1} must have rejected (yl)`);
      assert.ok(record.metadata, `Row ${idx + 1} must have metadata`);

      if (record.metadata.mode === 'care') {
        careCount++;
        assert.ok(record.prompt.startsWith('[MODE: CARE]'), 'Care task prompt must start with [MODE: CARE]');
        assert.ok(record.chosen.includes('PERMA+H'), 'Care task chosen must emphasize PERMA+H');
      } else if (record.metadata.mode === 'creative') {
        creativeCount++;
        assert.ok(record.prompt.startsWith('[MODE: CREATIVE]'), 'Creative task prompt must start with [MODE: CREATIVE]');
        assert.ok(record.chosen.includes('PO'), 'Creative task chosen must emphasize PO/lateral thinking');
      }
    });

    assert.strictEqual(careCount, 24, 'Must have exactly 24 Care Mode tasks');
    assert.strictEqual(creativeCount, 24, 'Must have exactly 24 Creative Mode tasks');
  });

  test('multitask-dpo.parquet exists with high-compression binary encoding', () => {
    assert.ok(fs.existsSync(parquetPath), 'multitask-dpo.parquet must exist');
    const stats = fs.statSync(parquetPath);
    assert.ok(stats.size > 10000, `Parquet file size (${stats.size} bytes) must be non-trivial`);
  });
});
