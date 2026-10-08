import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { ContentService } = require('../dist/content/content.service.js');
const { Types } = require('mongoose');
const { ContentController } = require('../dist/content/content.controller.js');
const { JwtAuthGuard } = require('../dist/auth/jwt-auth.guard.js');
const { RolesGuard } = require('../dist/common/roles.guard.js');

function fixture() {
  const subtopic = { _id: new Types.ObjectId(), title: 'Subtopic', quizzes: [] };
  const topic = { _id: new Types.ObjectId(), title: 'Topic', subtopics: [subtopic] };
  const first = { _id: new Types.ObjectId(), title: 'First', topics: [topic] };
  const second = { _id: new Types.ObjectId(), title: 'Second', topics: [] };
  let saves = 0;
  const course = {
    id: new Types.ObjectId().toString(), modules: [first, second],
    createdBy: new Types.ObjectId(), createdAt: new Date(),
    markModified() {}, async save() { saves++; },
  };
  const service = new ContentService({ findById: () => ({ exec: async () => course }) });
  return { service, course, first, second, topic, subtopic, saves: () => saves };
}

for (const level of ['module', 'topic', 'subtopic']) {
  test(`editing a ${level} preserves its children and clears its description`, async () => {
    const f = fixture();
    const input = { moduleId: f.first._id.toString(), title: ' Updated ', description: '' };
    if (level !== 'module') input.topicId = f.topic._id.toString();
    if (level === 'subtopic') input.subtopicId = f.subtopic._id.toString();
    const item = level === 'module' ? f.first : level === 'topic' ? f.topic : f.subtopic;
    item.description = 'Old description';
    await f.service.editStructure(f.course.id, input);
    assert.equal(item.title, 'Updated');
    assert.equal(item.description, undefined);
    assert.equal(f.first.topics[0], f.topic);
    assert.equal(f.topic.subtopics[0], f.subtopic);
    assert.equal(f.saves(), 1);
  });
}

test('reordering persists modules with their descendants', async () => {
  const f = fixture();
  const result = await f.service.reorderModules(f.course.id, [f.second._id.toString(), f.first._id.toString()]);
  assert.deepEqual(result.modules.map((item) => item.title), ['Second', 'First']);
  assert.equal(f.course.modules[1].topics[0].subtopics[0], f.subtopic);
  assert.equal(f.saves(), 1);
});

test('invalid, missing, duplicate and stale module orders are rejected without saving', async () => {
  const f = fixture();
  const first = f.first._id.toString();
  for (const ids of [[], [first], [first, first], [first, new Types.ObjectId().toString()]]) {
    await assert.rejects(f.service.reorderModules(f.course.id, ids), /every module exactly once/);
  }
  assert.equal(f.saves(), 0);
});

test('blank titles and subtopics outside the selected topic are rejected', async () => {
  const f = fixture();
  await assert.rejects(f.service.editStructure(f.course.id, { moduleId: f.first._id.toString(), title: '  ' }), /Enter a title/);
  await assert.rejects(f.service.editStructure(f.course.id, {
    moduleId: f.first._id.toString(), topicId: f.topic._id.toString(),
    subtopicId: new Types.ObjectId().toString(), title: 'Updated',
  }), /Subtopic was not found/);
  assert.equal(f.saves(), 0);
});

function quiz(title = 'Quiz') {
  return { _id: new Types.ObjectId(), title, timeLimitMinutes: 10, attemptsAllowed: 1, passingPercent: 50 };
}

test('deleting a topic removes its descendants and preserves sibling topics and modules', async () => {
  const f = fixture();
  f.subtopic.quizzes.push(quiz());
  f.topic.quizzes = [quiz('Legacy quiz')];
  const sibling = { _id: new Types.ObjectId(), title: 'Other topic', subtopics: [] };
  f.first.topics.push(sibling);
  const result = await f.service.deleteStructure(f.course.id, {
    kind: 'topic', moduleId: f.first._id.toString(), topicId: f.topic._id.toString(),
  });
  assert.deepEqual(result.modules[0].topics.map((item) => item.id), [sibling._id.toString()]);
  assert.equal(f.course.modules[1], f.second);
  assert.equal(f.saves(), 1);
});

test('deleting a subtopic removes its quizzes and preserves the parent and sibling subtopics', async () => {
  const f = fixture();
  f.subtopic.quizzes.push(quiz());
  const sibling = { _id: new Types.ObjectId(), title: 'Other subtopic', quizzes: [quiz('Other quiz')] };
  f.topic.subtopics.push(sibling);
  const result = await f.service.deleteStructure(f.course.id, {
    kind: 'subtopic', moduleId: f.first._id.toString(), topicId: f.topic._id.toString(), subtopicId: f.subtopic._id.toString(),
  });
  assert.equal(f.first.topics[0], f.topic);
  assert.deepEqual(result.modules[0].topics[0].subtopics.map((item) => item.id), [sibling._id.toString()]);
  assert.equal(result.modules[0].topics[0].subtopics[0].quizzes.length, 1);
  assert.equal(f.saves(), 1);
});

test('deleting a quiz preserves its subtopic and the other quizzes', async () => {
  const f = fixture();
  const target = quiz();
  const sibling = quiz('Other quiz');
  f.subtopic.quizzes.push(target, sibling);
  const result = await f.service.deleteStructure(f.course.id, {
    kind: 'quiz', moduleId: f.first._id.toString(), topicId: f.topic._id.toString(),
    subtopicId: f.subtopic._id.toString(), quizId: target._id.toString(),
  });
  assert.equal(f.topic.subtopics[0], f.subtopic);
  assert.deepEqual(result.modules[0].topics[0].subtopics[0].quizzes.map((item) => item.id), [sibling._id.toString()]);
  assert.equal(f.saves(), 1);
});

for (const kind of ['subtopic', 'quiz']) {
  test(`deleting a legacy ${kind} preserves the topic and its real subtopics`, async () => {
    const f = fixture();
    const target = quiz('Legacy quiz');
    const sibling = quiz('Other legacy quiz');
    f.topic.quizzes = [target, sibling];
    const result = await f.service.deleteStructure(f.course.id, {
      kind, moduleId: f.first._id.toString(), topicId: f.topic._id.toString(),
      subtopicId: f.topic._id.toString(), ...(kind === 'quiz' ? { quizId: target._id.toString() } : {}),
    });
    assert.equal(f.first.topics[0], f.topic);
    assert.equal(f.topic.subtopics[0], f.subtopic);
    assert.deepEqual(f.topic.quizzes.map((item) => item.title), kind === 'quiz' ? ['Other legacy quiz'] : []);
    assert.equal(result.modules[0].topics[0].subtopics.length, kind === 'quiz' ? 2 : 1);
    assert.equal(f.saves(), 1);
  });
}

test('deletion rejects invalid IDs and missing or mismatched ancestors without saving', async () => {
  const f = fixture();
  const target = quiz();
  f.subtopic.quizzes.push(target);
  const input = { kind: 'quiz', moduleId: f.first._id.toString(), topicId: f.topic._id.toString(),
    subtopicId: f.subtopic._id.toString(), quizId: target._id.toString() };
  await assert.rejects(f.service.deleteStructure('invalid', input), /Invalid course structure ID/);
  for (const field of ['moduleId', 'topicId', 'subtopicId', 'quizId']) {
    await assert.rejects(f.service.deleteStructure(f.course.id, { ...input, [field]: 'invalid' }), /Invalid course structure ID/);
    await assert.rejects(f.service.deleteStructure(f.course.id, { ...input, [field]: new Types.ObjectId().toString() }), /was not found/);
  }
  await assert.rejects(f.service.deleteStructure(f.course.id, { ...input, moduleId: f.second._id.toString() }), /Topic was not found/);
  assert.equal(f.subtopic.quizzes[0], target);
  assert.equal(f.saves(), 0);
});

test('deletion rejects a missing course and propagates save failures', async () => {
  const f = fixture();
  const input = { kind: 'topic', moduleId: f.first._id.toString(), topicId: f.topic._id.toString() };
  const missing = new ContentService({ findById: () => ({ exec: async () => null }) });
  await assert.rejects(missing.deleteStructure(f.course.id, input), /Course was not found/);
  f.course.save = async () => { throw new Error('Database unavailable'); };
  await assert.rejects(f.service.deleteStructure(f.course.id, input), /Database unavailable/);
});

test('all structure deletion endpoints require authentication and an admin role', () => {
  for (const method of ['deleteTopic', 'deleteSubtopic', 'deleteQuiz']) {
    const handler = ContentController.prototype[method];
    assert.deepEqual(Reflect.getMetadata('roles', handler), ['admin']);
    assert.deepEqual(Reflect.getMetadata('__guards__', handler), [JwtAuthGuard, RolesGuard]);
  }
});
