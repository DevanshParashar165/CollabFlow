import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchNotifications,
  markAllNotificationsAsRead,
  closeNotificationPanel,
} from '../../features/notifications/notificationSlice';
import NotificationItem from './NotificationItem';

export default function NotificationPanel() {
  const dispatch = useDispatch();
  const panelRef = useRef(null);

  const {
    notifications,
    unreadCount,
    pagination,
    loading,
    error,
    isOpen,
    loaded,
    lastFetchedAt,
  } =
    useSelector((state) => state.notifications);

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'

  // Fetch notifications on panel open
  useEffect(() => {
    const isStale = !lastFetchedAt || Date.now() - lastFetchedAt > 30000;
    if (isOpen && (!loaded || isStale) && !loading) {
      dispatch(fetchNotifications({ page: 1, limit: 20 }));
    }
  }, [dispatch, isOpen, lastFetchedAt, loaded, loading]);

  // Click outside listener to auto-close panel
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        !e.target.closest('#navbar-notification-bell')
      ) {
        dispatch(closeNotificationPanel());
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [dispatch, isOpen]);

  if (!isOpen) return null;

  const filteredNotifications =
    activeTab === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      dispatch(markAllNotificationsAsRead());
    }
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.pages && !loading) {
      dispatch(
        fetchNotifications({
          page: pagination.page + 1,
          limit: pagination.limit,
          append: true,
        })
      );
    }
  };

  const handleRetry = () => {
    dispatch(fetchNotifications({ page: 1, limit: 20 }));
  };

  return (
    <div
      ref={panelRef}
      id="notification-dropdown-panel"
      role="dialog"
      aria-label="Notification center"
      className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 animate-in fade-in slide-in-from-top-2 duration-200 sm:w-96"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3.5">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
          {unreadCount > 0 && (
            <span
              id="notification-unread-count-pill"
              className="rounded-full border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700"
            >
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            id="notification-mark-all-read-btn"
            onClick={handleMarkAllRead}
            className="cursor-pointer text-xs font-medium text-indigo-700 transition-colors hover:text-indigo-800"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-100 bg-white px-4 pt-2.5">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-2 text-xs font-medium mr-4 transition-colors relative cursor-pointer ${
            activeTab === 'all'
              ? 'text-slate-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          All
          {activeTab === 'all' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-indigo-600"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`pb-2 text-xs font-medium transition-colors relative cursor-pointer ${
            activeTab === 'unread'
              ? 'text-slate-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Unread ({unreadCount})
          {activeTab === 'unread' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-indigo-600"></span>
          )}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center justify-between border-b border-red-100 bg-red-50 p-3 text-xs text-red-700">
          <span>{error}</span>
          <button
            onClick={handleRetry}
            className="underline font-semibold hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* List */}
      <div className="max-h-95 divide-y divide-slate-100 overflow-y-auto">
        {loading && notifications.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="mb-2 inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
            <p className="text-xs text-slate-500">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => (
            <NotificationItem key={notif._id} notification={notif} />
          ))
        ) : (
          <div className="py-12 px-4 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-lg text-slate-400">
              🔔
            </div>
            <p className="text-xs font-medium text-slate-700">
              {activeTab === 'unread'
                ? 'No unread notifications'
                : 'No notifications yet'}
            </p>
            <p className="mx-auto mt-1 max-w-50 text-[11px] text-slate-500">
              We will notify you when someone assigns you tasks or comments.
            </p>
          </div>
        )}

        {/* Load More Button */}
        {pagination.page < pagination.pages && (
          <div className="bg-slate-50 p-2.5 text-center">
            <button
              id="notification-load-more-btn"
              onClick={handleLoadMore}
              disabled={loading}
              className="rounded px-3 py-1 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-50 hover:text-indigo-800 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load older notifications'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
