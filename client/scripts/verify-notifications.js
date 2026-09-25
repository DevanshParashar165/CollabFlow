import assert from 'node:assert';
import notificationReducer, {
  notificationReceivedFromSocket,
  unreadCountUpdatedFromSocket,
  toggleNotificationPanel,
  openNotificationPanel,
  closeNotificationPanel,
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../src/features/notifications/notificationSlice.js';
import { API_ENDPOINTS } from '../src/utils/constants.js';

const tests = [];
const test = async (name, fn) => {
  try {
    await fn();
    tests.push([name, true]);
  } catch (error) {
    tests.push([name, false, error]);
  }
};

// ==================== FRONTEND NOTIFICATION TESTS ====================

// 1. Initial State
await test('notificationSlice has correct initial state', () => {
  const state = notificationReducer(undefined, { type: '@@INIT' });
  assert.deepStrictEqual(state.notifications, []);
  assert.strictEqual(state.unreadCount, 0);
  assert.strictEqual(state.loading, false);
  assert.strictEqual(state.error, null);
  assert.strictEqual(state.isOpen, false);
});

// 2. Panel Toggle
await test('panel toggle and close actions update isOpen state', () => {
  let state = notificationReducer(undefined, { type: '@@INIT' });
  state = notificationReducer(state, toggleNotificationPanel());
  assert.strictEqual(state.isOpen, true);

  state = notificationReducer(state, toggleNotificationPanel());
  assert.strictEqual(state.isOpen, false);

  state = notificationReducer(state, openNotificationPanel());
  assert.strictEqual(state.isOpen, true);

  state = notificationReducer(state, closeNotificationPanel());
  assert.strictEqual(state.isOpen, false);
});

// 3. Socket: notification:new & duplicate prevention
await test('notificationReceivedFromSocket prepends notification and increments unread count', () => {
  let state = notificationReducer(undefined, { type: '@@INIT' });
  const notif = {
    _id: 'n1',
    message: 'Alice assigned you a task',
    type: 'TASK_ASSIGNED',
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  state = notificationReducer(state, notificationReceivedFromSocket(notif));
  assert.strictEqual(state.notifications.length, 1);
  assert.strictEqual(state.notifications[0]._id, 'n1');
  assert.strictEqual(state.unreadCount, 1);
  assert.strictEqual(state.pagination.total, 1);
});

await test('notificationReceivedFromSocket prevents duplicate entries on re-delivery', () => {
  let state = notificationReducer(undefined, { type: '@@INIT' });
  const notif = {
    _id: 'n1',
    message: 'Alice assigned you a task',
    type: 'TASK_ASSIGNED',
    isRead: false,
  };

  state = notificationReducer(state, notificationReceivedFromSocket(notif));
  // Receiving the exact same notification again (e.g. from duplicate socket event)
  state = notificationReducer(state, notificationReceivedFromSocket(notif));

  assert.strictEqual(state.notifications.length, 1);
  assert.strictEqual(state.unreadCount, 1); // Not incremented twice
});

// 4. Socket: notification:unreadCount payload handling
await test('unreadCountUpdatedFromSocket updates unread count from both count and unreadCount payloads', () => {
  let state = notificationReducer(undefined, { type: '@@INIT' });

  // Standard payload { count: 5 }
  state = notificationReducer(state, unreadCountUpdatedFromSocket({ count: 5 }));
  assert.strictEqual(state.unreadCount, 5);

  // Alternative payload { unreadCount: 3 }
  state = notificationReducer(state, unreadCountUpdatedFromSocket({ unreadCount: 3 }));
  assert.strictEqual(state.unreadCount, 3);
});

// 5. Async Thunks: fetchNotifications fulfilled
await test('fetchNotifications.fulfilled replaces list on page 1 and updates unreadCount', () => {
  let state = notificationReducer(undefined, { type: '@@INIT' });
  const payload = {
    notifications: [
      { _id: 'n1', isRead: false },
      { _id: 'n2', isRead: true },
    ],
    pagination: { page: 1, limit: 20, total: 2, pages: 1 },
    unreadCount: 1,
    append: false,
  };

  state = notificationReducer(state, fetchNotifications.fulfilled(payload, 'req1', {}));
  assert.strictEqual(state.notifications.length, 2);
  assert.strictEqual(state.unreadCount, 1);
  assert.strictEqual(state.pagination.total, 2);
});

await test('fetchNotifications.fulfilled appends with deduplication when append=true', () => {
  let state = notificationReducer(undefined, { type: '@@INIT' });
  // Initial page 1
  state = notificationReducer(
    state,
    fetchNotifications.fulfilled(
      {
        notifications: [{ _id: 'n1', isRead: false }],
        pagination: { page: 1, limit: 1, total: 2, pages: 2 },
        unreadCount: 1,
        append: false,
      },
      'req1',
      {}
    )
  );

  // Page 2 returns n1 (overlap) and n2 (new)
  state = notificationReducer(
    state,
    fetchNotifications.fulfilled(
      {
        notifications: [
          { _id: 'n1', isRead: false },
          { _id: 'n2', isRead: true },
        ],
        pagination: { page: 2, limit: 1, total: 2, pages: 2 },
        append: true,
      },
      'req2',
      { append: true }
    )
  );

  assert.strictEqual(state.notifications.length, 2); // n1 not duplicated
  assert.strictEqual(state.notifications[0]._id, 'n1');
  assert.strictEqual(state.notifications[1]._id, 'n2');
});

// 6. markNotificationAsRead fulfilled
await test('markNotificationAsRead.fulfilled updates item state and decrements unreadCount', () => {
  let state = notificationReducer(undefined, { type: '@@INIT' });
  state = notificationReducer(
    state,
    fetchNotifications.fulfilled(
      {
        notifications: [
          { _id: 'n1', isRead: false },
          { _id: 'n2', isRead: false },
        ],
        pagination: { page: 1, limit: 20, total: 2, pages: 1 },
        unreadCount: 2,
        append: false,
      },
      'req1',
      {}
    )
  );

  state = notificationReducer(
    state,
    markNotificationAsRead.fulfilled(
      { _id: 'n1', isRead: true, readAt: new Date().toISOString() },
      'req2',
      'n1'
    )
  );

  assert.strictEqual(state.notifications[0].isRead, true);
  assert.ok(state.notifications[0].readAt);
  assert.strictEqual(state.unreadCount, 1);

  // Marking an already-read notification does not decrement below 0
  state = notificationReducer(
    state,
    markNotificationAsRead.fulfilled(
      { _id: 'n1', isRead: true, readAt: new Date().toISOString() },
      'req3',
      'n1'
    )
  );
  assert.strictEqual(state.unreadCount, 1);
});

// 7. markAllNotificationsAsRead fulfilled
await test('markAllNotificationsAsRead.fulfilled sets all items to isRead=true and unreadCount=0', () => {
  let state = notificationReducer(undefined, { type: '@@INIT' });
  state = notificationReducer(
    state,
    fetchNotifications.fulfilled(
      {
        notifications: [
          { _id: 'n1', isRead: false },
          { _id: 'n2', isRead: false },
        ],
        pagination: { page: 1, limit: 20, total: 2, pages: 1 },
        unreadCount: 2,
        append: false,
      },
      'req1',
      {}
    )
  );

  state = notificationReducer(
    state,
    markAllNotificationsAsRead.fulfilled({ modifiedCount: 2 }, 'req2', undefined)
  );

  assert.ok(state.notifications.every((n) => n.isRead));
  assert.strictEqual(state.unreadCount, 0);
});

// 8. deleteNotification fulfilled
await test('deleteNotification.fulfilled removes item and decrements unreadCount if unread', () => {
  let state = notificationReducer(undefined, { type: '@@INIT' });
  state = notificationReducer(
    state,
    fetchNotifications.fulfilled(
      {
        notifications: [
          { _id: 'n1', isRead: false },
          { _id: 'n2', isRead: true },
        ],
        pagination: { page: 1, limit: 20, total: 2, pages: 1 },
        unreadCount: 1,
        append: false,
      },
      'req1',
      {}
    )
  );

  // Deleting unread n1 decrements unreadCount
  state = notificationReducer(state, deleteNotification.fulfilled('n1', 'req2', 'n1'));
  assert.strictEqual(state.notifications.length, 1);
  assert.strictEqual(state.notifications[0]._id, 'n2');
  assert.strictEqual(state.unreadCount, 0);

  // Deleting already-read n2 does not decrement unreadCount below 0
  state = notificationReducer(state, deleteNotification.fulfilled('n2', 'req3', 'n2'));
  assert.strictEqual(state.notifications.length, 0);
  assert.strictEqual(state.unreadCount, 0);
});

// 9. API Endpoints Constant Configuration
await test('API_ENDPOINTS contains correct notification paths', () => {
  assert.strictEqual(API_ENDPOINTS.NOTIFICATIONS, '/notifications');
  assert.strictEqual(API_ENDPOINTS.NOTIFICATION_UNREAD_COUNT, '/notifications/unread-count');
  assert.strictEqual(API_ENDPOINTS.NOTIFICATION_MARK_ALL_READ, '/notifications/read-all');
  assert.strictEqual(API_ENDPOINTS.NOTIFICATION_MARK_READ('abc123'), '/notifications/abc123/read');
  assert.strictEqual(API_ENDPOINTS.NOTIFICATION_BY_ID('abc123'), '/notifications/abc123');
});

// Summary
const failed = tests.filter(([, passed]) => !passed);
for (const [name, passed, error] of tests) {
  console.log(
    `  ${passed ? '✅ PASS' : '❌ FAIL'}: ${name}${
      error ? ` (${error.message})` : ''
    }`
  );
}
console.log(
  `\nFRONTEND NOTIFICATION SUMMARY: ${tests.length - failed.length} passed, ${
    failed.length
  } failed`
);

if (failed.length) {
  globalThis.process.exitCode = 1;
}
