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
const { ValidationPipe } = require('@nestjs/common');
const { CreateQuestionDto } = require('../dist/questions/dto.js');
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
    async explainVerdict(_question, _response, _correct, fallback) { return { aiFeedback: fallback, source: 'auto' }; },
    async reviewCompletedTest() { return { text: 'Summary', source: 'auto' }; },
  };
  const service = new AttemptsService(model, questions, marker, { async findPublishedQuiz() { return { courseId: 'course', quizId }; } });
  const started = await service.start(studentId, quizId);
  const result = await service.submit(started.attempt.id, studentId, [{ questionId: stored.id, answer }]);
  if (question.parts) {
    const recovered = await service.result(started.attempt.id, studentId);
    assert.deepEqual(recovered.answers, result.answers, 'part marks and feedback must survive result recovery');
  }
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

const grid = { corner: '⊗', columns: ['0', '1', '2'], rows: ['0', '1', '2'], solution: [['0', '0', '0'], ['0', '1', '2'], ['0', '2', '1']] };
const studentTable = (cells, written = '') => {
  const markdown = ['| ⊗ | 0 | 1 | 2 |', '| --- | --- | --- | --- |', ...grid.rows.map((row, index) => `| ${row} | ${cells[index].join(' | ')} |`)].join('\n');
  return written ? `${markdown}\n\n--- Written answer ---\n${written}` : markdown;
};
const tableQuestion = (answerTable = grid, marks = 4) => ({ type: 'theory', answer: 'Complete the table.', marks, answerTable });
const neverAi = () => { throw new Error('The AI must not be used to mark table cells.'); };

test('a table with correct cells is marked cell by cell by code, without the AI', async () => {
  const all = await mark(tableQuestion(), studentTable(grid.solution), neverAi);
  assert.deepEqual({ awarded: all.awarded, correct: all.correct, source: all.feedbackSource }, { awarded: 4, correct: true, source: 'auto' });
  assert.match(all.aiFeedback, /9 of 9 cells correct/);

  const one = await mark(tableQuestion(), studentTable([['0', '0', '0'], ['0', '1', '2'], ['0', '2', '2']]), neverAi);
  assert.equal(one.awarded, 3); // 8 of 9 cells: never rounded up to full marks
  assert.match(one.aiFeedback, /8 of 9 cells correct/);
  assert.match(one.aiFeedback, /2 \/ 2: expected 1, you wrote 2/);

  const none = await mark(tableQuestion(), studentTable([['1', '1', '1'], ['1', '2', '0'], ['1', '0', '0']]), neverAi);
  assert.equal(none.awarded, 0);
  assert.equal(none.correct, false);
});

test('table cells ignore case, spacing and number formatting, but a blank cell is wrong', async () => {
  const solution = [['A', '0.5'], ['1', 'x y']];
  const table = { columns: ['c1', 'c2'], rows: ['r1', 'r2'], solution };
  const answer = (cells) => ['| | c1 | c2 |', '| --- | --- | --- |', ...table.rows.map((row, index) => `| ${row} | ${cells[index].join(' | ')} |`)].join('\n');

  assert.equal((await mark(tableQuestion(table, 4), answer([['a', '.50'], ['1.0', ' X  y ']]), neverAi)).awarded, 4);
  const blank = await mark(tableQuestion(table, 4), answer([['a', ''], ['1', 'x y']]), neverAi);
  assert.equal(blank.awarded, 3);
  assert.match(blank.aiFeedback, /left blank/);
});

test('with marks set for the table, the rest go to the written answer, which the AI marks alone', async () => {
  const question = tableQuestion({ ...grid, tableMarks: 2 }, 4);
  const seen = [];
  const reviewer = async (reviewQuestion, response) => {
    seen.push({ marks: reviewQuestion.marks, hasTable: Boolean(reviewQuestion.answerTable), response });
    return { awarded: 2, correct: true, aiFeedback: 'Good explanation.', source: 'ai' };
  };

  const both = await mark(question, studentTable(grid.solution, 'The pattern repeats every three.'), reviewer);
  assert.equal(both.awarded, 4);
  assert.deepEqual(seen, [{ marks: 2, hasTable: false, response: 'The pattern repeats every three.' }]);
  assert.match(both.aiFeedback, /Table: 9 of 9 cells correct \(2\/2 marks\)/);
  assert.match(both.aiFeedback, /Written answer \(2\/2 marks\): Good explanation/);

  const tableOnly = await mark(question, studentTable(grid.solution), neverAi);
  assert.equal(tableOnly.awarded, 2);
  assert.match(tableOnly.aiFeedback, /none was written/);
});

test('a table question without correct cells is still marked by the AI', async () => {
  const noSolution = { columns: ['a'], rows: ['b'] };
  const reviewed = await mark(tableQuestion(noSolution, 2), '| | a |\n| --- | --- |\n| b | 7 |', async () => ({ awarded: 1, correct: false, aiFeedback: 'AI marked it.', source: 'ai' }));
  assert.equal(reviewed.awarded, 1);
  assert.equal(reviewed.aiFeedback, 'AI marked it.');
});

test('marks for the table cannot exceed the question marks', () => {
  const service = new QuestionsService({});
  const base = { type: 'theory', topic: 'T', prompt: 'P', answer: 'A', marks: 4 };
  service.validateQuestion({ ...base, answerTable: { ...grid, tableMarks: 4 } });
  service.validateQuestion({ ...base, answerTable: { ...grid, tableMarks: 1 } });
  assert.throws(() => service.validateQuestion({ ...base, answerTable: { ...grid, tableMarks: 5 } }), /marks for the table/);
});

const multipart = {
  type: 'theory', topic: 'Motion', prompt: 'A cyclist travels at a constant speed.', answer: '(a) 10\n(b) 5\n(c) Constant velocity', marks: 10,
  parts: [
    { label: 'a', prompt: 'Find the distance.', answer: '10', answerType: 'numeric', marks: 2 },
    { label: 'b', prompt: 'Find the time.', answer: '5', answerType: 'numeric', marks: 5 },
    { label: 'c', prompt: 'Describe the motion.', answer: 'Constant velocity', keywords: ['constant', 'velocity'], marks: 3 },
  ],
};
const partAnswers = (answers) => JSON.stringify({ kind: 'question-parts', answers });

test('each part earns its own unequal mark allocation, with no credit transferred between parts', async () => {
  const mixed = await mark(multipart, partAnswers({ a: '10', b: '9', c: 'Constant velocity' }));
  assert.equal(mixed.awarded, 5);
  assert.deepEqual(mixed.partResults.map((part) => [part.label, part.awarded, part.marks]), [['a', 2, 2], ['b', 0, 5], ['c', 3, 3]]);
  assert.deepEqual(mixed.partResults.map((part) => part.answer), ['10', '9', 'Constant velocity']);
  assert.match(mixed.aiFeedback, /\(b\) 0\/5 marks/);
  assert.equal((await mark(multipart, partAnswers({ a: '10', b: '5', c: 'Constant velocity' }))).awarded, 10);
});

test('blank parts get zero and feedback without being sent to the AI, including entirely unanswered questions', async () => {
  const onlyA = await mark(multipart, partAnswers({ a: '10' }), neverAi);
  assert.equal(onlyA.awarded, 2);
  assert.deepEqual(onlyA.partResults.map((part) => part.awarded), [2, 0, 0]);
  assert.match(onlyA.partResults[1].aiFeedback, /No response/);
  const empty = await mark(multipart, '', neverAi);
  assert.deepEqual(empty.partResults.map((part) => part.awarded), [0, 0, 0]);
});

test('AI grading sees only each part key, rubric and marks alongside the common context', async () => {
  const seen = [];
  const question = { ...multipart, keywords: ['PARENT_KEYWORD'], rubricPoints: ['PARENT_RUBRIC'], referenceSolution: 'PARENT_SOLUTION' };
  question.parts = [
    { label: 'a', prompt: 'Explain speed.', answer: 'Distance per time', marks: 2, rubricPoints: ['a rubric'] },
    { label: 'b', prompt: 'Explain velocity.', answer: 'Speed with direction', marks: 8, keywords: ['direction'] },
  ];
  const result = await mark(question, partAnswers({ a: 'First response', b: 'Second response' }), (part, response) => {
    seen.push({ answer: part.answer, marks: part.marks, keywords: part.keywords, rubricPoints: part.rubricPoints, referenceSolution: part.referenceSolution, response, prompt: part.prompt });
    return { awarded: part.marks === 2 ? 1 : 6, correct: false, aiFeedback: 'Individual feedback', source: 'ai' };
  });
  assert.equal(result.awarded, 7);
  assert.equal(seen.length, 2);
  assert.deepEqual(seen.map((part) => [part.answer, part.marks, part.response]), [['Distance per time', 2, 'First response'], ['Speed with direction', 8, 'Second response']]);
  assert.ok(seen.every((part) => part.referenceSolution === undefined && part.prompt.includes('A cyclist travels')));
  assert.deepEqual(seen[0].rubricPoints, ['a rubric']);
  assert.equal(seen[0].keywords, undefined);
  assert.deepEqual(seen[1].keywords, ['direction']);
  assert.equal(seen[1].rubricPoints, undefined);
});

test('malformed part answers and invented labels are rejected rather than graded as one answer', async () => {
  for (const response of ['10 5 Constant velocity', partAnswers({ a: '10', z: '5' }), partAnswers({ a: { awarded: 10 } }), '{"kind":"question-parts","answers":[]}']) {
    await assert.rejects(mark(multipart, response), /answer|Answer/);
  }
});

test('question part allocations are validated and their private grading fields never enter public prompts', async () => {
  const service = new QuestionsService({});
  service.validateQuestion(multipart);
  assert.throws(() => service.validateQuestion({ ...multipart, marks: 11 }), /sum of its part marks/);
  assert.throws(() => service.validateQuestion({ ...multipart, type: 'objective' }), /Only theory/);
  assert.throws(() => service.validateQuestion({ ...multipart, parts: [multipart.parts[0]] }), /between 2 and 12/);
  assert.throws(() => service.validateQuestion({ ...multipart, parts: multipart.parts.map((part) => ({ ...part, marks: 1.5 })) }), /positive whole/);
  assert.throws(() => service.validateQuestion({ ...multipart, parts: multipart.parts.map((part) => ({ ...part, label: 'a' })) }), /Label question parts/);
  const stored = new QuestionModel({ ...multipart, createdBy: new Types.ObjectId(), createdAt: new Date() });
  const publicQuestion = service.publicPrompt(stored);
  assert.deepEqual(publicQuestion.parts.map((part) => Object.keys(part).filter((key) => part[key] !== undefined)), [['label', 'prompt', 'marks'], ['label', 'prompt', 'marks'], ['label', 'prompt', 'marks']]);
  assert.equal(service.publicQuestion(stored).parts[1].answer, '5');
  const pipe = new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true });
  const validate = (input) => pipe.transform(input, { type: 'body', metatype: CreateQuestionDto });
  assert.equal((await validate(multipart)).parts[1].marks, 5);
  await assert.rejects(validate({ ...multipart, parts: [{ ...multipart.parts[0], awarded: 99 }] }));
  await assert.rejects(validate({ ...multipart, parts: [{ ...multipart.parts[0], marks: -1 }] }));
});
