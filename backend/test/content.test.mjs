import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { ContentService } = require('../dist/content/content.service.js');
const { Types } = require('mongoose');

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
