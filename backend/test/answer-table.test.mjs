import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('reflect-metadata');
const { QuestionsService } = require('../dist/questions/questions.service.js');
const { tableToMarkdown } = require('../dist/grading/answer-table.js');
const { AiMarkerService } = require('../dist/attempts/ai-marker.service.js');

const table = { corner: '⊗', columns: ['0', '1', '2'], rows: ['0', '1'], solution: [['0', '0', '0'], ['0', '1', '2']] };
const base = { topic: 'Modular arithmetic', prompt: 'Complete the table', marks: 6, answer: 'See the table', type: 'theory' };

test('a table to fill in is validated: theory only, headed rows and columns, a solution of the same size', () => {
  const service = new QuestionsService({});
  service.validateQuestion({ ...base, answerTable: table });
  service.validateQuestion({ ...base, answerTable: { columns: ['a'], rows: ['b'] } });
  assert.throws(() => service.validateQuestion({ ...base, type: 'objective', options: ['A', 'B'], answer: 'A', answerTable: table }), /Only written/);
  assert.throws(() => service.validateQuestion({ ...base, answerTable: { ...table, columns: ['0', ' ', '2'] } }), /needs a heading/);
  assert.throws(() => service.validateQuestion({ ...base, answerTable: { ...table, solution: [['0', '0', '0']] } }), /same rows and columns/);
  assert.throws(() => service.validateQuestion({ ...base, answerTable: { ...table, solution: [['0', '0'], ['0', '1']] } }), /same rows and columns/);
});

test('students receive the table headings but never the correct cells', () => {
  const service = new QuestionsService({});
  const stored = { id: 'q1', type: 'theory', topic: 'T', prompt: 'P', marks: 6, answer: 'A', explanation: '', answerTable: table, createdBy: { toString: () => 'admin' }, createdAt: new Date() };
  const prompt = service.publicPrompt(stored);
  assert.deepEqual(prompt.answerTable, { corner: '⊗', columns: ['0', '1', '2'], rows: ['0', '1'] });
  assert.equal(JSON.stringify(prompt).includes('solution'), false);
  assert.deepEqual(service.publicQuestion(stored).answerTable.solution, table.solution);
});

test('a table is written as a markdown table, with pipes escaped and missing cells left blank', () => {
  assert.equal(tableToMarkdown(table, [['a|b', '', 'c'], []]), [
    '| ⊗ | 0 | 1 | 2 |',
    '| --- | --- | --- | --- |',
    '| 0 | a\\|b |  | c |',
    '| 1 |  |  |  |',
  ].join('\n'));
});

test('the AI marker is given the correct table to compare the filled table with', async (context) => {
  const original = globalThis.fetch;
  let sent;
  globalThis.fetch = async (_url, options) => {
    sent = JSON.parse(options.body);
    return new Response(JSON.stringify({ message: { content: JSON.stringify({ awarded: 4, correct: false, aiFeedback: 'Row 1 has one wrong cell.' }) } }), { status: 200 });
  };
  context.after(() => { globalThis.fetch = original; });
  const marker = new AiMarkerService({ get: (key) => ({ AI_PROVIDER: 'ollama' })[key] });
  const question = { ...base, keywords: [], answerTable: table, explanation: '' };
  const filled = tableToMarkdown(table, [['0', '0', '0'], ['0', '1', '3']]);
  const review = await marker.reviewTheoryAnswer(question, filled, { awarded: 0, correct: false, aiFeedback: 'fallback', source: 'keyword' });
  const payload = JSON.parse(sent.messages[1].content);
  assert.match(payload.modelAnswer, /Correct table:\n\| ⊗ \| 0 \| 1 \| 2 \|/);
  assert.match(payload.studentAnswer, /\| 1 \| 0 \| 1 \| 3 \|/);
  assert.match(sent.messages[0].content, /markdown table they filled in/);
  assert.equal(review.source, 'ai');
});
