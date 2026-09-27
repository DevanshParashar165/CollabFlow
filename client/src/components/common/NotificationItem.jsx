import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  markNotificationAsRead,
  deleteNotification,
  closeNotificationPanel,
} from '../../features/notifications/notificationSlice';

const formatTimeAgo = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getTypeConfig = (type) => {
  switch (type) {
    case 'TASK_ASSIGNED':
      return {
        badgeBg: 'bg-purple-50 text-purple-700 border-purple-100',
        icon: '📋',
        label: 'Assigned',
      };
    case 'TASK_UNASSIGNED':
      return {
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-100',
        icon: '📤',
        label: 'Unassigned',
      };
    case 'TASK_STATUS_CHANGED':
      return {
        badgeBg: 'bg-sky-50 text-sky-700 border-sky-100',
        icon: '🔄',
        label: 'Status',
      };
    case 'COMMENT_ADDED':
      return {
        badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        icon: '💬',
        label: 'Comment',
      };
    case 'COMMENT_MENTION':
      return {
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        icon: '@',
        label: 'Mention',
      };
    default:
      return {
        badgeBg: 'bg-slate-100 text-slate-600 border-slate-200',
        icon: '🔔',
        label: 'Notification',
      };
  }
};

export default function NotificationItem({ notification }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isUnread = !notification.isRead;
  const config = getTypeConfig(notification.type);
  const actorName = notification.actorId?.name || 'A team member';
  const actorInitials = actorName[0]?.toUpperCase() || 'U';

  const handleMarkRead = async (e) => {
    e.stopPropagation();
    if (isUnread) await dispatch(markNotificationAsRead(notification._id));
  };

  const handleClick = async (e) => {
    // If clicking delete button, don't navigate
    if (e.target.closest('button')) return;

    if (isUnread) {
      await dispatch(markNotificationAsRead(notification._id));
    }

    dispatch(closeNotificationPanel());

    if (notification.workspaceId && notification.projectId && notification.taskId) {
      navigate(
        `/workspaces/${notification.workspaceId}/projects/${notification.projectId}/tasks/${notification.taskId}`
      );
    } else if (notification.workspaceId && notification.projectId) {
      navigate(
        `/workspaces/${notification.workspaceId}/projects/${notification.projectId}`
      );
    } else if (notification.workspaceId) {
      navigate(`/workspaces/${notification.workspaceId}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    dispatch(deleteNotification(notification._id));
  };

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${isUnread ? 'Unread ' : ''}${notification.message}`}
      className={`group relative flex cursor-pointer items-start space-x-3 border-b border-slate-100 p-3.5 transition-all duration-150 ${
        isUnread
          ? 'border-l-4 border-l-indigo-500 bg-indigo-50/40 hover:bg-indigo-50'
          : 'border-l-4 border-l-transparent bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      {/* Actor Avatar */}
      <div className="relative shrink-0 mt-0.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-xs font-bold text-indigo-700">
          {actorInitials}
        </div>
        <span
          className={`absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-white text-[10px] ${config.badgeBg}`}
        >
          {config.icon}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-6">
        {notification.actorId?.name && (
          <p className="mb-0.5 text-[10px] font-medium text-indigo-700">
            {notification.actorId.name}
          </p>
        )}
        <p className="line-clamp-2 text-xs leading-snug text-slate-800">
          {notification.message}
        </p>
        {notification.metadata?.taskTitle && (
          <p className="mt-1 truncate text-[10px] text-slate-500">
            Task: {notification.metadata.taskTitle}
          </p>
        )}
        <div className="mt-1.5 flex items-center space-x-2">
          <span className="text-[10px] text-slate-500">
            {formatTimeAgo(notification.createdAt)}
          </span>
          {isUnread && (
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 ring-2 ring-indigo-100"></span>
          )}
        </div>
      </div>

      {/* Quick Action: Delete */}
      <div className="absolute right-2.5 top-3.5 opacity-0 transition-opacity group-hover:opacity-100">
        {isUnread && (
          <button
            onClick={handleMarkRead}
            title="Mark as read"
            aria-label="Mark notification as read"
            className="rounded p-1 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
          >
            <span className="block h-2 w-2 rounded-full border border-current" />
          </button>
        )}
        <button
          onClick={handleDelete}
          title="Delete notification"
          aria-label="Delete notification"
            className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
