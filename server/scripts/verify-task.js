import assert from 'node:assert';
import mongoose from 'mongoose';
import Project from '../src/models/Project.js';
import Task from '../src/models/Task.js';
import WorkspaceMember from '../src/models/WorkspaceMember.js';
import taskService from '../src/services/taskService.js';
import { validateCreateTask, validateUpdateTask } from '../src/validators/taskValidators.js';
import Activity from '../src/models/Activity.js';

Activity.create = async (document) => document;

const workspaceA = new mongoose.Types.ObjectId();
const workspaceB = new mongoose.Types.ObjectId();
const projectA = new mongoose.Types.ObjectId();
const projectB = new mongoose.Types.ObjectId();
const taskA = new mongoose.Types.ObjectId();
const memberA = new mongoose.Types.ObjectId();
const memberB = new mongoose.Types.ObjectId();
const queries = [];

Project.findOne = (query) => {
  queries.push({ model: 'Project', query });
  const exists = query._id?.toString() === projectA.toString() && query.workspaceId.toString() === workspaceA.toString();
  return Promise.resolve(exists ? { _id: projectA, workspaceId: workspaceA } : null);
};

const taskDocument = {
  _id: taskA,
  workspaceId: workspaceA,
  projectId: projectA,
  title: 'Task A',
  createdBy: memberA,
  assignee: null,
  save: async function () { return this; },
};
const taskQuery = (value) => ({
  populate: () => ({ populate: async () => value }),
});
Task.findOne = (query) => {
  queries.push({ model: 'Task', query });
  const exists = query._id?.toString() === taskA.toString() && query.workspaceId.toString() === workspaceA.toString() && query.projectId.toString() === projectA.toString();
  return taskQuery(exists ? taskDocument : null);
};
Task.find = (query) => {
  queries.push({ model: 'Task', query });
  return { sort: () => ({ populate: () => ({ populate: async () => query.workspaceId.toString() === workspaceA.toString() && query.projectId.toString() === projectA.toString() ? [taskDocument] : [] }) }) };
};
Task.create = async (document) => ({ ...document, _id: taskA });
Task.deleteOne = async (query) => {
  queries.push({ model: 'Task', query });
  return { deletedCount: query.workspaceId.toString() === workspaceA.toString() && query.projectId.toString() === projectA.toString() && query._id.toString() === taskA.toString() ? 1 : 0 };
};
WorkspaceMember.findOne = (query) => {
  queries.push({ model: 'WorkspaceMember', query });
  return Promise.resolve(query.workspaceId.toString() === workspaceA.toString() && query.userId.toString() === memberA.toString() ? { workspaceId: workspaceA, userId: memberA } : null);
};

const tests = [];
const test = async (name, fn) => {
  try { await fn(); tests.push([name, true]); } catch (error) { tests.push([name, false, error]); }
};

await test('task model has required hierarchy and query indexes', () => {
  const indexes = Task.schema.indexes();
  assert.ok(Task.schema.path('workspaceId').options.required);
  assert.ok(Task.schema.path('projectId').options.required);
  assert.ok(indexes.some(([fields]) => fields.projectId === 1 && fields.createdAt === -1));
  assert.ok(indexes.some(([fields]) => fields.workspaceId === 1 && fields.assignee === 1));
  assert.ok(indexes.some(([fields]) => fields.projectId === 1 && fields.status === 1));
});

await test('cross-workspace project cannot create a task', async () => {
  await assert.rejects(() => taskService.createTask({ workspaceId: workspaceB, projectId: projectA, title: 'Blocked', userId: memberB }), (error) => error.statusCode === 404);
});

await test('cross-project and cross-workspace task reads are blocked', async () => {
  await assert.rejects(() => taskService.getTaskById(workspaceA, projectB, taskA), (error) => error.statusCode === 404);
  await assert.rejects(() => taskService.getTaskById(workspaceB, projectA, taskA), (error) => error.statusCode === 404);
  assert.deepStrictEqual(queries.at(-1).query, { _id: projectA, workspaceId: workspaceB });
});

await test('cross-workspace assignee is rejected', async () => {
  await assert.rejects(() => taskService.createTask({ workspaceId: workspaceA, projectId: projectA, title: 'Blocked assignment', assignee: memberB, userId: memberA }), (error) => error.statusCode === 400);
});

await test('workspace member can create and update permitted task fields', async () => {
  const created = await taskService.createTask({ workspaceId: workspaceA, projectId: projectA, title: 'Valid task', status: 'TODO', priority: 'HIGH', userId: memberA });
  assert.strictEqual(created.workspaceId, workspaceA);
  const updated = await taskService.updateTask(workspaceA, projectA, taskA, { title: 'Updated', priority: 'URGENT' });
  assert.strictEqual(updated.title, 'Updated');
});

await test('validator rejects protected fields, invalid enums, and member assignment changes', () => {
  let error;
  validateCreateTask({ body: { title: 'Task', workspaceId: workspaceB, projectId: projectB, createdBy: memberB, status: 'INVALID' } }, {}, (nextError) => { error = nextError; });
  assert.strictEqual(error.statusCode, 400);
  validateUpdateTask({ body: { assignee: memberA }, workspaceMembership: { role: 'MEMBER' } }, {}, (nextError) => { error = nextError; });
  assert.strictEqual(error.statusCode, 403);
});

const failed = tests.filter(([, passed]) => !passed);
for (const [name, passed, error] of tests) console.log(`  ${passed ? '✅ PASS' : '❌ FAIL'}: ${name}${error ? ` (${error.message})` : ''}`);
console.log(`\nTASK SUMMARY: ${tests.length - failed.length} passed, ${failed.length} failed`);
if (failed.length) process.exitCode = 1;
