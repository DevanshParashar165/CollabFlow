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
        badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        icon: '📋',
        label: 'Assigned',
      };
    case 'TASK_UNASSIGNED':
      return {
        badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        icon: '📤',
        label: 'Unassigned',
      };
    case 'TASK_STATUS_CHANGED':
      return {
        badgeBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        icon: '🔄',
        label: 'Status',
      };
    case 'COMMENT_ADDED':
      return {
        badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        icon: '💬',
        label: 'Comment',
      };
    case 'COMMENT_MENTION':
      return {
        badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        icon: '@',
        label: 'Mention',
      };
    default:
      return {
        badgeBg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
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
      className={`group relative flex items-start space-x-3 p-3.5 transition-all duration-150 cursor-pointer border-b border-slate-800/60 ${
        isUnread
          ? 'bg-slate-900/60 hover:bg-slate-850/80 border-l-4 border-l-indigo-500'
          : 'bg-transparent hover:bg-slate-900/40 border-l-4 border-l-transparent text-slate-300'
      }`}
    >
      {/* Actor Avatar */}
      <div className="relative shrink-0 mt-0.5">
        <div className="h-8 w-8 rounded-full bg-linear-to-tr from-indigo-600/40 to-violet-600/40 border border-indigo-500/30 text-indigo-200 flex items-center justify-center text-xs font-bold">
          {actorInitials}
        </div>
        <span
          className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border border-slate-900 flex items-center justify-center text-[10px] ${config.badgeBg}`}
        >
          {config.icon}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-6">
        {notification.actorId?.name && (
          <p className="text-[10px] font-medium text-indigo-300 mb-0.5">
            {notification.actorId.name}
          </p>
        )}
        <p className="text-xs text-slate-200 leading-snug line-clamp-2">
          {notification.message}
        </p>
        {notification.metadata?.taskTitle && (
          <p className="text-[10px] text-slate-500 mt-1 truncate">
            Task: {notification.metadata.taskTitle}
          </p>
        )}
        <div className="flex items-center space-x-2 mt-1.5">
          <span className="text-[10px] text-slate-400">
            {formatTimeAgo(notification.createdAt)}
          </span>
          {isUnread && (
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 ring-2 ring-indigo-500/30"></span>
          )}
        </div>
      </div>

      {/* Quick Action: Delete */}
      <div className="absolute right-2.5 top-3.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {isUnread && (
          <button
            onClick={handleMarkRead}
            title="Mark as read"
            aria-label="Mark notification as read"
            className="p-1 rounded text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
          >
            <span className="block h-2 w-2 rounded-full border border-current" />
          </button>
        )}
        <button
          onClick={handleDelete}
          title="Delete notification"
          aria-label="Delete notification"
          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
