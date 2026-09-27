import { useSelector, useDispatch } from 'react-redux';
import { toggleNotificationPanel } from '../../features/notifications/notificationSlice';
import NotificationPanel from './NotificationPanel';

export default function NotificationBell() {
  const dispatch = useDispatch();
  const { unreadCount, isOpen } = useSelector((state) => state.notifications);

  const handleToggle = () => {
    dispatch(toggleNotificationPanel());
  };

  return (
    <div className="relative">
      <button
        id="navbar-notification-bell"
        onClick={handleToggle}
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-controls="notification-dropdown-panel"
        title="Notifications"
        className={`relative p-2 rounded-lg transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        {/* Bell SVG */}
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge Indicator */}
        {unreadCount > 0 && (
          <span
            id="notification-badge"
            className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-indigo-600 px-1 text-[10px] font-bold text-white"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <NotificationPanel />
    </div>
  );
}
