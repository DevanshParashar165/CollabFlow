import assert from "node:assert";
import http from "node:http";
import { createRequire } from "node:module";
import mongoose from "mongoose";
import app from "../src/app.js";
import User from "../src/models/User.js";
import WorkspaceMember from "../src/models/WorkspaceMember.js";
import Notification, {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITY_TYPES,
} from "../src/models/Notification.js";
import notificationService, {
  safeCreateNotification,
} from "../src/services/notificationService.js";
import { generateToken, COOKIE_NAME } from "../src/utils/jwt.js";
import { initSocket, emitToUser } from "../src/sockets/index.js";

const require = createRequire(import.meta.url);
const { io: createClient } = require("../../client/node_modules/socket.io-client");

// Set up mock data and in-memory storage
const userAId = new mongoose.Types.ObjectId();
const userBId = new mongoose.Types.ObjectId();
const userCId = new mongoose.Types.ObjectId(); // non-member
const workspaceId = new mongoose.Types.ObjectId();
const otherWorkspaceId = new mongoose.Types.ObjectId();

const users = new Map([
  [userAId.toString(), { _id: userAId, name: "Alice", avatar: "alice.png" }],
  [userBId.toString(), { _id: userBId, name: "Bob", avatar: "bob.png" }],
  [userCId.toString(), { _id: userCId, name: "Charlie", avatar: "" }],
]);

const notifications = new Map();

// Mock Mongoose model methods
User.findById = async (id) => users.get(id?.toString()) || null;

WorkspaceMember.findOne = async ({ workspaceId: wsId, userId }) => {
  if (
    wsId?.toString() === workspaceId.toString() &&
    (userId?.toString() === userAId.toString() ||
      userId?.toString() === userBId.toString())
  ) {
    return { workspaceId: wsId, userId };
  }
  return null;
};

const populateDoc = (doc) => {
  if (!doc) return null;
  const clone = { ...doc };
  if (clone.actorId) {
    const actor = users.get(clone.actorId.toString());
    clone.actorId = actor
      ? { _id: actor._id, name: actor.name, avatar: actor.avatar }
      : clone.actorId;
  }
  return clone;
};

Notification.create = async (data) => {
  const _id = new mongoose.Types.ObjectId();
  const doc = {
    ...data,
    _id,
    isRead: false,
    readAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: async function () {
      notifications.set(this._id.toString(), { ...this });
      return this;
    },
  };
  notifications.set(_id.toString(), doc);
  return doc;
};

Notification.findById = (id) => ({
  populate: async () => populateDoc(notifications.get(id?.toString()) || null),
  then: (resolve) => resolve(notifications.get(id?.toString()) || null),
});

Notification.find = (filter) => {
  const match = (item) => {
    if (filter.recipientId && item.recipientId.toString() !== filter.recipientId.toString())
      return false;
    if (filter.workspaceId && item.workspaceId.toString() !== filter.workspaceId.toString())
      return false;
    if (filter.isRead !== undefined && item.isRead !== filter.isRead)
      return false;
    return true;
  };

  return {
    populate: () => ({
      sort: () => ({
        skip: (s) => ({
          limit: async (l) =>
            [...notifications.values()]
              .filter(match)
              .sort((a, b) => b.createdAt - a.createdAt)
              .slice(s, s + l)
              .map(populateDoc),
        }),
      }),
    }),
  };
};

Notification.countDocuments = async (filter) => {
  return [...notifications.values()].filter((item) => {
    if (filter.recipientId && item.recipientId.toString() !== filter.recipientId.toString())
      return false;
    if (filter.workspaceId && item.workspaceId.toString() !== filter.workspaceId.toString())
      return false;
    if (filter.isRead !== undefined && item.isRead !== filter.isRead)
      return false;
    return true;
  }).length;
};

Notification.updateMany = async (filter, update) => {
  let modifiedCount = 0;
  for (const [id, item] of notifications.entries()) {
    let matches = true;
    if (filter.recipientId && item.recipientId.toString() !== filter.recipientId.toString())
      matches = false;
    if (filter.workspaceId && item.workspaceId.toString() !== filter.workspaceId.toString())
      matches = false;
    if (filter.isRead !== undefined && item.isRead !== filter.isRead)
      matches = false;
    if (matches) {
      if (update.$set) {
        Object.assign(item, update.$set);
      }
      notifications.set(id, item);
      modifiedCount++;
    }
  }
  return { modifiedCount };
};

Notification.deleteOne = async (query) => {
  const exists = notifications.has(query._id.toString());
  if (exists) notifications.delete(query._id.toString());
  return { deletedCount: exists ? 1 : 0 };
};

// Start test HTTP & Socket server
const server = http.createServer(app);
const socketServer = initSocket(server);
await new Promise((resolve) => server.listen(0, resolve));
const address = server.address();
const url = `http://127.0.0.1:${address.port}`;

const connectSocket = (token) =>
  createClient(url, {
    transports: ["websocket"],
    extraHeaders: { Cookie: `${COOKIE_NAME}=${token}` },
  });

const waitForEvent = (socket, event) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out waiting for socket event: ${event}`)),
      4000
    );
    socket.once(event, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
    socket.once("connect_error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });

const waitForConnect = (socket) => {
  if (socket.connected) return Promise.resolve();
  return waitForEvent(socket, "connect");
};

const request = async (method, path, { token, body } = {}) => {
  const headers = {};
  if (token) headers.Cookie = `${COOKIE_NAME}=${token}`;
  if (body) headers["Content-Type"] = "application/json";

  const response = await fetch(`${url}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);
  return { status: response.status, data };
};

const tests = [];
const test = async (name, fn) => {
  try {
    await fn();
    tests.push([name, true]);
  } catch (error) {
    tests.push([name, false, error]);
  }
};

// ==================== TESTS ====================

// 1. Model Schema Tests
await test("Notification schema has all required fields, types, and constraints", () => {
  assert.ok(Notification.schema.path("recipientId").options.required);
  assert.ok(Notification.schema.path("workspaceId").options.required);
  assert.ok(Notification.schema.path("actorId").options.required);
  assert.ok(Notification.schema.path("type").options.required);
  assert.ok(Notification.schema.path("entityType").options.required);
  assert.ok(Notification.schema.path("entityId").options.required);
  assert.ok(Notification.schema.path("message").options.required);
  assert.strictEqual(Notification.schema.path("message").options.maxlength, 500);
  assert.strictEqual(Notification.schema.path("isRead").options.default, false);

  assert.deepStrictEqual(
    [...Notification.schema.path("type").enumValues],
    [...NOTIFICATION_TYPES]
  );
  assert.deepStrictEqual(
    [...Notification.schema.path("entityType").enumValues],
    [...NOTIFICATION_ENTITY_TYPES]
  );
});

await test("Notification model has query and dedup compound indexes", () => {
  const indexes = Notification.schema.indexes();
  const indexKeys = indexes.map(([fields]) => Object.keys(fields).join(","));

  assert.ok(indexKeys.includes("recipientId,createdAt"));
  assert.ok(indexKeys.includes("recipientId,isRead,createdAt"));
  assert.ok(indexKeys.includes("workspaceId,recipientId"));
  assert.ok(indexKeys.includes("recipientId,type,entityId,actorId,createdAt"));
});

// 2. Service Creation & Workspace Membership Tests
await test("createNotification suppresses self-notifications", async () => {
  const result = await notificationService.createNotification({
    recipientId: userAId,
    workspaceId,
    actorId: userAId, // actor === recipient
    type: "TASK_ASSIGNED",
    entityType: "TASK",
    entityId: new mongoose.Types.ObjectId(),
    message: "Self notification",
  });
  assert.strictEqual(result, null);
});

await test("createNotification rejects recipient who is not a workspace member", async () => {
  await assert.rejects(
    () =>
      notificationService.createNotification({
        recipientId: userCId, // Charlie is not a member
        workspaceId,
        actorId: userAId,
        type: "TASK_ASSIGNED",
        entityType: "TASK",
        entityId: new mongoose.Types.ObjectId(),
        message: "Assignment to outsider",
      }),
    (err) => err.statusCode === 403 && /not a member/i.test(err.message)
  );
});

await test("createNotification successfully creates notification for valid member", async () => {
  const entityId = new mongoose.Types.ObjectId();
  const notif = await notificationService.createNotification({
    recipientId: userBId,
    workspaceId,
    actorId: userAId,
    type: "TASK_ASSIGNED",
    entityType: "TASK",
    entityId,
    message: "Alice assigned you a task",
    metadata: { taskTitle: "Build notifications" },
  });

  assert.ok(notif._id);
  assert.strictEqual(notif.recipientId, userBId);
  assert.strictEqual(notif.isRead, false);
});

await test("safeCreateNotification never throws and safely logs on failure", async () => {
  const result = await safeCreateNotification({
    recipientId: userCId, // will fail membership check
    workspaceId,
    actorId: userAId,
    type: "TASK_ASSIGNED",
    entityType: "TASK",
    entityId: new mongoose.Types.ObjectId(),
    message: "Outsider task",
  });
  assert.strictEqual(result, null);
});

// 3. User-Scoped Listing & Pagination Tests
await test("getUserNotifications is strictly user-scoped and supports pagination", async () => {
  // Create 2 notifications for User A and 1 for User B
  await notificationService.createNotification({
    recipientId: userAId,
    workspaceId,
    actorId: userBId,
    type: "COMMENT_ADDED",
    entityType: "COMMENT",
    entityId: new mongoose.Types.ObjectId(),
    message: "Bob commented on your task",
  });
  await notificationService.createNotification({
    recipientId: userAId,
    workspaceId,
    actorId: userBId,
    type: "TASK_STATUS_CHANGED",
    entityType: "TASK",
    entityId: new mongoose.Types.ObjectId(),
    message: "Bob moved task to In Progress",
  });

  const listA = await notificationService.getUserNotifications(userAId, {
    page: 1,
    limit: 10,
  });
  assert.strictEqual(listA.notifications.length, 2);
  assert.strictEqual(listA.pagination.total, 2);
  assert.strictEqual(listA.unreadCount, 2);
  assert.ok(listA.notifications[0].actorId.name); // Populated

  const listB = await notificationService.getUserNotifications(userBId, {
    page: 1,
    limit: 10,
  });
  assert.strictEqual(listB.notifications.length, 1);
  assert.strictEqual(listB.notifications[0].recipientId, userBId);
});

// 4. Mark as Read & Ownership Enforcement Tests
await test("markAsRead allows recipient to mark read, blocks other users with 403", async () => {
  const notifA = (await notificationService.getUserNotifications(userAId)).notifications[0];

  // User B tries to mark User A's notification as read
  await assert.rejects(
    () => notificationService.markAsRead(notifA._id, userBId),
    (err) => err.statusCode === 403
  );

  // User A marks their own notification
  const updated = await notificationService.markAsRead(notifA._id, userAId);
  assert.strictEqual(updated.isRead, true);
  assert.ok(updated.readAt instanceof Date);

  // Unread count decremented
  const unreadCount = await notificationService.getUnreadCount(userAId);
  assert.strictEqual(unreadCount, 1);
});

await test("markAllAsRead marks all user notifications as read", async () => {
  const result = await notificationService.markAllAsRead(userAId);
  assert.strictEqual(result.modifiedCount, 1);

  const unreadCount = await notificationService.getUnreadCount(userAId);
  assert.strictEqual(unreadCount, 0);

  // User B unread count remains untouched
  const unreadB = await notificationService.getUnreadCount(userBId);
  assert.strictEqual(unreadB, 1);
});

// 5. Delete Notification & Ownership Enforcement Tests
await test("deleteNotification allows owner to delete, blocks others with 403", async () => {
  const notifB = (await notificationService.getUserNotifications(userBId)).notifications[0];

  // User A tries to delete User B's notification
  await assert.rejects(
    () => notificationService.deleteNotification(notifB._id, userAId),
    (err) => err.statusCode === 403
  );

  // User B deletes their notification
  const result = await notificationService.deleteNotification(notifB._id, userBId);
  assert.strictEqual(result.message, "Notification deleted successfully");

  const listB = await notificationService.getUserNotifications(userBId);
  assert.strictEqual(listB.notifications.length, 0);
});

// 6. REST API Route Protection & Controllers Tests
await test("unauthenticated request to /api/notifications is rejected with 401", async () => {
  const res = await request("GET", "/api/notifications");
  assert.strictEqual(res.status, 401);
});

await test("authenticated user can retrieve notifications via GET /api/notifications", async () => {
  const token = generateToken(userAId);
  const res = await request("GET", "/api/notifications", { token });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.status, "success");
  assert.ok(Array.isArray(res.data.data.notifications));
  assert.ok(res.data.data.pagination);
});

await test("GET /api/notifications/unread-count returns unread count", async () => {
  const token = generateToken(userAId);
  const res = await request("GET", "/api/notifications/unread-count", { token });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.status, "success");
  assert.strictEqual(typeof res.data.data.unreadCount, "number");
});

await test("validator rejects invalid notification identifier with 400", async () => {
  const token = generateToken(userAId);
  const res = await request("PATCH", "/api/notifications/not-an-id/read", { token });
  assert.strictEqual(res.status, 400);
  assert.match(res.data.message, /invalid notification identifier/i);
});

await test("no public POST /api/notifications endpoint exists (server-side only)", async () => {
  const token = generateToken(userAId);
  const res = await request("POST", "/api/notifications", {
    token,
    body: { message: "Test create attempt" },
  });
  // Should return 404 since no POST route is defined
  assert.strictEqual(res.status, 404);
});

// 7. Socket.IO Auto-join user room & Real-time delivery
await test("socket auto-joins personal user room and receives emitToUser events", async () => {
  const socketA = connectSocket(generateToken(userAId));
  const socketB = connectSocket(generateToken(userBId));

  await waitForConnect(socketA);
  await waitForConnect(socketB);

  let receivedB = false;
  socketB.on("test:targeted", () => {
    receivedB = true;
  });

  const eventPromise = waitForEvent(socketA, "test:targeted");
  emitToUser(userAId, "test:targeted", { hello: "Alice" });

  const payload = await eventPromise;
  assert.strictEqual(payload.hello, "Alice");
  assert.strictEqual(receivedB, false); // Bob must not receive Alice's event

  socketA.close();
  socketB.close();
});

// Teardown
socketServer.close();
await new Promise((resolve) => server.close(resolve));

const failed = tests.filter(([, passed]) => !passed);
for (const [name, passed, error] of tests) {
  console.log(
    `  ${passed ? "✅ PASS" : "❌ FAIL"}: ${name}${
      error ? ` (${error.message})` : ""
    }`
  );
}
console.log(
  `\nPHASE 5.1 SUMMARY: ${tests.length - failed.length} passed, ${
    failed.length
  } failed`
);

if (failed.length) {
  process.exitCode = 1;
}
