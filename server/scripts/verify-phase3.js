/**
 * Phase 3 Automated Verification Suite:
 * - Multi-Tenant Workspaces
 * - Workspace RBAC (OWNER, ADMIN, MEMBER, VIEWER)
 * - Critical Owner Protection (last OWNER cannot be removed or demoted)
 * - Platform Superadmin Middleware & API
 * - Superadmin Bootstrap CLI
 */

import http from 'http';
import assert from 'node:assert';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User, { PLATFORM_ROLES } from '../src/models/User.js';
import Workspace from '../src/models/Workspace.js';
import WorkspaceMember, { WORKSPACE_ROLES } from '../src/models/WorkspaceMember.js';
import { generateToken, COOKIE_NAME } from '../src/utils/jwt.js';
import workspaceService from '../src/services/workspaceService.js';
import { requireWorkspaceMember } from '../src/middleware/workspaceMiddleware.js';
import { bootstrapSuperadmin } from './createSuperadmin.js';

const inMemoryUsers = new Map();
const inMemoryWorkspaces = new Map();
const inMemoryMembers = new Map(); // key: `${workspaceId}:${userId}`
const transactionTestState = {
  failStart: false,
  failWorkspaceCreate: false,
  failMemberCreate: false,
  failCommit: false,
  startCount: 0,
  abortCount: 0,
  endCount: 0,
};

const setupMocks = () => {
  // Mock User
  User.findOne = (query) => {
    return {
      select: () => ({
        then: async (resolve) => {
          if (query.email) {
            const u = inMemoryUsers.get(query.email.toLowerCase());
            if (!u) return resolve(null);
            return resolve(u);
          }
          resolve(null);
        },
      }),
      then: async (resolve) => {
        if (query.email) {
          const u = inMemoryUsers.get(query.email.toLowerCase());
          if (!u) return resolve(null);
          return resolve(u);
        }
        resolve(null);
      },
    };
  };

  User.findById = async (id) => {
    for (const u of inMemoryUsers.values()) {
      if (u._id.toString() === id.toString()) {
        return {
          ...u,
          toJSON: () => {
            const { passwordHash, ...rest } = u;
            return rest;
          },
        };
      }
    }
    return null;
  };

  User.create = async (doc) => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(doc.password || 'password123', salt);
    const id = new mongoose.Types.ObjectId().toString();

    const newUser = {
      _id: id,
      name: doc.name,
      email: doc.email.toLowerCase(),
      platformRole: doc.platformRole || PLATFORM_ROLES.USER,
      avatar: doc.avatar || '',
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      save: async function () { return this; },
      toJSON: () => ({
        _id: id,
        name: doc.name,
        email: doc.email.toLowerCase(),
        platformRole: doc.platformRole || PLATFORM_ROLES.USER,
        avatar: doc.avatar || '',
        createdAt: new Date().toISOString(),
      }),
    };

    inMemoryUsers.set(doc.email.toLowerCase(), newUser);
    return newUser;
  };

  User.find = () => ({
    sort: () => ({
      skip: () => ({
        limit: async () => Array.from(inMemoryUsers.values()).map(u => ({
          _id: u._id,
          name: u.name,
          email: u.email,
          avatar: u.avatar,
          platformRole: u.platformRole,
          createdAt: u.createdAt,
        })),
      }),
    }),
  });

  User.countDocuments = async () => inMemoryUsers.size;

  // Mock Workspace
  Workspace.create = async (docs, opts) => {
    if (transactionTestState.failWorkspaceCreate) {
      throw new Error('workspace write failed');
    }

    const created = docs.map((doc) => {
      const id = new mongoose.Types.ObjectId().toString();
      const ws = {
        _id: id,
        name: doc.name,
        slug: doc.slug,
        description: doc.description || '',
        createdBy: doc.createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        save: async function () { return this; },
        toJSON: function () {
          return {
            _id: this._id,
            name: this.name,
            slug: this.slug,
            description: this.description,
            createdBy: this.createdBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
          };
        },
      };
      inMemoryWorkspaces.set(id, ws);
      return ws;
    });
    return created;
  };

  Workspace.findOne = (query) => {
    return {
      session: () => ({
        then: async (resolve) => {
          if (query.slug) {
            for (const ws of inMemoryWorkspaces.values()) {
              if (ws.slug === query.slug) return resolve(ws);
            }
          }
          resolve(null);
        },
      }),
      then: async (resolve) => {
        if (query.slug) {
          for (const ws of inMemoryWorkspaces.values()) {
            if (ws.slug === query.slug) return resolve(ws);
          }
        }
        resolve(null);
      },
    };
  };

  Workspace.findById = async (id) => {
    const ws = inMemoryWorkspaces.get(id?.toString());
    if (!ws) return null;
    return {
      ...ws,
      save: async function () { return this; },
      toJSON: function () {
        return {
          _id: this._id,
          name: this.name,
          slug: this.slug,
          description: this.description,
          createdBy: this.createdBy,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
        };
      },
    };
  };

  Workspace.findByIdAndDelete = async (id) => {
    inMemoryWorkspaces.delete(id?.toString());
    return true;
  };

  Workspace.find = () => ({
    populate: () => ({
      sort: () => ({
        skip: () => ({
          limit: async () => Array.from(inMemoryWorkspaces.values()).map(ws => ({
            ...ws,
            createdBy: inMemoryUsers.get(Array.from(inMemoryUsers.keys())[0]),
            toJSON: () => ws,
          })),
        }),
      }),
    }),
  });

  Workspace.countDocuments = async () => inMemoryWorkspaces.size;

  // Mock WorkspaceMember
  WorkspaceMember.create = async (docs, opts) => {
    if (transactionTestState.failMemberCreate) {
      throw new Error('membership write failed');
    }

    const list = Array.isArray(docs) ? docs : [docs];
    const created = list.map((doc) => {
      const id = new mongoose.Types.ObjectId().toString();
      const m = {
        _id: id,
        workspaceId: doc.workspaceId.toString(),
        userId: doc.userId.toString(),
        role: doc.role || WORKSPACE_ROLES.MEMBER,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        save: async function () { return this; },
      };
      inMemoryMembers.set(`${doc.workspaceId.toString()}:${doc.userId.toString()}`, m);
      return m;
    });
    return Array.isArray(docs) ? created : created[0];
  };

  WorkspaceMember.findOne = async (query) => {
    const key = `${query.workspaceId}:${query.userId}`;
    const m = inMemoryMembers.get(key);
    if (!m) return null;
    return {
      ...m,
      save: async function () {
        inMemoryMembers.set(key, this);
        return this;
      },
    };
  };

  WorkspaceMember.find = (query) => {
    let results = Array.from(inMemoryMembers.values());
    if (query.userId) {
      results = results.filter((m) => m.userId.toString() === query.userId.toString());
    }
    if (query.workspaceId) {
      results = results.filter((m) => m.workspaceId.toString() === query.workspaceId.toString());
    }

    return {
      populate: (field, select) => ({
        sort: () => ({
          then: async (resolve) => {
            const populated = results.map((m) => {
              if (field === 'workspaceId') {
                const ws = inMemoryWorkspaces.get(m.workspaceId.toString());
                const plainWs = ws ? (ws.toJSON ? ws.toJSON() : ws) : null;
                return {
                  ...m,
                  workspaceId: plainWs
                    ? {
                        ...plainWs,
                        toJSON: () => plainWs,
                      }
                    : null,
                };
              }
              if (field === 'userId') {
                let userObj = null;
                for (const u of inMemoryUsers.values()) {
                  if (u._id.toString() === m.userId.toString()) {
                    userObj = {
                      _id: u._id,
                      name: u.name,
                      email: u.email,
                      avatar: u.avatar,
                      platformRole: u.platformRole,
                      createdAt: u.createdAt,
                    };
                    break;
                  }
                }
                return { ...m, userId: userObj };
              }
              return m;
            });
            resolve(populated);
          },
        }),
      }),
    };
  };

  WorkspaceMember.countDocuments = async (query) => {
    let count = 0;
    for (const m of inMemoryMembers.values()) {
      let match = true;
      if (query.workspaceId && m.workspaceId.toString() !== query.workspaceId.toString()) match = false;
      if (query.role && m.role !== query.role) match = false;
      if (match) count++;
    }
    return count;
  };

  WorkspaceMember.deleteMany = async (query) => {
    for (const [k, m] of inMemoryMembers.entries()) {
      if (query.workspaceId && m.workspaceId.toString() === query.workspaceId.toString()) {
        inMemoryMembers.delete(k);
      }
    }
    return true;
  };

  WorkspaceMember.findByIdAndDelete = async (id) => {
    for (const [k, m] of inMemoryMembers.entries()) {
      if (m._id.toString() === id.toString()) {
        inMemoryMembers.delete(k);
        return true;
      }
    }
    return false;
  };

  // Mock Mongoose Transaction Session
  mongoose.startSession = async () => {
    transactionTestState.startCount++;
    if (transactionTestState.failStart) {
      throw Object.assign(new Error('Transaction numbers are only allowed on a replica set member or mongos'), {
        code: 20,
        codeName: 'IllegalOperation',
      });
    }

    let workspaceSnapshot;
    let memberSnapshot;
    return {
      startTransaction: () => {
        workspaceSnapshot = new Map(inMemoryWorkspaces);
        memberSnapshot = new Map(inMemoryMembers);
      },
      commitTransaction: async () => {
        if (transactionTestState.failCommit) {
          throw new Error('commit failed');
        }
      },
      abortTransaction: async () => {
        transactionTestState.abortCount++;
        inMemoryWorkspaces.clear();
        inMemoryMembers.clear();
        for (const [key, value] of workspaceSnapshot) inMemoryWorkspaces.set(key, value);
        for (const [key, value] of memberSnapshot) inMemoryMembers.set(key, value);
      },
      endSession: async () => {
        transactionTestState.endCount++;
      },
    };
  };
};

const resetTransactionTestState = () => {
  Object.assign(transactionTestState, {
    failStart: false,
    failWorkspaceCreate: false,
    failMemberCreate: false,
    failCommit: false,
    startCount: 0,
    abortCount: 0,
    endCount: 0,
  });
};

const runTests = async () => {
  setupMocks();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  console.log(`\n======================================================`);
  console.log(`🚀 RUNNING PHASE 3 WORKSPACE + RBAC + SUPERADMIN TEST SUITE`);
  console.log(`======================================================\n`);

  let testsPassed = 0;
  let testsFailed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      testsPassed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      testsFailed++;
    }
  };

  // Setup Users: Alice (regular user), Bob (regular user), Charlie (regular user)
  const alice = await User.create({ name: 'Alice Owner', email: 'alice@cf.io', password: 'password123' });
  const bob = await User.create({ name: 'Bob Admin', email: 'bob@cf.io', password: 'password123' });
  const charlie = await User.create({ name: 'Charlie Member', email: 'charlie@cf.io', password: 'password123' });
  const outsider = await User.create({ name: 'Outsider Dave', email: 'dave@cf.io', password: 'password123' });

  const aliceCookie = `${COOKIE_NAME}=${generateToken(alice._id)}`;
  const bobCookie = `${COOKIE_NAME}=${generateToken(bob._id)}`;
  const charlieCookie = `${COOKIE_NAME}=${generateToken(charlie._id)}`;
  const outsiderCookie = `${COOKIE_NAME}=${generateToken(outsider._id)}`;

  let workspaceId = null;

  // 1. Transactional Workspace Creation
  await test('POST /api/workspaces creates workspace and assigns creator as OWNER', async () => {
    const res = await fetch(`${baseUrl}/workspaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: aliceCookie,
      },
      body: JSON.stringify({
        name: 'Alpha Project Workspace',
        description: 'Primary team workspace',
        // Attacker attempts to forge authority-bearing fields:
        createdBy: outsider._id,
        role: 'VIEWER',
      }),
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.status, 'success');
    assert.strictEqual(data.data.workspace.name, 'Alpha Project Workspace');
    assert.strictEqual(data.data.workspace.slug, 'alpha-project-workspace');
    assert.strictEqual(data.data.workspace.createdBy, alice._id); // Must be Alice, ignoring client injection
    assert.strictEqual(data.data.workspace.membership.role, 'OWNER');

    workspaceId = data.data.workspace._id;
  });

  // 2. User Workspaces List
  await test('GET /api/workspaces returns only workspaces user belongs to', async () => {
    const resAlice = await fetch(`${baseUrl}/workspaces`, {
      headers: { Cookie: aliceCookie },
    });
    assert.strictEqual(resAlice.status, 200);
    const dataAlice = await resAlice.json();
    assert.strictEqual(dataAlice.data.workspaces.length, 1);
    assert.strictEqual(dataAlice.data.workspaces[0].role, 'OWNER');

    // Outsider should have 0 workspaces
    const resOutsider = await fetch(`${baseUrl}/workspaces`, {
      headers: { Cookie: outsiderCookie },
    });
    assert.strictEqual(resOutsider.status, 200);
    const dataOutsider = await resOutsider.json();
    assert.strictEqual(dataOutsider.data.workspaces.length, 0);
  });

  // 3. Workspace Isolation
  await test('GET /api/workspaces/:workspaceId denies non-member with 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/workspaces/${workspaceId}`, {
      headers: { Cookie: outsiderCookie },
    });
    assert.strictEqual(res.status, 403);
  });

  await test('GET /api/workspaces/:workspaceId allows member with 200 OK', async () => {
    const res = await fetch(`${baseUrl}/workspaces/${workspaceId}`, {
      headers: { Cookie: aliceCookie },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.data.workspace.role, 'OWNER');
  });

  // 4. Member Management: OWNER adds Bob as ADMIN and Charlie as MEMBER
  await test('POST /api/workspaces/:workspaceId/members allows OWNER to add ADMIN and MEMBER', async () => {
    // Add Bob as ADMIN
    const resBob = await fetch(`${baseUrl}/workspaces/${workspaceId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: aliceCookie,
      },
      body: JSON.stringify({
        email: bob.email,
        role: 'ADMIN',
      }),
    });
    assert.strictEqual(resBob.status, 201);
    const dataBob = await resBob.json();
    assert.strictEqual(dataBob.data.member.role, 'ADMIN');

    // Add Charlie as MEMBER
    const resCharlie = await fetch(`${baseUrl}/workspaces/${workspaceId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: aliceCookie,
      },
      body: JSON.stringify({
        email: charlie.email,
        role: 'MEMBER',
      }),
    });
    assert.strictEqual(resCharlie.status, 201);
  });

  await test('OWNER cannot add another OWNER through generic member endpoint', async () => {
    const res = await fetch(`${baseUrl}/workspaces/${workspaceId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: aliceCookie,
      },
      body: JSON.stringify({ email: outsider.email, role: 'OWNER' }),
    });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(
      Array.from(inMemoryMembers.values()).some(
        (member) => member.workspaceId === workspaceId && member.userId === outsider._id && member.role === 'OWNER'
      ),
      false
    );
  });

  await test('ADMIN cannot add OWNER through generic member endpoint', async () => {
    const res = await fetch(`${baseUrl}/workspaces/${workspaceId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: bobCookie,
      },
      body: JSON.stringify({ email: outsider.email, role: 'OWNER' }),
    });
    assert.strictEqual(res.status, 403);
  });

  // 5. Compound Uniqueness Constraint: Duplicate membership rejected
  await test('POST /api/workspaces/:workspaceId/members rejects duplicate membership with 409 Conflict', async () => {
    const res = await fetch(`${baseUrl}/workspaces/${workspaceId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: aliceCookie,
      },
      body: JSON.stringify({
        email: bob.email,
        role: 'MEMBER',
      }),
    });
    assert.strictEqual(res.status, 409);
  });

  // 6. RBAC Member Permissions: MEMBER cannot invite new members
  await test('POST /api/workspaces/:workspaceId/members denies MEMBER with 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/workspaces/${workspaceId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: charlieCookie,
      },
      body: JSON.stringify({
        email: outsider.email,
        role: 'VIEWER',
      }),
    });
    assert.strictEqual(res.status, 403);
  });

  // 7. RBAC ADMIN Restrictions: ADMIN cannot promote to OWNER
  await test('ADMIN cannot promote member to OWNER (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/workspaces/${workspaceId}/members/${charlie._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: bobCookie,
      },
      body: JSON.stringify({ role: 'OWNER' }),
    });
    assert.strictEqual(res.status, 403);
  });

  // 8. RBAC ADMIN Restrictions: ADMIN cannot demote or remove OWNER
  await test('ADMIN cannot demote OWNER (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/workspaces/${workspaceId}/members/${alice._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: bobCookie,
      },
      body: JSON.stringify({ role: 'MEMBER' }),
    });
    assert.strictEqual(res.status, 403);
  });

  await test('ADMIN cannot remove OWNER (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/workspaces/${workspaceId}/members/${alice._id}`, {
      method: 'DELETE',
      headers: { Cookie: bobCookie },
    });
    assert.strictEqual(res.status, 403);
  });

  // 9. RBAC ADMIN Restrictions: ADMIN cannot delete workspace
  await test('ADMIN cannot delete workspace (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/workspaces/${workspaceId}`, {
      method: 'DELETE',
      headers: { Cookie: bobCookie },
    });
    assert.strictEqual(res.status, 403);
  });

  // 10. Critical Owner Protection: Last OWNER cannot be demoted
  await test('Last OWNER cannot demote self away from OWNER (409 Conflict)', async () => {
    const res = await fetch(`${baseUrl}/workspaces/${workspaceId}/members/${alice._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: aliceCookie,
      },
      body: JSON.stringify({ role: 'ADMIN' }),
    });
    assert.strictEqual(res.status, 409);
    const data = await res.json();
    assert.match(data.message, /Cannot remove or demote the last OWNER/i);
  });

  // 11. Critical Owner Protection: Last OWNER cannot be removed
  await test('Last OWNER cannot be removed from workspace (409 Conflict)', async () => {
    const res = await fetch(`${baseUrl}/workspaces/${workspaceId}/members/${alice._id}`, {
      method: 'DELETE',
      headers: { Cookie: aliceCookie },
    });
    assert.strictEqual(res.status, 409);
    const data = await res.json();
    assert.match(data.message, /Cannot remove or demote the last OWNER/i);
  });

  await test('workspace creation transaction rolls back partial writes on membership failure', async () => {
    const workspaceCount = inMemoryWorkspaces.size;
    const memberCount = inMemoryMembers.size;
    resetTransactionTestState();
    transactionTestState.failMemberCreate = true;

    await assert.rejects(
      workspaceService.createWorkspace({
        name: 'Rollback Workspace',
        userId: alice._id,
      }),
      /membership write failed/
    );

    assert.strictEqual(inMemoryWorkspaces.size, workspaceCount);
    assert.strictEqual(inMemoryMembers.size, memberCount);
    assert.strictEqual(transactionTestState.abortCount, 1);
    assert.strictEqual(transactionTestState.endCount, 1);
    resetTransactionTestState();
  });

  await test('transaction start failure returns transaction-support error and cleans up', async () => {
    resetTransactionTestState();
    transactionTestState.failStart = true;

    await assert.rejects(
      workspaceService.createWorkspace({ name: 'Unsupported Transaction', userId: alice._id }),
      (error) => error.statusCode === 500 && /replica set/i.test(error.message)
    );

    assert.strictEqual(transactionTestState.abortCount, 0);
    assert.strictEqual(transactionTestState.endCount, 0);
    resetTransactionTestState();
  });

  await test('workspace middleware ignores body workspaceId and requires route parameter', async () => {
    let nextError;
    await requireWorkspaceMember(
      {
        params: {},
        body: { workspaceId },
        user: alice,
      },
      {},
      (error) => {
        nextError = error;
      }
    );

    assert.strictEqual(nextError?.statusCode, 400);
  });

  // 12. Superadmin Bootstrap CLI: Elevate existing user and create new user
  let superadminUser = null;
  await test('Superadmin bootstrap elevates existing user safely', async () => {
    const result = await bootstrapSuperadmin({ email: outsider.email });
    assert.strictEqual(result.elevated, true);
    assert.strictEqual(outsider.platformRole, 'SUPERADMIN');
  });

  await test('Superadmin bootstrap creates new superadmin with generated password', async () => {
    const result = await bootstrapSuperadmin({
      email: 'root@collabflow.io',
      name: 'System Root',
    });
    assert.strictEqual(result.created, true);
    assert.ok(result.generatedPassword);
    assert.strictEqual(result.user.platformRole, 'SUPERADMIN');
    superadminUser = result.user;
  });

  // 13. Superadmin API Protection: Regular users denied with 403 Forbidden
  await test('GET /api/superadmin/users denies regular user (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/superadmin/users`, {
      headers: { Cookie: aliceCookie },
    });
    assert.strictEqual(res.status, 403);
  });

  await test('GET /api/superadmin/workspaces denies regular user (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/superadmin/workspaces`, {
      headers: { Cookie: aliceCookie },
    });
    assert.strictEqual(res.status, 403);
  });

  // 14. Superadmin API Access: SUPERADMIN granted 200 OK with sanitized bounded responses
  const superadminCookie = `${COOKIE_NAME}=${generateToken(superadminUser._id)}`;

  await test('GET /api/superadmin/users grants SUPERADMIN access and sanitizes secrets', async () => {
    const res = await fetch(`${baseUrl}/superadmin/users?page=1&limit=10`, {
      headers: { Cookie: superadminCookie },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'success');
    assert.ok(Array.isArray(data.data.users));
    assert.ok(data.data.pagination);

    for (const u of data.data.users) {
      assert.strictEqual(u.password, undefined);
      assert.strictEqual(u.passwordHash, undefined);
    }
  });

  await test('GET /api/superadmin/workspaces grants SUPERADMIN access with bounds', async () => {
    const res = await fetch(`${baseUrl}/superadmin/workspaces?page=1&limit=10`, {
      headers: { Cookie: superadminCookie },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'success');
    assert.ok(Array.isArray(data.data.workspaces));
    assert.ok(data.data.pagination);
  });

  // 15. Workspace Deletion: OWNER deletes workspace
  await test('DELETE /api/workspaces/:workspaceId allows OWNER to delete workspace', async () => {
    const res = await fetch(`${baseUrl}/workspaces/${workspaceId}`, {
      method: 'DELETE',
      headers: { Cookie: aliceCookie },
    });
    assert.strictEqual(res.status, 200);

    // Workspace should now be gone
    const checkRes = await fetch(`${baseUrl}/workspaces/${workspaceId}`, {
      headers: { Cookie: aliceCookie },
    });
    assert.strictEqual(checkRes.status, 404);
  });

  console.log(`\n======================================================`);
  console.log(`PHASE 3 SUMMARY: ${testsPassed} passed, ${testsFailed} failed`);
  console.log(`======================================================\n`);

  server.close();
  process.exit(testsFailed > 0 ? 1 : 0);
};

runTests().catch((err) => {
  console.error('Fatal Phase 3 test runner error:', err);
  process.exit(1);
});
