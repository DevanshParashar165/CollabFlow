import assert from 'node:assert';
import http from 'node:http';
import { createRequire } from 'node:module';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Workspace from '../src/models/Workspace.js';
import WorkspaceMember from '../src/models/WorkspaceMember.js';
import { generateToken, COOKIE_NAME } from '../src/utils/jwt.js';
import { emitToWorkspace, initSocket } from '../src/sockets/index.js';

const require = createRequire(import.meta.url);
const { io: createClient } = require('../../client/node_modules/socket.io-client');

const memberId = new mongoose.Types.ObjectId();
const outsiderId = new mongoose.Types.ObjectId();
const workspaceId = new mongoose.Types.ObjectId();
const users = new Map([
  [memberId.toString(), { _id: memberId, name: 'Member', avatar: '' }],
  [outsiderId.toString(), { _id: outsiderId, name: 'Outsider', avatar: '' }],
]);
User.findById = async (id) => users.get(id.toString()) || null;
Workspace.findById = async (id) => id.toString() === workspaceId.toString() ? { _id: workspaceId } : null;
WorkspaceMember.findOne = async ({ workspaceId: requestedWorkspace, userId }) => requestedWorkspace.toString() === workspaceId.toString() && userId.toString() === memberId.toString() ? { workspaceId, userId } : null;

const server = http.createServer(app);
const socketServer = initSocket(server);
await new Promise((resolve) => server.listen(0, resolve));
const address = server.address();
const url = `http://127.0.0.1:${address.port}`;
const connect = (token) => createClient(url, { transports: ['websocket'], extraHeaders: { Cookie: `${COOKIE_NAME}=${token}` } });
const waitFor = (socket, event) => new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${event}`)), 2000); socket.once(event, (payload) => { clearTimeout(timer); resolve(payload); }); });
const tests = [];
const test = async (name, fn) => { try { await fn(); tests.push([name, true]); } catch (error) { tests.push([name, false, error]); } };

await test('unauthenticated socket is rejected', async () => {
  const socket = createClient(url, { transports: ['websocket'] });
  const error = await waitFor(socket, 'connect_error');
  assert.match(error.message, /Authentication required|Invalid authentication/i);
  socket.close();
});

await test('invalid JWT is rejected', async () => {
  const socket = connect('invalid-token');
  const error = await waitFor(socket, 'connect_error');
  assert.match(error.message, /Invalid authentication/i);
  socket.close();
});

await test('authenticated member can join and receives presence', async () => {
  const socket = connect(generateToken(memberId));
  await waitFor(socket, 'connect');
  const presencePromise = waitFor(socket, 'workspace:presence');
  socket.emit('workspace:join', workspaceId.toString());
  const presence = await presencePromise;
  assert.strictEqual(presence.workspaceId, workspaceId.toString());
  assert.strictEqual(presence.users[0].id, memberId.toString());
  socket.emit('workspace:leave', workspaceId.toString());
  socket.close();
});

await test('non-member cannot join a workspace', async () => {
  const socket = connect(generateToken(outsiderId));
  await waitFor(socket, 'connect');
  const result = await new Promise((resolve) => socket.emit('workspace:join', workspaceId.toString(), resolve));
  assert.strictEqual(result.ok, undefined);
  assert.match(result.message, /denied/i);
  socket.close();
});

await test('invalid workspace cannot be joined', async () => {
  const socket = connect(generateToken(memberId));
  await waitFor(socket, 'connect');
  const result = await new Promise((resolve) => socket.emit('workspace:join', 'not-an-id', resolve));
  assert.match(result.message, /Invalid workspace/i);
  socket.close();
});

await test('workspace events are delivered to joined room clients', async () => {
  const socket = connect(generateToken(memberId));
  await waitFor(socket, 'connect');
  const joined = new Promise((resolve) => socket.emit('workspace:join', workspaceId.toString(), resolve));
  await joined;
  const event = waitFor(socket, 'task:updated');
  emitToWorkspace(workspaceId, 'task:updated', { taskId: 'task-1', workspaceId: workspaceId.toString() });
  const payload = await event;
  assert.strictEqual(payload.taskId, 'task-1');
  socket.close();
});

socketServer.close();
await new Promise((resolve) => server.close(resolve));
const failed = tests.filter(([, passed]) => !passed);
for (const [name, passed, error] of tests) console.log(`  ${passed ? '✅ PASS' : '❌ FAIL'}: ${name}${error ? ` (${error.message})` : ''}`);
console.log(`\nPHASE 4.4 SUMMARY: ${tests.length - failed.length} passed, ${failed.length} failed`);
if (failed.length) process.exitCode = 1;
