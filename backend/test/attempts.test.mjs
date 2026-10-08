import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const mongoose = require('mongoose');
const { ValidationPipe } = require('@nestjs/common');
const { AttemptsService } = require('../dist/attempts/attempts.service.js');
const { AttemptsController } = require('../dist/attempts/attempts.controller.js');
const { AttemptSchema } = require('../dist/attempts/attempt.schema.js');
const { QuestionSchema } = require('../dist/questions/question.schema.js');
const { QuestionsService } = require('../dist/questions/questions.service.js');
const { StartAttemptDto, SubmitAttemptDto } = require('../dist/attempts/dto.js');
const { Types } = mongoose;
const AttemptModel = mongoose.model('SecurityAttemptFixture', AttemptSchema);
const QuestionModel = mongoose.model('SecurityQuestionFixture', QuestionSchema);

function fixture() {
  const studentId = new Types.ObjectId().toString();
  const quizId = new Types.ObjectId().toString();
  const courseId = new Types.ObjectId().toString();
  const questions = [2, 8].map((marks, index) => new QuestionModel({
    type: 'objective', quizId, courseId, topic: `Topic ${index + 1}`, prompt: `Question ${index + 1}`,
    options: ['Right', 'Wrong'], answer: 'Right', explanation: 'PRIVATE_EXPLANATION', marks,
    keywords: ['PRIVATE_KEYWORD'], rubricPoints: ['PRIVATE_RUBRIC'], createdBy: new Types.ObjectId(), createdAt: new Date(),
  }));
  const records = new Map();
  let completionCount = 0;
  let failCompletion = false;
  const query = (run) => ({ select() { return this; }, sort() { return this; }, populate() { return this; }, exec: run });
  const matches = (record, filter) => {
    if (!record) return false;
    for (const key of ['_id', 'studentId', 'status', 'submissionToken']) {
      if (filter[key] !== undefined && String(record[key]) !== String(filter[key])) return false;
    }
    if (filter.$or) return !record.submissionToken || record.submissionStartedAt < filter.$or[1].submissionStartedAt.$lt;
    return true;
  };
  const update = (record, changes) => {
    Object.assign(record, changes.$set ?? {});
    for (const key of Object.keys(changes.$unset ?? {})) delete record[key];
  };
  const model = {
    async create(input) {
      const doc = new AttemptModel({ ...input, createdAt: new Date() });
      await doc.validate();
      records.set(doc.id, doc.toObject());
      return doc;
    },
    findById(id) { return query(async () => records.has(id) ? new AttemptModel(records.get(id)) : null); },
    find(filter = {}) { return query(async () => [...records.values()].filter((record) =>
      !filter.studentId || record.studentId.toString() === filter.studentId.toString()).map((record) => new AttemptModel(record))); },
    findOneAndUpdate(filter, changes, options) {
      return query(async () => {
        const record = records.get(filter._id.toString());
        if (!matches(record, filter)) return null;
        if (changes.$set?.status === 'completed' && failCompletion) throw new Error('Database write failed');
        update(record, changes);
        const doc = new AttemptModel(record);
        if (options?.runValidators) await doc.validate();
        records.set(doc.id, doc.toObject());
        if (doc.status === 'completed') completionCount++;
        return doc;
      });
    },
    updateOne(filter, changes) { return query(async () => {
      const record = records.get(filter._id.toString());
      if (matches(record, filter)) update(record, changes);
    }); },
  };
  const questionService = new QuestionsService({ find: (filter) => query(async () => questions.filter((question) => question.quizId === filter.quizId)) });
  let reviewCount = 0;
  const marker = {
    async reviewTheoryAnswer() { throw new Error('AI unavailable'); },
    async reviewCompletedTest() { reviewCount++; return 'Saved feedback'; },
  };
  const content = { async findPublishedQuiz(id) {
    if (id !== quizId) throw new Error('Published quiz was not found.');
    return { courseId, quizId };
  } };
  const service = new AttemptsService(model, questionService, marker, content);
  return { studentId, quizId, questions, records, service, marker, content,
    start: () => service.start(studentId, quizId), completionCount: () => completionCount,
    reviewCount: () => reviewCount, failCompletion: (value) => { failCompletion = value; } };
}

test('starting a quiz snapshots its questions and total without exposing answers', async () => {
  const f = fixture();
  const started = await f.start();
  assert.equal(started.attempt.quizId, f.quizId);
  assert.equal(started.attempt.totalMarks, 10);
  assert.equal(started.attempt.questionCount, 2);
  assert.equal(started.questions.length, 2);
  assert.equal(JSON.stringify(started).includes('PRIVATE_'), false);
  assert.equal(Object.hasOwn(started.questions[0], 'answer'), false);
  assert.equal(Object.hasOwn(started.attempt, 'questionSnapshots'), false);
  assert.equal(f.records.get(started.attempt.id).questionSnapshots.length, 2);
});

test('unanswered questions count as zero in the full quiz total and completed review', async () => {
  const f = fixture();
  let review;
  f.marker.reviewCompletedTest = async (input) => { review = input; return 'Saved feedback'; };
  const { attempt } = await f.start();
  const result = await f.service.submit(attempt.id, f.studentId, [{ questionId: f.questions[0].id, answer: 'Right' }]);
  assert.equal(result.attempt.score, 2);
  assert.equal(result.attempt.totalMarks, 10);
  assert.equal(result.attempt.percent, 20);
  assert.equal(result.attempt.answeredCount, 1);
  assert.equal(result.answers.length, 2);
  assert.equal(result.answers[1].awarded, 0);
  assert.equal(result.answers[1].answer, '');
  assert.equal(review.answers.length, 2);
  assert.equal(result.questions[0].explanation, 'PRIVATE_EXPLANATION');
  assert.equal(f.records.get(attempt.id).gradedAnswers.length, 2);
});

test('an empty submission scores zero against the entire quiz', async () => {
  const f = fixture();
  const { attempt } = await f.start();
  const result = await f.service.submit(attempt.id, f.studentId, []);
  assert.equal(result.attempt.score, 0);
  assert.equal(result.attempt.totalMarks, 10);
  assert.equal(result.attempt.percent, 0);
  assert.equal(result.answers.length, 2);
});

test('duplicate and foreign question IDs are rejected before grading or saving', async () => {
  const f = fixture();
  const { attempt } = await f.start();
  const answer = { questionId: f.questions[0].id, answer: 'Right' };
  await assert.rejects(f.service.submit(attempt.id, f.studentId, [answer, answer]), /only be answered once/);
  await assert.rejects(f.service.submit(attempt.id, f.studentId, [{ ...answer, questionId: new Types.ObjectId().toString() }]), /does not belong/);
  assert.equal(f.reviewCount(), 0);
  assert.equal(f.completionCount(), 0);
  assert.equal(f.records.get(attempt.id).submissionToken, undefined);
});

test('editing or removing source questions cannot change an active attempt', async () => {
  const f = fixture();
  const { attempt } = await f.start();
  const originalId = f.questions[0].id;
  f.questions[0].marks = 100;
  f.questions[0].answer = 'Wrong';
  f.questions.splice(1, 1);
  const result = await f.service.submit(attempt.id, f.studentId, [{ questionId: originalId, answer: 'Right' }]);
  assert.equal(result.attempt.score, 2);
  assert.equal(result.attempt.totalMarks, 10);
  assert.equal(result.questions.length, 2);
  assert.equal(result.questions[0].answer, 'Right');
});

test('completed attempts reject resubmission and recover the original saved result', async () => {
  const f = fixture();
  const { attempt } = await f.start();
  const saved = await f.service.submit(attempt.id, f.studentId, []);
  await assert.rejects(f.service.submit(attempt.id, f.studentId, [{ questionId: f.questions[0].id, answer: 'Right' }]), /already been submitted/);
  assert.deepEqual(await f.service.result(attempt.id, f.studentId), saved);
  assert.equal(f.completionCount(), 1);
  assert.equal(f.reviewCount(), 1);
});

test('ownership checks protect both submission and completed result access', async () => {
  const f = fixture();
  const { attempt } = await f.start();
  const otherStudent = new Types.ObjectId().toString();
  await assert.rejects(f.service.result(attempt.id, f.studentId), /not available yet/);
  await assert.rejects(f.service.submit(attempt.id, otherStudent, []), /cannot submit/);
  await f.service.submit(attempt.id, f.studentId, []);
  await assert.rejects(f.service.result(attempt.id, otherStudent), /cannot submit/);
  await assert.rejects(f.service.result('invalid', f.studentId), /Invalid attempt ID/);
  await assert.rejects(f.service.result(new Types.ObjectId().toString(), f.studentId), /not found/);
});

test('concurrent submissions acquire only one grading claim', async () => {
  const f = fixture();
  const { attempt } = await f.start();
  let release;
  let started;
  const entered = new Promise((resolve) => { started = resolve; });
  f.marker.reviewCompletedTest = () => { started(); return new Promise((resolve) => { release = resolve; }); };
  const first = f.service.submit(attempt.id, f.studentId, []);
  await entered;
  await assert.rejects(f.service.submit(attempt.id, f.studentId, []), /already being submitted/);
  release('Saved feedback');
  await first;
  assert.equal(f.completionCount(), 1);
});

for (const failure of ['AI', 'database']) {
  test(`${failure} failure preserves an active attempt and allows a successful retry`, async () => {
    const f = fixture();
    const { attempt } = await f.start();
    if (failure === 'AI') f.marker.reviewCompletedTest = async () => { throw new Error('AI unavailable'); };
    else f.failCompletion(true);
    await assert.rejects(f.service.submit(attempt.id, f.studentId, []), /unavailable|write failed/);
    assert.equal(f.records.get(attempt.id).status, 'active');
    assert.equal(f.records.get(attempt.id).gradedAnswers, undefined);
    assert.equal(f.records.get(attempt.id).submissionToken, undefined);
    f.marker.reviewCompletedTest = async () => 'Recovered feedback';
    f.failCompletion(false);
    assert.equal((await f.service.submit(attempt.id, f.studentId, [])).attempt.status, 'completed');
  });
}

test('a crashed submission can retry after its lease expires', async () => {
  const f = fixture();
  const { attempt } = await f.start();
  const stored = f.records.get(attempt.id);
  stored.submissionToken = 'abandoned-worker';
  stored.submissionStartedAt = new Date(Date.now() - 11 * 60 * 1000);
  assert.equal((await f.service.submit(attempt.id, f.studentId, [])).attempt.status, 'completed');
});

test('legacy active attempts without a question snapshot fail safely', async () => {
  const f = fixture();
  const { attempt } = await f.start();
  delete f.records.get(attempt.id).questionSnapshots;
  await assert.rejects(f.service.submit(attempt.id, f.studentId, []), /start a new test/);
  assert.equal(f.completionCount(), 0);
});

test('attempt histories never expose question snapshots, marked answers or grading locks', async () => {
  const f = fixture();
  const { attempt } = await f.start();
  await f.service.submit(attempt.id, f.studentId, []);
  for (const list of [await f.service.myAttempts(f.studentId), await f.service.allAttempts()]) {
    assert.equal(JSON.stringify(list).includes('PRIVATE_'), false);
    for (const field of ['questionSnapshots', 'gradedAnswers', 'submissionToken', 'submissionStartedAt']) {
      assert.equal(Object.hasOwn(list[0], field), false);
    }
  }
});

test('empty and unpublished quizzes fail before creating an attempt', async () => {
  const f = fixture();
  await assert.rejects(f.service.start(f.studentId, new Types.ObjectId().toString()), /Published quiz was not found/);
  f.questions.length = 0;
  await assert.rejects(f.start(), /no questions/);
  assert.equal(f.records.size, 0);
});

test('attempt DTOs require a quiz ID and reject duplicate or malformed question IDs', async () => {
  const pipe = new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true });
  const body = (metatype) => ({ type: 'body', metatype });
  await assert.rejects(pipe.transform({}, body(StartAttemptDto)));
  await assert.rejects(pipe.transform({ quizId: 'invalid' }, body(StartAttemptDto)));
  const answer = { questionId: new Types.ObjectId().toString(), answer: '' };
  await pipe.transform({ answers: [answer] }, body(SubmitAttemptDto));
  await assert.rejects(pipe.transform({ answers: [answer, answer] }, body(SubmitAttemptDto)));
  await assert.rejects(pipe.transform({ answers: [{ ...answer, questionId: 'invalid' }] }, body(SubmitAttemptDto)));
  assert.deepEqual(Reflect.getMetadata('__guards__', AttemptsController).map((guard) => guard.name), ['JwtAuthGuard', 'RolesGuard']);
  assert.deepEqual(Reflect.getMetadata('roles', AttemptsController.prototype.result), ['student', 'admin']);
});
