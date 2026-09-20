import assert from 'node:assert';
import mongoose from 'mongoose';
import Project from '../src/models/Project.js';
import projectService from '../src/services/projectService.js';
import { validateCreateProject } from '../src/validators/projectValidators.js';
import Activity from '../src/models/Activity.js';

Activity.create = async (document) => document;

const workspaceA = new mongoose.Types.ObjectId();
const workspaceB = new mongoose.Types.ObjectId();
const projectA = new mongoose.Types.ObjectId();
const creator = new mongoose.Types.ObjectId();
const queries = [];
const projects = new Map([
  [`${workspaceA}:${projectA}`, { _id: projectA, workspaceId: workspaceA, name: 'CollabFlow', slug: 'collabflow', createdBy: creator, save: async function () { return this; } }],
]);

const chain = (value) => ({
  populate: async () => value,
});

Project.findOne = (query) => {
  queries.push({ operation: 'findOne', query });
  if (query.slug) return Promise.resolve([...projects.values()].find((project) => project.workspaceId.toString() === query.workspaceId.toString() && project.slug === query.slug) || null);
  return chain(projects.get(`${query.workspaceId}:${query._id}`) || null);
};
Project.find = (query) => {
  queries.push({ operation: 'find', query });
  return { populate: () => ({ sort: async () => [...projects.values()].filter((project) => project.workspaceId.toString() === query.workspaceId.toString()) }) };
};
Project.create = async (document) => {
  const created = { ...document, _id: new mongoose.Types.ObjectId(), save: async function () { return this; } };
  projects.set(`${document.workspaceId}:${created._id}`, created);
  return created;
};
Project.deleteOne = async (query) => {
  queries.push({ operation: 'deleteOne', query });
  const key = `${query.workspaceId}:${query._id}`;
  if (!projects.has(key)) return { deletedCount: 0 };
  projects.delete(key);
  return { deletedCount: 1 };
};

const tests = [];
const test = async (name, fn) => {
  try { await fn(); tests.push([name, true]); }
  catch (error) { tests.push([name, false, error]); }
};

await test('project schema has workspace-scoped unique slug and listing indexes', () => {
  const indexes = Project.schema.indexes();
  assert.ok(indexes.some(([fields, options]) => fields.workspaceId === 1 && fields.slug === 1 && options.unique));
  assert.ok(indexes.some(([fields]) => fields.workspaceId === 1 && fields.createdAt === -1));
});

await test('workspace project listing never returns another workspace', async () => {
  const result = await projectService.getWorkspaceProjects(workspaceB);
  assert.deepStrictEqual(result, []);
  assert.deepStrictEqual(queries.at(-1).query, { workspaceId: workspaceB });
});

await test('single-project access includes workspace boundary', async () => {
  await assert.rejects(() => projectService.getProjectById(workspaceB, projectA), (error) => error.statusCode === 404);
  assert.deepStrictEqual(queries.at(-1).query, { _id: projectA, workspaceId: workspaceB });
});

await test('cross-workspace update and delete are blocked', async () => {
  await assert.rejects(() => projectService.updateProject(workspaceB, projectA, { name: 'Hacked' }), (error) => error.statusCode === 404);
  await assert.rejects(() => projectService.deleteProject(workspaceB, projectA), (error) => error.statusCode === 404);
  assert.deepStrictEqual(queries.at(-1).query, { _id: projectA, workspaceId: workspaceB });
});

await test('slugs collide only inside the same workspace', async () => {
  const sameWorkspace = await projectService.createProject({ workspaceId: workspaceA, name: 'CollabFlow', userId: creator });
  const otherWorkspace = await projectService.createProject({ workspaceId: workspaceB, name: 'CollabFlow', userId: creator });
  assert.match(sameWorkspace.slug, /^collabflow-/);
  assert.strictEqual(otherWorkspace.slug, 'collabflow');
});

await test('validator rejects authority fields and invalid status', async () => {
  let error;
  validateCreateProject({ body: { name: 'Project', workspaceId: workspaceB, createdBy: creator, status: 'INVALID' } }, {}, (nextError) => { error = nextError; });
  assert.strictEqual(error.statusCode, 400);
});

const failed = tests.filter(([, passed]) => !passed);
for (const [name, passed, error] of tests) console.log(`  ${passed ? '✅ PASS' : '❌ FAIL'}: ${name}${error ? ` (${error.message})` : ''}`);
console.log(`\nPROJECT SUMMARY: ${tests.length - failed.length} passed, ${failed.length} failed`);
if (failed.length) process.exitCode = 1;
