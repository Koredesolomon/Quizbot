import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire, Module } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = resolve(root, 'src/lib/students-csv.ts');
const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const loaded = new Module(file);
loaded.filename = file;
loaded._compile(code, file);
const { csvCell, studentsToCsv, filterStudents } = loaded.exports;

const student = (overrides = {}) => ({
  id: '1', fullName: 'Ada Obi', email: 'ada@example.com', username: 'ada', signInMethod: 'password',
  joinedAt: '2026-11-02T10:00:00.000Z', quizzesStarted: 3, quizzesCompleted: 2, averageScore: 67, lastActiveAt: '2026-11-10T12:00:00.000Z', ...overrides,
});

test('CSV cells are quoted when needed and cannot run as spreadsheet formulas', () => {
  assert.equal(csvCell('plain'), 'plain');
  assert.equal(csvCell('Obi, Ada'), '"Obi, Ada"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell(null), '');
  assert.equal(csvCell(0), '0');
  // A student could register with a name like this; spreadsheets would run it as a formula.
  assert.equal(csvCell('=HYPERLINK("http://evil.example","click")'), '"\'=HYPERLINK(""http://evil.example"",""click"")"');
  assert.equal(csvCell('+1234'), "'+1234");
  assert.equal(csvCell('@SUM(A1)'), "'@SUM(A1)");
});

test('the students CSV has a header row and one row per student, with blanks for missing values', () => {
  const csv = studentsToCsv([student(), student({ id: '2', fullName: 'New Person', email: 'new@example.com', username: undefined, signInMethod: 'google', quizzesStarted: 0, quizzesCompleted: 0, averageScore: null, lastActiveAt: undefined })]);
  const lines = csv.split('\r\n');
  assert.equal(lines.length, 3);
  assert.equal(lines[0], 'Full name,Email,Username,Sign-in method,Date joined,Quizzes started,Quizzes completed,Average score (%),Last active');
  assert.equal(lines[1], 'Ada Obi,ada@example.com,ada,Email and password,2026-11-02,3,2,67,2026-11-10');
  assert.equal(lines[2], 'New Person,new@example.com,,Google,2026-11-02,0,0,,');
});

test('students can be searched by name, email or username, ignoring case', () => {
  const list = [student(), student({ id: '2', fullName: 'Tunde Ade', email: 'tunde@mail.com', username: 'tade' })];
  assert.equal(filterStudents(list, '').length, 2);
  assert.deepEqual(filterStudents(list, 'ADA').map((item) => item.id), ['1']);
  assert.deepEqual(filterStudents(list, 'tunde@').map((item) => item.id), ['2']);
  assert.deepEqual(filterStudents(list, 'tade').map((item) => item.id), ['2']);
  assert.equal(filterStudents(list, 'nobody').length, 0);
});
