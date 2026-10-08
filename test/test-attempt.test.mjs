import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire, Module } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cache = new Map();

// Run the actual TypeScript API helpers using the project's installed compiler.
function loadSource(filename) {
  if (cache.has(filename)) return cache.get(filename).exports;
  const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const loaded = new Module(filename);
  loaded.filename = filename;
  loaded.require = (name) => name.startsWith('.') ? loadSource(resolve(dirname(filename), `${name}.ts`)) : require(name);
  cache.set(filename, loaded);
  loaded._compile(compiled, filename);
  return loaded.exports;
}
const api = loadSource(resolve(projectRoot, 'src/lib/api.ts'));
const { submitSavedAttempt, markedAttemptQuestions } = loadSource(resolve(projectRoot, 'src/lib/test-attempt.ts'));

function mockFetch(context, handler) {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    const call = { path: new URL(url).pathname, ...options };
    calls.push(call);
    return handler(call);
  };
  context.after(() => { globalThis.fetch = original; });
  return calls;
}
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const result = () => ({
  attempt: { id: 'attempt', status: 'completed', score: 2, totalMarks: 10, percent: 20 },
  questions: [
    { id: 'first', type: 'objective', prompt: 'First question', answer: 'Right', explanation: 'First explanation', marks: 2 },
    { id: 'second', type: 'theory', prompt: 'Second question', answer: 'Model answer', explanation: 'Second explanation', marks: 8 },
  ],
  answers: [
    { questionId: 'first', answer: 'Right', awarded: 2, correct: true, aiFeedback: 'Correct' },
    { questionId: 'second', answer: '', awarded: 0, correct: false, aiFeedback: 'No response' },
  ],
});

test('test starts send the chosen quiz ID and student session to the backend', async (context) => {
  const calls = mockFetch(context, () => json({ attempt: { id: 'saved-attempt', status: 'active' }, questions: [] }));
  const started = await api.startAttempt('selected-quiz', 'student-session');
  assert.equal(started.attempt.id, 'saved-attempt');
  assert.equal(calls[0].path, '/attempts/start');
  assert.equal(calls[0].headers.get('Authorization'), 'Bearer student-session');
  assert.deepEqual(JSON.parse(calls[0].body), { quizId: 'selected-quiz' });
});

test('failed test starts reject rather than creating a browser-only attempt', async (context) => {
  mockFetch(context, () => json({ message: 'Please sign in again' }, 401));
  await assert.rejects(api.startAttempt('quiz', 'expired-session'), /Please sign in again/);
});

test('private question requests use the protected admin endpoint and session', async (context) => {
  const calls = mockFetch(context, () => json([]));
  await api.getAdminQuestions('admin-session');
  assert.equal(calls[0].path, '/questions/admin');
  assert.equal(calls[0].headers.get('Authorization'), 'Bearer admin-session');
});

test('submission failures reject with the original error when no saved result exists', async (context) => {
  const answers = { first: 'Right' };
  const calls = mockFetch(context, (call) => call.method === 'POST'
    ? json({ message: 'Grading service unavailable' }, 503) : json({ message: 'No completed result' }, 409));
  await assert.rejects(submitSavedAttempt('attempt', answers, 'student-session'), /Grading service unavailable/);
  assert.deepEqual(answers, { first: 'Right' });
  assert.equal(calls.length, 2);
  assert.equal(calls[1].method, undefined);
  assert.equal(calls[1].path, '/attempts/attempt/result');
});

test('a lost submission response recovers the saved result without regrading', async (context) => {
  const saved = result();
  const calls = mockFetch(context, (call) => {
    if (call.method === 'POST') throw new TypeError('Connection lost after saving');
    return json(saved);
  });
  assert.deepEqual(await submitSavedAttempt('attempt', { first: 'Right' }, 'student-session'), saved);
  assert.equal(calls.filter((call) => call.method === 'POST').length, 1);
  assert.equal(calls[1].headers.get('Authorization'), 'Bearer student-session');
});

test('network failures never synthesize a successful result', async (context) => {
  mockFetch(context, () => { throw new TypeError('Offline'); });
  await assert.rejects(submitSavedAttempt('attempt', { first: 'Right' }, 'student-session'), /Cannot reach/);
});

test('results use saved marking and include unanswered questions and model explanations', () => {
  const marked = markedAttemptQuestions(result());
  assert.equal(marked.length, 2);
  assert.equal(marked[0].awarded, 2);
  assert.equal(marked[1].awarded, 0);
  assert.equal(marked[1].userAnswer, '');
  assert.equal(marked[1].answer, 'Model answer');
  assert.equal(marked[1].explanation, 'Second explanation');
});

test('incomplete or active responses cannot render as completed results', () => {
  const incomplete = result();
  incomplete.answers.pop();
  assert.throws(() => markedAttemptQuestions(incomplete), /incomplete/);
  const active = result();
  active.attempt.status = 'active';
  assert.throws(() => markedAttemptQuestions(active), /saved completed result/);
});
