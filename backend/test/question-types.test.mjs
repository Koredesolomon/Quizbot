import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const mongoose = require('mongoose');
const { AttemptsService } = require('../dist/attempts/attempts.service.js');
const { AttemptSchema } = require('../dist/attempts/attempt.schema.js');
const { QuestionSchema } = require('../dist/questions/question.schema.js');
const { QuestionsService } = require('../dist/questions/questions.service.js');
const { questionImageExtension } = require('../dist/questions/question-images.controller.js');
const { Types } = mongoose;
const AttemptModel = mongoose.model('QuestionTypeAttemptFixture', AttemptSchema);
const QuestionModel = mongoose.model('QuestionTypeQuestionFixture', QuestionSchema);

// Submits one attempt containing a single question and returns its marked answer.
async function mark(question, answer, reviewer) {
  const quizId = new Types.ObjectId().toString();
  const studentId = new Types.ObjectId().toString();
  const stored = new QuestionModel({ topic: 'Vectors', prompt: 'Pick', marks: 4, quizId, createdBy: new Types.ObjectId(), createdAt: new Date(), ...question });
  await stored.validate();
  const records = new Map();
  const query = (run) => ({ select() { return this; }, exec: run });
  const model = {
    async create(input) { const doc = new AttemptModel({ ...input, createdAt: new Date() }); records.set(doc.id, doc.toObject()); return doc; },
    findById(id) { return query(async () => new AttemptModel(records.get(id))); },
    findOneAndUpdate(filter, changes) { return query(async () => {
      const record = records.get(filter._id.toString());
      Object.assign(record, changes.$set);
      return new AttemptModel(record);
    }); },
    updateOne() { return query(async () => undefined); },
  };
  const questions = new QuestionsService({ find: () => ({ sort: () => ({ exec: async () => [stored] }) }) });
  const marker = {
    async reviewTheoryAnswer(reviewQuestion, response, fallback) { return reviewer ? reviewer(reviewQuestion, response, fallback) : fallback; },
    async reviewCompletedTest() { return 'Summary'; },
  };
  const service = new AttemptsService(model, questions, marker, { async findPublishedQuiz() { return { courseId: 'course', quizId }; } });
  const started = await service.start(studentId, quizId);
  const result = await service.submit(started.attempt.id, studentId, [{ questionId: stored.id, answer }]);
  return result.answers[0];
}

const mcq = { type: 'multiple', options: ['Speed', 'Velocity', 'Force', 'Mass'], answer: 'B, C' };

test('MCQ (multiple answers) questions award full marks only for exactly the correct options', async () => {
  assert.deepEqual(await mark(mcq, 'B, C').then(({ awarded, correct }) => ({ awarded, correct })), { awarded: 4, correct: true });
  assert.deepEqual(await mark(mcq, 'C,B').then(({ awarded, correct }) => ({ awarded, correct })), { awarded: 4, correct: true });
});

test('MCQ partial credit subtracts wrong picks so ticking every option earns nothing', async () => {
  const half = await mark(mcq, 'B');
  assert.equal(half.awarded, 2);
  assert.equal(half.correct, false);
  assert.match(half.aiFeedback, /1 of 2 correct options/);
  assert.equal((await mark(mcq, 'A, B, C, D')).awarded, 0);
  assert.equal((await mark(mcq, 'A, B, C')).awarded, 2);
  assert.equal((await mark(mcq, 'A')).awarded, 0);
});

test('question validation accepts the three question types and checks answer keys against options', () => {
  const service = new QuestionsService({});
  const base = { topic: 'Units', prompt: 'Pick', marks: 1, options: ['Metre', 'Newton', 'Kelvin'] };
  service.validateQuestion({ ...base, type: 'multiple', answer: 'A, C' });
  service.validateQuestion({ ...base, type: 'objective', answer: 'Newton' });
  service.validateQuestion({ ...base, type: 'theory', options: undefined, answer: 'A model answer' });
  service.validateQuestion({ ...base, type: 'objective', answer: 'B' }); // explanation is optional
  assert.throws(() => service.validateQuestion({ ...base, type: 'multiple', answer: 'A, D' }), /correct answers/);
  assert.throws(() => service.validateQuestion({ ...base, type: 'objective', answer: 'Joule' }), /correct answer/);
  assert.throws(() => service.validateQuestion({ ...base, type: 'essay', answer: 'x' }), /valid question type/);
});

test('question images are identified by their bytes, never by the claimed file type', () => {
  assert.equal(questionImageExtension(Buffer.from('89504e470d0a1a0a0000', 'hex')), '.png');
  assert.equal(questionImageExtension(Buffer.from('ffd8ffe000', 'hex')), '.jpg');
  assert.equal(questionImageExtension(Buffer.from('<svg onload="alert(1)"/>')), undefined);
  assert.equal(questionImageExtension(Buffer.from('<html>')), undefined);
});

const explained = (choice, explanation) => `${choice}\n\n--- Explanation ---\n${explanation}`;
const precise = {
  type: 'objective', options: ['3 cm', '2.6 cm', '2.67 cm', '2.671 cm'], answer: '2.671 cm', answerBox: true, marks: 4,
  explanation: 'It has the greatest number of decimal places, so it is the most detailed measurement.',
};

test('option-plus-explanation questions split marks: half for the option, the rest for the AI-marked explanation', async () => {
  let seen;
  const full = await mark(precise, explained('2.671 cm', 'It has the most decimal places.'), (question, response) => {
    seen = { marks: question.marks, answer: question.answer, response };
    return { awarded: 2, correct: true, aiFeedback: 'Clear reasoning.' };
  });
  assert.deepEqual({ awarded: full.awarded, correct: full.correct }, { awarded: 4, correct: true });
  assert.equal(seen.marks, 2);
  assert.match(seen.answer, /^Correct option: D\. 2\.671 cm\. It has the greatest/);
  assert.equal(seen.response, 'It has the most decimal places.');
  assert.match(full.aiFeedback, /Option: Correct response\. Explanation \(2\/2 marks\): Clear reasoning\./);

  const weak = await mark(precise, explained('2.671 cm', 'Because.'), () => ({ awarded: 0, correct: false, aiFeedback: 'Give a reason.' }));
  assert.deepEqual({ awarded: weak.awarded, correct: weak.correct }, { awarded: 2, correct: false });

  const noOption = await mark(precise, explained('', 'It has the most decimal places.'), () => ({ awarded: 2, correct: true, aiFeedback: 'Good.' }));
  assert.equal(noOption.awarded, 2);
  assert.match(noOption.aiFeedback, /No option was chosen/);
});

test('1-mark option-plus-explanation questions are decided by the option; the explanation gets feedback only', async () => {
  const oneMark = { ...precise, marks: 1 };
  const result = await mark(oneMark, explained('2.671 cm', 'Most decimal places.'), () => ({ awarded: 1, correct: true, aiFeedback: 'Good reasoning.' }));
  assert.deepEqual({ awarded: result.awarded, correct: result.correct }, { awarded: 1, correct: true });
  assert.match(result.aiFeedback, /Explanation: Good reasoning\./);
  const silent = await mark(oneMark, '2.671 cm');
  assert.equal(silent.awarded, 1);
  assert.match(silent.aiFeedback, /No explanation was written/);
});

test('without AI, explanations are marked against keywords from the model explanation', async () => {
  const result = await mark(precise, explained('2.671 cm', 'It has the greatest number of decimal places so it is the most detailed measurement.'));
  assert.equal(result.awarded, 4);
});

test('students are told which choice questions need an explanation box', () => {
  const service = new QuestionsService({});
  const doc = (extra) => new QuestionModel({ topic: 'T', prompt: 'P', answer: 'A', marks: 1, createdBy: new Types.ObjectId(), ...extra });
  assert.equal(service.publicPrompt(doc({ type: 'objective', options: ['A', 'B'], answerBox: true })).answerBox, true);
  assert.equal(service.publicPrompt(doc({ type: 'theory', answerBox: true })).answerBox, undefined);
  assert.equal(service.publicPrompt(doc({ type: 'objective', options: ['A', 'B'] })).answerBox, undefined);
});
