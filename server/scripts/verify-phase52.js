import assert from "node:assert";
import mongoose from "mongoose";
import User from "../src/models/User.js";
import WorkspaceMember from "../src/models/WorkspaceMember.js";
import Project from "../src/models/Project.js";
import Task from "../src/models/Task.js";
import Comment from "../src/models/Comment.js";
import Activity from "../src/models/Activity.js";
import Notification from "../src/models/Notification.js";
import { parseMentions, findMatchingUser, resolveMentions } from "../src/utils/mentionParser.js";
import taskService from "../src/services/taskService.js";
import commentService from "../src/services/commentService.js";
import notificationService from "../src/services/notificationService.js";

// Mock ObjectIds
const workspaceId = new mongoose.Types.ObjectId();
const otherWorkspaceId = new mongoose.Types.ObjectId();
const projectId = new mongoose.Types.ObjectId();

const aliceId = new mongoose.Types.ObjectId();
const bobId = new mongoose.Types.ObjectId();
const charlieId = new mongoose.Types.ObjectId();
const daveId = new mongoose.Types.ObjectId(); // Same first name as another user for ambiguity test
const dave2Id = new mongoose.Types.ObjectId(); // Second Dave
const outsiderId = new mongoose.Types.ObjectId();

const users = new Map([
  [aliceId.toString(), { _id: aliceId, name: "Alice Smith", email: "alice@test.com", avatar: "a.png" }],
  [bobId.toString(), { _id: bobId, name: "Bob Builder", email: "bob@test.com", avatar: "b.png" }],
  [charlieId.toString(), { _id: charlieId, name: "Charlie", email: "charlie@test.com", avatar: "c.png" }],
  [daveId.toString(), { _id: daveId, name: "Dave Miller", email: "dave.miller@test.com", avatar: "d1.png" }],
  [dave2Id.toString(), { _id: dave2Id, name: "Dave Wilson", email: "dave.wilson@test.com", avatar: "d2.png" }],
  [outsiderId.toString(), { _id: outsiderId, name: "Outsider User", email: "outsider@test.com", avatar: "o.png" }],
]);

const workspaceMembers = new Set([
  aliceId.toString(),
  bobId.toString(),
  charlieId.toString(),
  daveId.toString(),
  dave2Id.toString(),
]);

const tasks = new Map();
const comments = new Map();
const notifications = [];
const activities = [];

// Wire mocks
User.findById = async (id) => users.get(id?.toString()) || null;

Project.findOne = async ({ _id, workspaceId: wsId }) => {
  if (_id?.toString() === projectId.toString() && wsId?.toString() === workspaceId.toString()) {
    return { _id: projectId, workspaceId };
  }
  return null;
};

WorkspaceMember.findOne = async ({ workspaceId: wsId, userId }) => {
  if (wsId?.toString() === workspaceId.toString() && workspaceMembers.has(userId?.toString())) {
    return { workspaceId: wsId, userId, role: "MEMBER" };
  }
  return null;
};

WorkspaceMember.find = ({ workspaceId: wsId }) => {
  const memberDocs = [...workspaceMembers].map((uid) => ({
    workspaceId: wsId,
    userId: users.get(uid),
  }));
  return {
    populate: async () => memberDocs,
    then: (resolve) => resolve(memberDocs),
  };
};

Task.create = async (doc) => {
  const _id = new mongoose.Types.ObjectId();
  const task = {
    ...doc,
    _id,
    save: async function () {
      tasks.set(this._id.toString(), { ...this });
      return this;
    },
  };
  tasks.set(_id.toString(), task);
  return task;
};

const populateTaskDoc = (t) => {
  if (!t) return null;
  const clone = { ...t };
  clone.assignee = t.assignee ? users.get(t.assignee.toString()) || t.assignee : null;
  clone.createdBy = t.createdBy ? users.get(t.createdBy.toString()) || t.createdBy : null;
  return clone;
};

Task.findOne = (query) => {
  const t = tasks.get(query._id?.toString());
  const found = t && t.workspaceId?.toString() === query.workspaceId?.toString() ? t : null;
  return {
    populate: () => ({
      populate: () => Promise.resolve(populateTaskDoc(found)),
    }),
    then: (resolve) => resolve(populateTaskDoc(found)),
  };
};

Comment.create = async (doc) => {
  const _id = new mongoose.Types.ObjectId();
  const c = { ...doc, _id, createdAt: new Date() };
  comments.set(_id.toString(), c);
  return c;
};

Comment.findById = (id) => ({
  populate: async () => {
    const c = comments.get(id?.toString());
    if (!c) return null;
    return { ...c, userId: users.get(c.userId?.toString()) || c.userId };
  },
});

Activity.create = async (doc) => {
  activities.push(doc);
  return doc;
};

Notification.create = async (doc) => {
  const _id = new mongoose.Types.ObjectId();
  const notif = { ...doc, _id, isRead: false, createdAt: new Date() };
  notifications.push(notif);
  return notif;
};

Notification.findById = (id) => ({
  populate: async () => {
    const n = notifications.find((x) => x._id.toString() === id?.toString());
    if (!n) return null;
    const actor = users.get(n.actorId?.toString());
    return { ...n, actorId: actor || n.actorId };
  },
});

Notification.countDocuments = async () => notifications.filter((n) => !n.isRead).length;

const tests = [];
const test = async (name, fn) => {
  try {
    await fn();
    tests.push([name, true]);
  } catch (error) {
    tests.push([name, false, error]);
  }
};

// ==================== TEST SUITE ====================

// 1. Mention Parser Unit Tests
await test("parseMentions extracts handles, quoted full names, and emails", () => {
  const text = 'Hello @Charlie, did you talk to @"Alice Smith" or @bob@test.com? Check with @dave.miller!';
  const parsed = parseMentions(text);
  assert.deepStrictEqual(parsed, ["Charlie", "Alice Smith", "bob@test.com", "dave.miller"]);
});

await test("findMatchingUser resolves unambiguous full names and single word names", () => {
  const userList = [...users.values()];
  const charlieMatch = findMatchingUser("Charlie", userList);
  assert.strictEqual(charlieMatch._id.toString(), charlieId.toString());

  const aliceMatch = findMatchingUser("Alice Smith", userList);
  assert.strictEqual(aliceMatch._id.toString(), aliceId.toString());

  const bobEmailMatch = findMatchingUser("bob@test.com", userList);
  assert.strictEqual(bobEmailMatch._id.toString(), bobId.toString());
});

await test("findMatchingUser does not resolve ambiguous display names", () => {
  const userList = [...users.values()];
  // Dave Miller and Dave Wilson both share the first name "Dave"
  const ambiguousMatch = findMatchingUser("Dave", userList);
  assert.strictEqual(ambiguousMatch, null); // Ambiguous!

  // But exact full name or email DOES resolve
  const exactDave = findMatchingUser("Dave Miller", userList);
  assert.strictEqual(exactDave._id.toString(), daveId.toString());

  const emailDave = findMatchingUser("dave.wilson@test.com", userList);
  assert.strictEqual(emailDave._id.toString(), dave2Id.toString());
});

await test("resolveMentions ignores non-members and returns unique workspace users", async () => {
  const content = 'Hey @Charlie, @Outsider User and @"Alice Smith"! Also @Charlie again.';
  const resolved = await resolveMentions(content, workspaceId);

  const resolvedIds = resolved.map((u) => u._id.toString());
  assert.ok(resolvedIds.includes(charlieId.toString()));
  assert.ok(resolvedIds.includes(aliceId.toString()));
  assert.ok(!resolvedIds.includes(outsiderId.toString())); // Non-member ignored
  assert.strictEqual(resolved.length, 2); // Charlie is deduplicated
});

// 2. Task Creation with Assignee
await test("task creation with an assignee generates TASK_ASSIGNED notification", async () => {
  notifications.length = 0;
  const task = await taskService.createTask({
    workspaceId,
    projectId,
    title: "Feature A",
    description: "Build feature A",
    status: "TODO",
    priority: "HIGH",
    assignee: bobId,
    dueDate: null,
    userId: aliceId,
    actor: users.get(aliceId.toString()),
  });

  assert.strictEqual(notifications.length, 1);
  const n = notifications[0];
  assert.strictEqual(n.recipientId.toString(), bobId.toString());
  assert.strictEqual(n.taskId.toString(), task._id.toString());
  assert.strictEqual(n.entityId.toString(), task._id.toString());
  assert.strictEqual(n.type, "TASK_ASSIGNED");
  assert.strictEqual(n.entityType, "TASK");
  assert.strictEqual(n.actorId.toString(), aliceId.toString());
  assert.match(n.message, /Alice Smith assigned you to task "Feature A"/i);
});

await test("task creation with self-assignee suppresses notification", async () => {
  notifications.length = 0;
  await taskService.createTask({
    workspaceId,
    projectId,
    title: "Self Task",
    status: "TODO",
    priority: "MEDIUM",
    assignee: aliceId, // Assigned to self
    userId: aliceId,
    actor: users.get(aliceId.toString()),
  });

  assert.strictEqual(notifications.length, 0); // No self-notification
});

// 3. Task Assignment & Reassignment
await test("task reassignment notifies new assignee (TASK_ASSIGNED) and old assignee (TASK_UNASSIGNED)", async () => {
  notifications.length = 0;
  // Create task assigned to Bob
  const created = await taskService.createTask({
    workspaceId,
    projectId,
    title: "Reassign Task",
    status: "TODO",
    priority: "MEDIUM",
    assignee: bobId,
    userId: aliceId,
    actor: users.get(aliceId.toString()),
  });

  notifications.length = 0; // Clear initial creation notification

  // Reassign task from Bob to Charlie
  await taskService.updateTask(
    workspaceId,
    projectId,
    created._id,
    { assignee: charlieId },
    aliceId,
    users.get(aliceId.toString())
  );

  assert.strictEqual(notifications.length, 2);

  const unassigned = notifications.find((n) => n.type === "TASK_UNASSIGNED");
  const assigned = notifications.find((n) => n.type === "TASK_ASSIGNED");

  assert.ok(unassigned);
  assert.strictEqual(unassigned.recipientId.toString(), bobId.toString());
  assert.match(unassigned.message, /unassigned you from task/i);

  assert.ok(assigned);
  assert.strictEqual(assigned.recipientId.toString(), charlieId.toString());
  assert.match(assigned.message, /assigned you to task/i);
});

await test("unassigning a task notifies previous assignee of TASK_UNASSIGNED", async () => {
  notifications.length = 0;
  const created = await taskService.createTask({
    workspaceId,
    projectId,
    title: "Unassign Task",
    status: "TODO",
    priority: "MEDIUM",
    assignee: charlieId,
    userId: aliceId,
    actor: users.get(aliceId.toString()),
  });

  notifications.length = 0;

  // Set assignee to null
  await taskService.updateTask(
    workspaceId,
    projectId,
    created._id,
    { assignee: null },
    aliceId,
    users.get(aliceId.toString())
  );

  assert.strictEqual(notifications.length, 1);
  assert.strictEqual(notifications[0].type, "TASK_UNASSIGNED");
  assert.strictEqual(notifications[0].recipientId.toString(), charlieId.toString());
});

await test("self-unassigning suppresses TASK_UNASSIGNED notification to actor", async () => {
  notifications.length = 0;
  const created = await taskService.createTask({
    workspaceId,
    projectId,
    title: "Self Unassign",
    status: "TODO",
    priority: "MEDIUM",
    assignee: charlieId,
    userId: aliceId,
    actor: users.get(aliceId.toString()),
  });

  notifications.length = 0;

  // Charlie unassigns himself
  await taskService.updateTask(
    workspaceId,
    projectId,
    created._id,
    { assignee: null },
    charlieId,
    users.get(charlieId.toString())
  );

  assert.strictEqual(notifications.length, 0); // Self-action suppressed
});

// 4. Status Changes for Assigned Tasks
await test("status change on assigned task notifies assignee with TASK_STATUS_CHANGED", async () => {
  notifications.length = 0;
  const created = await taskService.createTask({
    workspaceId,
    projectId,
    title: "Status Task",
    status: "TODO",
    priority: "MEDIUM",
    assignee: bobId,
    userId: aliceId,
    actor: users.get(aliceId.toString()),
  });

  notifications.length = 0;

  // Alice moves Bob's task to IN_PROGRESS
  await taskService.updateTask(
    workspaceId,
    projectId,
    created._id,
    { status: "IN_PROGRESS" },
    aliceId,
    users.get(aliceId.toString())
  );

  assert.strictEqual(notifications.length, 1);
  const n = notifications[0];
  assert.strictEqual(n.type, "TASK_STATUS_CHANGED");
  assert.strictEqual(n.recipientId.toString(), bobId.toString());
  assert.strictEqual(n.metadata.newStatus, "IN_PROGRESS");
});

await test("status change by assignee on own task does NOT notify self", async () => {
  notifications.length = 0;
  const created = await taskService.createTask({
    workspaceId,
    projectId,
    title: "Status Own Task",
    status: "TODO",
    priority: "MEDIUM",
    assignee: bobId,
    userId: aliceId,
    actor: users.get(aliceId.toString()),
  });

  notifications.length = 0;

  // Bob updates his own task status
  await taskService.updateTask(
    workspaceId,
    projectId,
    created._id,
    { status: "DONE" },
    bobId,
    users.get(bobId.toString())
  );

  assert.strictEqual(notifications.length, 0); // Bob doesn't get notified for own status change
});

// 5. Comments & Deduplication with @Mentions
await test("comment on assigned task notifies assignee with COMMENT_ADDED", async () => {
  notifications.length = 0;
  const task = await taskService.createTask({
    workspaceId,
    projectId,
    title: "Comment Task",
    status: "TODO",
    priority: "MEDIUM",
    assignee: bobId,
    userId: aliceId,
    actor: users.get(aliceId.toString()),
  });

  notifications.length = 0;

  // Alice comments on the task
  await commentService.createComment({
    workspaceId,
    taskId: task._id,
    content: "Please review the PR",
    userId: aliceId,
    actor: users.get(aliceId.toString()),
  });

  assert.strictEqual(notifications.length, 1);
  assert.strictEqual(notifications[0].type, "COMMENT_ADDED");
  assert.strictEqual(notifications[0].recipientId.toString(), bobId.toString());
});

await test("comment with @mention notifies mentioned user with COMMENT_MENTION", async () => {
  notifications.length = 0;
  const task = await taskService.createTask({
    workspaceId,
    projectId,
    title: "Mention Task",
    status: "TODO",
    priority: "MEDIUM",
    assignee: null, // Unassigned
    userId: aliceId,
    actor: users.get(aliceId.toString()),
  });

  notifications.length = 0;

  // Alice comments mentioning Charlie
  await commentService.createComment({
    workspaceId,
    taskId: task._id,
    content: "Hey @Charlie can you take a look?",
    userId: aliceId,
    actor: users.get(aliceId.toString()),
  });

  assert.strictEqual(notifications.length, 1);
  assert.strictEqual(notifications[0].type, "COMMENT_MENTION");
  assert.strictEqual(notifications[0].recipientId.toString(), charlieId.toString());
});

await test("deduplication: when task assignee is also @mentioned, prefer COMMENT_MENTION (no duplicate)", async () => {
  notifications.length = 0;
  const task = await taskService.createTask({
    workspaceId,
    projectId,
    title: "Dedup Task",
    status: "TODO",
    priority: "MEDIUM",
    assignee: bobId, // Bob is assignee
    userId: aliceId,
    actor: users.get(aliceId.toString()),
  });

  notifications.length = 0;

  // Alice comments mentioning Bob: Bob is both assignee and mentioned user
  await commentService.createComment({
    workspaceId,
    taskId: task._id,
    content: 'Hey @"Bob Builder", urgent fix needed!',
    userId: aliceId,
    actor: users.get(aliceId.toString()),
  });

  // Bob MUST receive only ONE notification, and it MUST be COMMENT_MENTION
  assert.strictEqual(notifications.length, 1);
  assert.strictEqual(notifications[0].recipientId.toString(), bobId.toString());
  assert.strictEqual(notifications[0].type, "COMMENT_MENTION");
});

await test("commenter mentioning self does not receive self-notification", async () => {
  notifications.length = 0;
  const task = await taskService.createTask({
    workspaceId,
    projectId,
    title: "Self Mention Task",
    status: "TODO",
    priority: "MEDIUM",
    assignee: bobId,
    userId: aliceId,
    actor: users.get(aliceId.toString()),
  });

  notifications.length = 0;

  // Alice comments mentioning herself and Bob
  await commentService.createComment({
    workspaceId,
    taskId: task._id,
    content: 'Notes for @"Alice Smith" and @bob@test.com',
    userId: aliceId,
    actor: users.get(aliceId.toString()),
  });

  // Only Bob should be notified (as COMMENT_MENTION), Alice should not receive self-mention
  assert.strictEqual(notifications.length, 1);
  assert.strictEqual(notifications[0].recipientId.toString(), bobId.toString());
  assert.strictEqual(notifications[0].type, "COMMENT_MENTION");
});

await test("assignee commenting on own task does not receive COMMENT_ADDED", async () => {
  notifications.length = 0;
  const task = await taskService.createTask({
    workspaceId,
    projectId,
    title: "Assignee Comment Task",
    status: "TODO",
    priority: "MEDIUM",
    assignee: bobId,
    userId: aliceId,
    actor: users.get(aliceId.toString()),
  });

  notifications.length = 0;

  // Bob comments on his own assigned task without mentioning anyone
  await commentService.createComment({
    workspaceId,
    taskId: task._id,
    content: "Working on it now",
    userId: bobId,
    actor: users.get(bobId.toString()),
  });

  assert.strictEqual(notifications.length, 0); // No self-notification
});

// 6. Resilience: Safe Notification Failure
await test("notification failures do not break successful task or comment operations", async () => {
  const originalCreate = Notification.create;
  Notification.create = async () => {
    throw new Error("Simulated database failure during notification write");
  };

  // Task creation should succeed even if notification fails
  const task = await taskService.createTask({
    workspaceId,
    projectId,
    title: "Resilient Task",
    status: "TODO",
    priority: "MEDIUM",
    assignee: bobId,
    userId: aliceId,
    actor: users.get(aliceId.toString()),
  });
  assert.ok(task._id);

  // Comment creation should succeed even if notification fails
  const comment = await commentService.createComment({
    workspaceId,
    taskId: task._id,
    content: "Resilient comment",
    userId: aliceId,
    actor: users.get(aliceId.toString()),
  });
  assert.ok(comment._id);

  Notification.create = originalCreate;
});

// Summary
const failed = tests.filter(([, passed]) => !passed);
for (const [name, passed, error] of tests) {
  console.log(
    `  ${passed ? "✅ PASS" : "❌ FAIL"}: ${name}${
      error ? ` (${error.message})` : ""
    }`
  );
}
console.log(
  `\nPHASE 5.2 SUMMARY: ${tests.length - failed.length} passed, ${
    failed.length
  } failed`
);

if (failed.length) {
  process.exitCode = 1;
}
