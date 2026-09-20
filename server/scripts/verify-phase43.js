import assert from 'node:assert';
import mongoose from 'mongoose';
import Comment from '../src/models/Comment.js';
import Activity from '../src/models/Activity.js';
import Task from '../src/models/Task.js';
import commentService from '../src/services/commentService.js';
import activityService from '../src/services/activityService.js';

const workspaceA = new mongoose.Types.ObjectId();
const workspaceB = new mongoose.Types.ObjectId();
const taskA = new mongoose.Types.ObjectId();
const taskB = new mongoose.Types.ObjectId();
const projectA = new mongoose.Types.ObjectId();
const author = new mongoose.Types.ObjectId();
const otherUser = new mongoose.Types.ObjectId();
const comments = new Map();
const activities = [];
const task = { _id: taskA, workspaceId: workspaceA, projectId: projectA };
const populate = (value) => ({ populate: async () => value });

Task.findOne = (query) => Promise.resolve(query._id.toString() === taskA.toString() && query.workspaceId.toString() === workspaceA.toString() ? task : null);
Comment.create = async (document) => { const value = { ...document, _id: new mongoose.Types.ObjectId(), userId: document.userId, save: async function () { return this; } }; comments.set(value._id.toString(), value); return value; };
Comment.findById = (id) => populate(comments.get(id.toString()));
Comment.findOne = (query) => populate([...comments.values()].find((item) => String(item._id) === String(query._id) && String(item.workspaceId) === String(query.workspaceId) && String(item.taskId) === String(query.taskId)) || null);
Comment.find = (query) => ({ populate: () => ({ sort: async () => [...comments.values()].filter((item) => item.workspaceId.toString() === query.workspaceId.toString() && item.taskId.toString() === query.taskId) }) });
Comment.deleteOne = async (query) => { const exists = comments.has(query._id.toString()); if (exists) comments.delete(query._id.toString()); return { deletedCount: exists ? 1 : 0 }; };
Activity.create = async (document) => { const value = { ...document, _id: new mongoose.Types.ObjectId() }; activities.push(value); return value; };
Activity.find = (query) => ({ populate: () => ({ sort: () => ({ skip: () => ({ limit: async () => activities.filter((item) => item.workspaceId.toString() === query.workspaceId.toString()) }) }) }) });
Activity.countDocuments = async (query) => activities.filter((item) => item.workspaceId.toString() === query.workspaceId.toString()).length;

const tests = [];
const test = async (name, fn) => { try { await fn(); tests.push([name, true]); } catch (error) { tests.push([name, false, error]); } };

await test('comment model has workspace, task, user indexes and content limits', () => {
  assert.ok(Comment.schema.path('workspaceId').options.required);
  assert.ok(Comment.schema.path('taskId').options.required);
  assert.ok(Comment.schema.path('userId').options.required);
  assert.strictEqual(Comment.schema.path('content').options.maxlength, 2000);
});

await test('comment creation is hierarchy-scoped and creates activity', async () => {
  const comment = await commentService.createComment({ workspaceId: workspaceA, taskId: taskA, content: 'Hello', userId: author });
  assert.strictEqual(comment.content, 'Hello');
  assert.strictEqual(activities.at(-1).action, 'COMMENT_CREATED');
  await assert.rejects(() => commentService.createComment({ workspaceId: workspaceB, taskId: taskA, content: 'Blocked', userId: otherUser }), (error) => error.statusCode === 404);
});

await test('cross-task comment access is blocked', async () => {
  const comment = [...comments.values()][0];
  await assert.rejects(() => commentService.updateComment({ workspaceId: workspaceA, taskId: taskB, commentId: comment._id, content: 'Blocked', actorId: author, role: 'MEMBER' }), (error) => error.statusCode === 404);
});

await test('authors can edit/delete, other members cannot, admins can moderate', async () => {
  const comment = [...comments.values()][0];
  await assert.rejects(() => commentService.updateComment({ workspaceId: workspaceA, taskId: taskA, commentId: comment._id, content: 'Blocked', actorId: otherUser, role: 'MEMBER' }), (error) => error.statusCode === 403);
  await commentService.updateComment({ workspaceId: workspaceA, taskId: taskA, commentId: comment._id, content: 'Edited', actorId: author, role: 'MEMBER' });
  assert.strictEqual(activities.at(-1).action, 'COMMENT_UPDATED');
  await commentService.deleteComment({ workspaceId: workspaceA, taskId: taskA, commentId: comment._id, actorId: otherUser, role: 'ADMIN' });
  assert.strictEqual(activities.at(-1).action, 'COMMENT_DELETED');
});

await test('activity retrieval remains workspace-scoped and paginated', async () => {
  const result = await activityService.getWorkspaceActivity(workspaceA, 1, 1000);
  assert.strictEqual(result.pagination.limit, 100);
  assert.ok(result.activities.every((item) => item.workspaceId.toString() === workspaceA.toString()));
});

const failed = tests.filter(([, passed]) => !passed);
for (const [name, passed, error] of tests) console.log(`  ${passed ? '✅ PASS' : '❌ FAIL'}: ${name}${error ? ` (${error.message})` : ''}`);
console.log(`\nPHASE 4.3 SUMMARY: ${tests.length - failed.length} passed, ${failed.length} failed`);
if (failed.length) process.exitCode = 1;
