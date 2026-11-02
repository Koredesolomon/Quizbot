import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const file = resolve(dirname(fileURLToPath(import.meta.url)), '../src/lib/answer-table.ts');
const compiled = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const loaded = { exports: {} };
new Function('module', 'exports', compiled)(loaded, loaded.exports);
const { serializeTableAnswer, parseTableAnswer, emptyCells } = loaded.exports;

const table = { corner: '⊗', columns: ['0', '1', '2'], rows: ['0', '1'] };

test('a filled table round-trips through the stored answer, with the written part kept apart', () => {
  const cells = [['0', '0', '0'], ['0', '1', ' 2 ']];
  const stored = serializeTableAnswer(table, cells, '(b) x = 4\n(c) identity is 1');
  assert.match(stored, /^\| ⊗ \| 0 \| 1 \| 2 \|\n\| --- \| --- \| --- \| --- \|\n\| 0 \| 0 \| 0 \| 0 \|\n\| 1 \| 0 \| 1 \|  2  \|/);
  assert.deepEqual(parseTableAnswer(table, stored), { cells, text: '(b) x = 4\n(c) identity is 1' });
});

test('an untouched table stays unanswered, and plain text answers are not mistaken for a table', () => {
  assert.equal(serializeTableAnswer(table, emptyCells(table), ''), '');
  assert.equal(serializeTableAnswer(table, emptyCells(table), 'just words'), 'just words');
  assert.deepEqual(parseTableAnswer(table, 'just words'), { cells: emptyCells(table), text: 'just words' });
  const partial = serializeTableAnswer(table, [['1', '', ''], ['', '', '']], '');
  assert.equal(parseTableAnswer(table, partial).cells[0][0], '1');
  assert.equal(parseTableAnswer(table, partial).text, '');
});

test('pipes and line breaks typed into a cell cannot break the table', () => {
  const cells = [['a|b', 'x\ny', ''], ['', '', '']];
  const parsed = parseTableAnswer(table, serializeTableAnswer(table, cells, 'note'));
  assert.equal(parsed.cells[0][0], 'a|b');
  assert.equal(parsed.cells[0][1], 'x y');
  assert.equal(parsed.text, 'note');
});
