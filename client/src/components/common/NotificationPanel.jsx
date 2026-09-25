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
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-800/80 shadow-2xl shadow-black/60 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-semibold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span
              id="notification-unread-count-pill"
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
            >
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            id="notification-mark-all-read-btn"
            onClick={handleMarkAllRead}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center px-4 pt-2.5 border-b border-slate-800/60 bg-slate-950/60">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-2 text-xs font-medium mr-4 transition-colors relative cursor-pointer ${
            activeTab === 'all'
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All
          {activeTab === 'all' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`pb-2 text-xs font-medium transition-colors relative cursor-pointer ${
            activeTab === 'unread'
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Unread ({unreadCount})
          {activeTab === 'unread' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full"></span>
          )}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between text-xs text-red-300">
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
      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/40">
        {loading && notifications.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mb-2"></div>
            <p className="text-xs text-slate-400">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => (
            <NotificationItem key={notif._id} notification={notif} />
          ))
        ) : (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3 text-lg">
              🔔
            </div>
            <p className="text-xs font-medium text-slate-300">
              {activeTab === 'unread'
                ? 'No unread notifications'
                : 'No notifications yet'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[200px] mx-auto">
              We will notify you when someone assigns you tasks or comments.
            </p>
          </div>
        )}

        {/* Load More Button */}
        {pagination.page < pagination.pages && (
          <div className="p-2.5 text-center bg-slate-900/20">
            <button
              id="notification-load-more-btn"
              onClick={handleLoadMore}
              disabled={loading}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium py-1 px-3 rounded hover:bg-slate-800/50 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load older notifications'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
