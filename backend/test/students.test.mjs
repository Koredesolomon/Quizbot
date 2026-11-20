import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { buildStudentRows } = require('../dist/admin/students.js');

const id = (value) => ({ toString: () => value });

test('the students list keeps students who never started a quiz, and never exposes secrets', () => {
  const rows = buildStudentRows(
    [
      { _id: id('a1'), fullName: 'Ada Obi', email: 'ada@example.com', username: 'ada', authProvider: 'password', createdAt: new Date('2026-11-02T10:00:00Z'), passwordHash: 'SECRET', passwordResetTokenHash: 'TOKEN' },
      { _id: id('b2'), fullName: 'Tunde Ade', email: 'tunde@example.com', authProvider: 'google', createdAt: new Date('2026-11-05T09:30:00Z') },
      { _id: id('c3'), fullName: 'No Quizzes', email: 'none@example.com', createdAt: new Date('2026-11-06T08:00:00Z') },
    ],
    [
      { studentId: 'a1', started: 3, completed: 2, averagePercent: 66.6, lastActive: new Date('2026-11-10T12:00:00Z') },
      { studentId: 'b2', started: 1, completed: 0, averagePercent: null, lastActive: new Date('2026-11-07T12:00:00Z') },
    ],
  );

  assert.equal(rows.length, 3);
  assert.deepEqual(rows[0], {
    id: 'a1', fullName: 'Ada Obi', email: 'ada@example.com', username: 'ada', signInMethod: 'password',
    joinedAt: '2026-11-02T10:00:00.000Z', quizzesStarted: 3, quizzesCompleted: 2, averageScore: 67, lastActiveAt: '2026-11-10T12:00:00.000Z',
  });
  assert.equal(rows[1].signInMethod, 'google');
  assert.equal(rows[1].averageScore, null); // started a quiz, finished none
  assert.deepEqual([rows[2].quizzesStarted, rows[2].quizzesCompleted, rows[2].averageScore, rows[2].lastActiveAt], [0, 0, null, undefined]);
  assert.equal(rows[2].signInMethod, 'password'); // accounts without a provider are password accounts

  const serialized = JSON.stringify(rows);
  assert.ok(!/SECRET|TOKEN|passwordHash|passwordReset/.test(serialized));
});
