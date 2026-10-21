import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('reflect-metadata');
const { checkFinalAnswer } = require('../dist/grading/final-answer.js');
const { AiMarkerService } = require('../dist/attempts/ai-marker.service.js');

const numeric = (response, answer) => checkFinalAnswer('numeric', response, answer)?.correct;
const expression = (response, answer) => checkFinalAnswer('expression', response, answer)?.correct;

test('numeric answers accept the right value, rounding and units, and reject wrong values', () => {
  assert.equal(numeric('F = ma = 2 x 9.8 = 19.6 N', '19.6 N'), true);
  assert.equal(numeric('The answer is 19.62 N', '19.6 N'), true);
  assert.equal(numeric('19.6', '19.6'), true);
  assert.equal(numeric('Final answer: 20.9 N', '19.6 N'), false);
  assert.equal(numeric('a = 9.8 m/s^2', '9.8 m/s^2'), true);
  assert.equal(numeric('I do not know', '19.6 N'), false);
});

test('numeric answers understand scientific notation and negative numbers', () => {
  assert.equal(numeric('c = 3.0 × 10^8 m/s', '3 x 10^8 m/s'), true);
  assert.equal(numeric('3e8', '3.0 × 10^8'), true);
  assert.equal(numeric('= -4.9', '-4.9 m'), true);
  assert.equal(numeric('= 4.9', '-4.9 m'), false);
});

test('expression answers are compared by value, not by spelling', () => {
  assert.equal(expression('F = m * a', 'a * m'), true);
  assert.equal(expression('x^2 + 2x + 1', '(x + 1)^2'), true);
  assert.equal(expression('v = u + a*t', 'u + a t'), true);
  assert.equal(expression('v = u - a*t', 'u + a t'), false);
});

test('undecidable answers and plain text are left to the AI marker', () => {
  assert.equal(checkFinalAnswer('text', 'anything', 'anything'), null);
  assert.equal(checkFinalAnswer(undefined, 'anything', 'anything'), null);
  assert.equal(checkFinalAnswer('numeric', '7', 'no number here'), null);
  assert.equal(checkFinalAnswer('expression', '((', 'x + 1'), null);
});

function marker(env, handler, context) {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => { calls.push({ url: String(url), body: JSON.parse(options.body) }); return handler(calls.at(-1)); };
  context.after(() => { globalThis.fetch = original; });
  return { service: new AiMarkerService({ get: (key) => env[key] }), calls };
}
const question = { prompt: 'Q', topic: 'T', answer: '19.6 N', explanation: 'F = ma', marks: 4, toObject() { return this; } };
const ollama = (content) => new Response(JSON.stringify({ message: { content: JSON.stringify(content) } }), { status: 200 });

test('the Ollama provider is called locally with a JSON schema and the reply is labelled AI', async (context) => {
  const { service, calls } = marker({ AI_PROVIDER: 'ollama' }, () => ollama({ awarded: 3, correct: true, aiFeedback: 'Good method.' }), context);
  const review = await service.reviewTheoryAnswer(question, 'my answer', { awarded: 0, correct: false, aiFeedback: 'fallback', source: 'keyword' });
  assert.equal(calls[0].url, 'http://127.0.0.1:11434/api/chat');
  assert.equal(calls[0].body.model, 'qwen3:4b-instruct');
  assert.equal(calls[0].body.think, false);
  assert.equal(calls[0].body.format.required.includes('aiFeedback'), true);
  assert.deepEqual(review, { awarded: 3, correct: true, aiFeedback: 'Good method.', source: 'ai' });
});

test('an unreachable model falls back with the fallback label, or fails when AI is required', async (context) => {
  const { service } = marker({ AI_PROVIDER: 'ollama' }, () => { throw new Error('connect ECONNREFUSED'); }, context);
  const fallback = { awarded: 1, correct: false, aiFeedback: 'fallback', source: 'keyword' };
  assert.equal(await service.reviewTheoryAnswer(question, 'a', fallback), fallback);
  const strict = new AiMarkerService({ get: (key) => ({ AI_PROVIDER: 'ollama', AI_REVIEW_REQUIRED: 'true' })[key] });
  await assert.rejects(strict.reviewTheoryAnswer(question, 'a', fallback), /AI answer review failed/);
});

test('verdict explanations keep the code-decided verdict and repeat answers come from the cache', async (context) => {
  const { service, calls } = marker({ AI_PROVIDER: 'ollama' }, () => ollama({ feedback: 'You forgot g.' }), context);
  const first = await service.explainVerdict(question, 'x', false, 'fallback text');
  await service.explainVerdict(question, 'x', false, 'fallback text');
  assert.deepEqual(first, { aiFeedback: 'You forgot g.', source: 'ai' });
  assert.equal(JSON.parse(calls[0].body.messages[1].content).verdict, 'incorrect');
  assert.equal(calls.length, 1);
});

test('local requests are queued one at a time', async (context) => {
  let running = 0;
  let peak = 0;
  const { service } = marker({ AI_PROVIDER: 'ollama' }, async () => {
    peak = Math.max(peak, ++running);
    await new Promise((resolve) => setTimeout(resolve, 10));
    running--;
    return ollama({ feedback: 'ok' });
  }, context);
  await Promise.all(['a', 'b', 'c'].map((answer) => service.explainVerdict(question, answer, true, 'fb')));
  assert.equal(peak, 1);
});
