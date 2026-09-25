import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import notificationService from './notificationService.js';

const getError = (error) =>
  error.response?.data?.message || error.message || 'Request failed';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await notificationService.listNotifications(params);
      return { ...data, append: Boolean(params.append) };
    } catch (error) {
      return rejectWithValue(getError(error));
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (workspaceId, { rejectWithValue }) => {
    try {
      const count = await notificationService.getUnreadCount(workspaceId);
      return count;
    } catch (error) {
      return rejectWithValue(getError(error));
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markNotificationAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const notification = await notificationService.markAsRead(notificationId);
      return notification;
    } catch (error) {
      return rejectWithValue(getError(error));
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllNotificationsAsRead',
  async (workspaceId, { rejectWithValue }) => {
    try {
      const result = await notificationService.markAllAsRead(workspaceId);
      return result;
    } catch (error) {
      return rejectWithValue(getError(error));
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId, { rejectWithValue }) => {
    try {
      await notificationService.deleteNotification(notificationId);
      return notificationId;
    } catch (error) {
      return rejectWithValue(getError(error));
    }
  }
);

const initialState = {
  notifications: [],
  unreadCount: 0,
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  loading: false,
  countLoading: false,
  error: null,
  isOpen: false,
  loaded: false,
  lastFetchedAt: null,
  listRequestId: null,
  countRequestId: null,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotificationError: (state) => {
      state.error = null;
    },
    toggleNotificationPanel: (state) => {
      state.isOpen = !state.isOpen;
    },
    openNotificationPanel: (state) => {
      state.isOpen = true;
    },
    closeNotificationPanel: (state) => {
      state.isOpen = false;
    },
    resetNotifications: () => initialState,
    notificationReceivedFromSocket: (state, action) => {
      const newNotif = action.payload;
      if (!newNotif || !newNotif._id) return;
      if (!state.notifications.some((n) => n._id === newNotif._id)) {
        state.notifications = [newNotif, ...state.notifications];
        state.unreadCount += 1;
        state.pagination.total += 1;
      }
    },
    unreadCountUpdatedFromSocket: (state, action) => {
      const count = action.payload?.unreadCount ?? action.payload?.count;
      if (typeof count === 'number') {
        state.unreadCount = count;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchNotifications
      .addCase(fetchNotifications.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.listRequestId = action.meta.requestId;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        if (state.listRequestId && state.listRequestId !== action.meta.requestId) return;
        state.loading = false;
        if (action.payload.append) {
          // Append for pagination
          const existingIds = new Set(state.notifications.map((n) => n._id));
          const newItems = (action.payload.notifications || []).filter(
            (n) => !existingIds.has(n._id)
          );
          state.notifications = [...state.notifications, ...newItems];
        } else {
          const fetched = action.payload.notifications || [];
          const fetchedIds = new Set(fetched.map((n) => n._id));
          const liveItems = state.notifications.filter((n) => !fetchedIds.has(n._id));
          state.notifications = [...fetched, ...liveItems].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
        }
        state.pagination = action.payload.pagination || state.pagination;
        if (typeof action.payload.unreadCount === 'number') {
          state.unreadCount = action.payload.unreadCount;
        }
        state.loaded = true;
        state.lastFetchedAt = Date.now();
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        if (state.listRequestId && state.listRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.error = action.payload;
        state.loaded = false;
      })

      // fetchUnreadCount
      .addCase(fetchUnreadCount.pending, (state, action) => {
        state.countLoading = true;
        state.countRequestId = action.meta.requestId;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        if (state.countRequestId && state.countRequestId !== action.meta.requestId) return;
        state.countLoading = false;
        if (typeof action.payload === 'number') {
          state.unreadCount = action.payload;
        }
      })
      .addCase(fetchUnreadCount.rejected, (state, action) => {
        if (!state.countRequestId || state.countRequestId === action.meta.requestId) {
          state.countLoading = false;
        }
      })

      // markNotificationAsRead
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const updated = action.payload;
        if (!updated?._id) return;
        const target = state.notifications.find((n) => n._id === updated._id);
        if (target && !target.isRead) {
          target.isRead = true;
          target.readAt = updated.readAt || new Date().toISOString();
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })

      // markAllNotificationsAsRead
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach((item) => {
          item.isRead = true;
          item.readAt = item.readAt || new Date().toISOString();
        });
        state.unreadCount = 0;
      })

      // deleteNotification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const deletedId = action.payload;
        const target = state.notifications.find((n) => n._id === deletedId);
        if (target && !target.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications = state.notifications.filter(
          (n) => n._id !== deletedId
        );
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      });
  },
});

export const {
  clearNotificationError,
  toggleNotificationPanel,
  openNotificationPanel,
  closeNotificationPanel,
  resetNotifications,
  notificationReceivedFromSocket,
  unreadCountUpdatedFromSocket,
} = notificationSlice.actions;

export default notificationSlice.reducer;
