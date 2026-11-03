import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const file = resolve(dirname(fileURLToPath(import.meta.url)), '../src/lib/marking-estimate.ts');
const compiled = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const loaded = { exports: {} };
new Function('module', 'exports', compiled)(loaded, loaded.exports);
const { estimateMarking, markingMessage } = loaded.exports;

const theory = (id) => ({ id, type: 'theory' });
const choice = (id, answerBox) => ({ id, type: 'objective', answerBox });

test('only answered written work and explanations count as work for the AI', () => {
  const questions = [theory('t1'), theory('t2'), choice('c1'), choice('c2', true), choice('c3')];
  const estimate = estimateMarking(questions, { t1: 'text', t2: '  ', c1: 'A', c2: 'B\n\n--- Explanation ---\nbecause', c3: '' });
  assert.equal(estimate.writtenAnswers, 2);
  assert.ok(estimate.lowSeconds < estimate.highSeconds);
});

test('the message follows the amount of written work', () => {
  const none = markingMessage(estimateMarking([choice('c1')], { c1: 'A' }), 0);
  assert.match(none, /Checking your answers and writing your review.*under a minute/);

  const few = markingMessage(estimateMarking([theory('t1')], { t1: 'x' }), 0);
  assert.match(few, /Reading your 1 written answer one by one, then writing your review/);
  assert.match(few, /under a minute/);

  const many = Array.from({ length: 12 }, (_, index) => theory(`t${index}`));
  const filled = Object.fromEntries(many.map((question) => [question.id, 'answer']));
  const long = markingMessage(estimateMarking(many, filled), 0);
  assert.match(long, /Reading your 12 written answers/);
  assert.match(long, /about \d+ to \d+ minutes/);
  assert.notEqual(long, few);
});

test('past the expected time the message says it is taking longer, and that nothing is lost', () => {
  const estimate = estimateMarking([theory('t1')], { t1: 'x' });
  assert.match(markingMessage(estimate, estimate.highSeconds + 1), /taking longer than usual.*saved/);
  assert.doesNotMatch(markingMessage(estimate, estimate.highSeconds), /taking longer/);
});

test('questions left blank still add review time, because the final review reads every question', () => {
  const blank = Array.from({ length: 30 }, (_, index) => ({ id: `q${index}`, type: 'objective' }));
  const few = [{ id: 'q0', type: 'objective' }];
  const slow = estimateMarking(blank, {});
  const quick = estimateMarking(few, {});
  assert.equal(slow.writtenAnswers, 0);
  assert.ok(slow.highSeconds > quick.highSeconds * 3);
});
