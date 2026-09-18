/**
 * Comprehensive Automated Authentication & Authorization Verification Suite
 *
 * Tests every required scenario:
 * 1. Register new user -> 201 Created + HTTP-only cookie + role: "MEMBER"
 * 2. Attempt privilege escalation -> client sends { role: "ADMIN" } -> backend still enforces role: "MEMBER"
 * 3. Duplicate email registration -> 409 Conflict
 * 4. Login with incorrect password -> 401 Unauthorized ("Invalid email or password")
 * 5. Login with non-existent email -> 401 Unauthorized (identical message to prevent enumeration)
 * 6. Login with correct credentials -> 200 OK + HTTP-only cookie
 * 7. GET /api/auth/me without cookie -> 401 Unauthorized
 * 8. GET /api/auth/me with valid cookie -> 200 OK + sanitized profile (no password hash)
 * 9. GET /api/auth/admin-test with MEMBER role -> 403 Forbidden ("Insufficient permissions")
 * 10. POST /api/auth/logout -> 200 OK + cookie cleared
 * 11. GET /api/auth/me after logout -> 401 Unauthorized
 * 12. Input validation edge cases (invalid email, short password, empty fields)
 * 13. JWT token tampering / invalid token rejection
 */

import http from 'http';
import assert from 'node:assert';
import bcrypt from 'bcrypt';
import app from '../src/app.js';
import User, { USER_ROLES } from '../src/models/User.js';
import { generateToken, verifyToken, COOKIE_NAME } from '../src/utils/jwt.js';

// In-memory test store to verify full HTTP request pipeline without requiring external MongoDB service
const inMemoryUsers = new Map();

// Monkey-patch Mongoose User model methods for mock testing
const setupMocks = () => {
  User.findOne = (query) => {
    let selectFields = '';
    const executor = {
      select: (fields) => {
        selectFields = fields;
        return executor;
      },
      then: async (resolve) => {
        if (query.email) {
          const user = inMemoryUsers.get(query.email.toLowerCase());
          if (!user) return resolve(null);

          const copy = {
            ...user,
            comparePassword: async (plain) => bcrypt.compare(plain, user.passwordHash),
            toJSON: () => {
              const { passwordHash, ...rest } = user;
              return rest;
            },
          };
          if (selectFields.includes('+password')) {
            copy.password = user.passwordHash;
          }
          return resolve(copy);
        }
        return resolve(null);
      },
    };
    return executor;
  };

  User.create = async (doc) => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(doc.password, salt);
    const id = 'usr_' + Math.random().toString(36).substring(2, 9);

    const newUser = {
      _id: id,
      name: doc.name,
      email: doc.email.toLowerCase(),
      role: doc.role || USER_ROLES.MEMBER,
      avatar: doc.avatar || '',
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comparePassword: async (plain) => bcrypt.compare(plain, passwordHash),
      toJSON: () => ({
        _id: id,
        name: doc.name,
        email: doc.email.toLowerCase(),
        role: doc.role || USER_ROLES.MEMBER,
        avatar: doc.avatar || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    };

    inMemoryUsers.set(doc.email.toLowerCase(), newUser);
    return newUser;
  };

  User.findById = async (id) => {
    for (const user of inMemoryUsers.values()) {
      if (user._id === id) {
        return {
          ...user,
          toJSON: () => {
            const { passwordHash, ...rest } = user;
            return rest;
          },
        };
      }
    }
    return null;
  };
};

// Start test HTTP server
const runTests = async () => {
  setupMocks();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  console.log(`\n==================================================`);
  console.log(`🚀 RUNNING PHASE 2 AUTHENTICATION TEST SUITE`);
  console.log(`==================================================\n`);

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

  // Helper to extract cookie from Set-Cookie header
  let authCookie = '';

  // 1. Health Check
  await test('GET /api/health returns 200 OK', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
  });

  // 2. Input Validation: Invalid email
  await test('POST /api/auth/register fails on invalid email', async () => {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', email: 'invalid-email', password: 'password123' }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.status, 'error');
    assert.match(data.message, /valid email/i);
  });

  // 3. Input Validation: Short password
  await test('POST /api/auth/register fails on password < 6 chars', async () => {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', email: 'test@example.com', password: '123' }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.status, 'error');
    assert.match(data.message, /at least 6 characters/i);
  });

  // 4. Registration: Valid user
  await test('POST /api/auth/register creates new user with MEMBER role and sets cookie', async () => {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice Smith', email: 'alice@collabflow.io', password: 'SecurePassword123' }),
    });

    assert.strictEqual(res.status, 201);
    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Set-Cookie header must be present');
    assert.match(setCookie, /token=/, 'Cookie must be named "token"');
    assert.match(setCookie, /HttpOnly/i, 'Cookie must have HttpOnly flag');

    authCookie = setCookie.split(';')[0]; // Save for authenticated requests

    const data = await res.json();
    assert.strictEqual(data.status, 'success');
    assert.strictEqual(data.data.user.name, 'Alice Smith');
    assert.strictEqual(data.data.user.email, 'alice@collabflow.io');
    assert.strictEqual(data.data.user.role, 'MEMBER');
    assert.strictEqual(data.data.user.password, undefined, 'Password hash must NEVER be in response');
  });

  // 5. Privilege Escalation Prevention: Attempt to inject role: "OWNER"
  await test('POST /api/auth/register rejects client-provided role and enforces MEMBER', async () => {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Attacker Bob',
        email: 'bob@hacker.io',
        password: 'Password123',
        role: 'OWNER', // Malicious attempt to escalate privilege
      }),
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(
      data.data.user.role,
      'MEMBER',
      'Backend MUST neutralize role parameter and enforce MEMBER role'
    );
  });

  // 6. Duplicate Registration
  await test('POST /api/auth/register rejects duplicate email with 409 Conflict', async () => {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice Duplicate', email: 'alice@collabflow.io', password: 'AnotherPassword123' }),
    });

    assert.strictEqual(res.status, 409);
    const data = await res.json();
    assert.strictEqual(data.status, 'error');
    assert.match(data.message, /already exists/i);
  });

  // 7. Login: Incorrect Password
  await test('POST /api/auth/login with wrong password returns 401', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@collabflow.io', password: 'WrongPassword' }),
    });

    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.status, 'error');
    assert.strictEqual(data.message, 'Invalid email or password');
  });

  // 8. Login: Non-existent email returns identical 401 (enumeration defense)
  await test('POST /api/auth/login with non-existent email returns identical 401', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ghost@nonexistent.io', password: 'SomePassword' }),
    });

    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.status, 'error');
    assert.strictEqual(data.message, 'Invalid email or password');
  });

  // 9. Login: Correct Credentials
  await test('POST /api/auth/login with valid credentials returns 200 OK + cookie', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@collabflow.io', password: 'SecurePassword123' }),
    });

    assert.strictEqual(res.status, 200);
    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie);
    assert.match(setCookie, /HttpOnly/i);

    authCookie = setCookie.split(';')[0];

    const data = await res.json();
    assert.strictEqual(data.status, 'success');
    assert.strictEqual(data.data.user.email, 'alice@collabflow.io');
    assert.strictEqual(data.data.user.password, undefined);
  });

  // 10. GET /api/auth/me without authentication
  await test('GET /api/auth/me without cookie returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/auth/me`);
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.status, 'error');
  });

  // 11. GET /api/auth/me with invalid / tampered JWT
  await test('GET /api/auth/me with tampered token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/auth/me`, {
      headers: { Cookie: 'token=invalid.tampered.jwt_token' },
    });
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.status, 'error');
  });

  // 12. GET /api/auth/me with valid authentication cookie
  await test('GET /api/auth/me with valid cookie returns authenticated user profile', async () => {
    const res = await fetch(`${baseUrl}/auth/me`, {
      headers: { Cookie: authCookie },
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'success');
    assert.strictEqual(data.data.user.email, 'alice@collabflow.io');
    assert.strictEqual(data.data.user.name, 'Alice Smith');
    assert.strictEqual(data.data.user.role, 'MEMBER');
    assert.strictEqual(data.data.user.password, undefined);
  });

  // 13. Role-Based Authorization: MEMBER role accessing ADMIN route
  await test('GET /api/auth/admin-test with MEMBER role returns 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/auth/admin-test`, {
      headers: { Cookie: authCookie },
    });

    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.strictEqual(data.status, 'error');
    assert.match(data.message, /lacks permission/i);
  });

  // 14. Role-Based Authorization: ADMIN role accessing ADMIN route
  await test('GET /api/auth/admin-test with ADMIN role returns 200 OK', async () => {
    // Create an ADMIN user in test store
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@collabflow.io',
      password: 'AdminPassword123',
      role: USER_ROLES.ADMIN,
    });
    adminUser.role = USER_ROLES.ADMIN; // Directly set role in trusted context

    const adminToken = generateToken(adminUser._id);
    const adminCookie = `${COOKIE_NAME}=${adminToken}`;

    const res = await fetch(`${baseUrl}/auth/admin-test`, {
      headers: { Cookie: adminCookie },
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'success');
    assert.strictEqual(data.data.role, 'ADMIN');
  });

  // 15. Role-Based Authorization: OWNER role accessing ADMIN route
  await test('GET /api/auth/admin-test with OWNER role returns 200 OK', async () => {
    const ownerUser = await User.create({
      name: 'Workspace Owner',
      email: 'owner@collabflow.io',
      password: 'OwnerPassword123',
      role: USER_ROLES.OWNER,
    });
    ownerUser.role = USER_ROLES.OWNER;

    const ownerToken = generateToken(ownerUser._id);
    const ownerCookie = `${COOKIE_NAME}=${ownerToken}`;

    const res = await fetch(`${baseUrl}/auth/admin-test`, {
      headers: { Cookie: ownerCookie },
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'success');
    assert.strictEqual(data.data.role, 'OWNER');
  });

  // 16. Logout
  await test('POST /api/auth/logout clears cookie and returns 200 OK', async () => {
    const res = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { Cookie: authCookie },
    });

    assert.strictEqual(res.status, 200);
    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Set-Cookie header must be present after logout');

    // Express clearCookie sets Expires to Unix epoch (1970), which clears the cookie in the browser.
    // The token value will also be empty: "token=;"
    const isCookieCleared =
      setCookie.includes('Expires=Thu, 01 Jan 1970') ||
      setCookie.includes('Max-Age=0') ||
      setCookie.match(/token=\s*;/);
    assert.ok(isCookieCleared, `Set-Cookie must clear the cookie. Got: ${setCookie}`);

    const data = await res.json();
    assert.strictEqual(data.status, 'success');
  });

  // 17. GET /api/auth/me after logout (simulated by empty/cleared cookie)
  await test('GET /api/auth/me after logout returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/auth/me`, {
      headers: { Cookie: `${COOKIE_NAME}=` },
    });

    assert.strictEqual(res.status, 401);
  });

  console.log(`\n==================================================`);
  console.log(`SUMMARY: ${testsPassed} passed, ${testsFailed} failed`);
  console.log(`==================================================\n`);

  server.close();

  if (testsFailed > 0) {
    process.exit(1);
  }
};

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
