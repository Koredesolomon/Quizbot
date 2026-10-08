import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Types } = require('mongoose');
const { ValidationPipe } = require('@nestjs/common');
const { Reflector } = require('@nestjs/core');
const { QuestionsService } = require('../dist/questions/questions.service.js');
const { QuestionsController } = require('../dist/questions/questions.controller.js');
const { UpdateQuestionDto } = require('../dist/questions/dto.js');
const { RolesGuard } = require('../dist/common/roles.guard.js');

const adminId = new Types.ObjectId().toString();
const linkedQuestion = () => ({
  type: 'objective', subject: 'Physics', topic: 'Units', prompt: 'Which unit measures mass?',
  options: ['Newton', 'Kilogram'], answer: 'Kilogram', explanation: 'Mass is measured in kilograms.',
  marks: 2, difficulty: 'easy', courseId: 'course', moduleId: 'module', subtopicId: 'subtopic', quizId: 'quiz',
  imageUrl: 'https://example.invalid/diagram.png', rubricPoints: ['Identifies mass'], keywords: [],
});

function fixture() {
  const records = new Map();
  let saves = 0;
  const model = {
    find() { return { sort: () => ({ exec: async () => Array.from(records.values()) }) }; },
    async create(input) {
      const id = new Types.ObjectId().toString();
      const record = {
        ...input, id, createdAt: new Date(),
        toObject() { return { ...this }; },
        set(patch) { Object.assign(this, patch); },
        async save() { saves++; return this; },
      };
      records.set(id, record);
      return record;
    },
    findById(id) { return { exec: async () => records.get(id) }; },
  };
  return { service: new QuestionsService(model), records, saves: () => saves };
}

test('editing an imported question updates the existing record and preserves quiz links and creator', async () => {
  const f = fixture();
  const [imported] = await f.service.import([linkedQuestion()], adminId);
  const edited = await f.service.update(imported.id, { prompt: 'Choose the SI unit for mass.', marks: 3 });
  assert.equal(edited.id, imported.id);
  assert.equal(edited.prompt, 'Choose the SI unit for mass.');
  assert.equal(edited.marks, 3);
  for (const key of ['courseId', 'moduleId', 'subtopicId', 'quizId', 'createdBy', 'createdAt']) {
    assert.equal(edited[key], imported[key]);
  }
  assert.equal(f.records.size, 1);
  assert.equal(f.saves(), 1);
});

test('manual questions support letter answers and theory grading metadata', async () => {
  const f = fixture();
  const mcq = await f.service.create({ ...linkedQuestion(), answer: 'B' }, adminId);
  assert.equal(mcq.answer, 'B');
  const theory = await f.service.create({ ...linkedQuestion(), type: 'theory', options: undefined,
    answer: 'Mass measures the amount of matter.', rubricPoints: ['Mentions matter'], keywords: ['matter'] }, adminId);
  assert.deepEqual(theory.rubricPoints, ['Mentions matter']);
  assert.deepEqual(theory.keywords, ['matter']);
});

test('editing clears removed images and rubric fields and handles type changes', async () => {
  const f = fixture();
  const created = await f.service.create(linkedQuestion(), adminId);
  const theory = await f.service.update(created.id, { type: 'theory', answer: 'An amount of matter.',
    imageUrl: '', rubricPoints: [], keywords: ['matter'] });
  assert.equal(theory.imageUrl, '');
  assert.deepEqual(theory.rubricPoints, []);
  assert.equal(theory.options, undefined);
  assert.deepEqual(theory.keywords, ['matter']);
  const objective = await f.service.update(created.id, { type: 'objective', options: ['Mass', 'Force'], answer: 'Mass' });
  assert.equal(objective.keywords, undefined);
  assert.deepEqual(objective.options, ['Mass', 'Force']);
  assert.equal(objective.quizId, 'quiz');
});

test('partial edits validate the merged question and reject invalid choices without saving', async () => {
  const f = fixture();
  const question = await f.service.create(linkedQuestion(), adminId);
  for (const patch of [{ options: ['Metre', 'Second'] }, { options: ['Kilogram', ' '] },
    { answer: 'C' }, { prompt: '  ' }, { marks: 1.5 }, { type: null }, { answer: null }]) {
    await assert.rejects(f.service.update(question.id, patch));
  }
  assert.equal(f.saves(), 0);
  assert.equal(f.records.get(question.id).prompt, linkedQuestion().prompt);
});

test('invalid or missing question IDs produce useful errors', async () => {
  const f = fixture();
  await assert.rejects(f.service.update('invalid-id', { prompt: 'Updated' }), /Invalid question ID/);
  await assert.rejects(f.service.update(new Types.ObjectId().toString(), { prompt: 'Updated' }), /Question not found/);
});

test('invalid bulk rows are rejected before any questions are inserted', async () => {
  const f = fixture();
  await assert.rejects(f.service.import([linkedQuestion(), { ...linkedQuestion(), answer: 'Not an option' }], adminId), /correct answer/);
  assert.equal(f.records.size, 0);
});

test('update DTO supports partial edits and rejects unknown fields and invalid marks', async () => {
  const pipe = new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true });
  const metadata = { type: 'body', metatype: UpdateQuestionDto };
  const patch = await pipe.transform({ prompt: 'Updated prompt' }, metadata);
  assert.equal(patch.prompt, 'Updated prompt');
  const f = fixture();
  const question = await f.service.create(linkedQuestion(), adminId);
  const updated = await f.service.update(question.id, patch);
  assert.equal(updated.answer, question.answer);
  assert.equal(updated.quizId, question.quizId);
  assert.equal(updated.marks, question.marks);
  await assert.rejects(pipe.transform({ marks: 0 }, metadata));
  await assert.rejects(pipe.transform({ createdBy: adminId }, metadata));
});

test('question updates require authentication and an admin role', () => {
  const handler = QuestionsController.prototype.update;
  const guards = Reflect.getMetadata('__guards__', handler);
  assert.deepEqual(guards.map((guard) => guard.name), ['JwtAuthGuard', 'RolesGuard']);
  const roles = new RolesGuard(new Reflector());
  const context = (role) => ({ getHandler: () => handler, getClass: () => QuestionsController,
    switchToHttp: () => ({ getRequest: () => role ? { user: { role } } : {} }) });
  assert.equal(roles.canActivate(context('admin')), true);
  assert.equal(roles.canActivate(context('student')), false);
  assert.equal(roles.canActivate(context()), false);
});

test('public question lists omit answer keys, explanations and private grading metadata', async () => {
  const f = fixture();
  await f.service.create({ ...linkedQuestion(), rubricPoints: ['PRIVATE_RUBRIC'],
    commonMistakes: ['PRIVATE_MISTAKE'], keywords: ['PRIVATE_KEYWORD'], learningObjective: 'Identify SI units' }, adminId);
  const [prompt] = await f.service.list();
  for (const field of ['answer', 'explanation', 'rubricPoints', 'commonMistakes', 'keywords', 'createdBy']) {
    assert.equal(Object.hasOwn(prompt, field), false, field);
  }
  assert.equal(prompt.prompt, linkedQuestion().prompt);
  assert.deepEqual(prompt.options, linkedQuestion().options);
  assert.equal(prompt.marks, 2);
  const [privateQuestion] = await f.service.listForAdmin();
  assert.equal(privateQuestion.answer, 'Kilogram');
  assert.deepEqual(privateQuestion.rubricPoints, ['PRIVATE_RUBRIC']);
});

test('answer-bearing question lists are available only to authenticated admins', () => {
  const handler = QuestionsController.prototype.listForAdmin;
  assert.deepEqual(Reflect.getMetadata('__guards__', handler).map((guard) => guard.name), ['JwtAuthGuard', 'RolesGuard']);
  const roles = new RolesGuard(new Reflector());
  const context = (role) => ({ getHandler: () => handler, getClass: () => QuestionsController,
    switchToHttp: () => ({ getRequest: () => role ? { user: { role } } : {} }) });
  assert.equal(roles.canActivate(context('admin')), true);
  assert.equal(roles.canActivate(context('student')), false);
  assert.equal(roles.canActivate(context()), false);
});
