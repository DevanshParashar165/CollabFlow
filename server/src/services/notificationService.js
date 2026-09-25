import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import WorkspaceMember from "../models/WorkspaceMember.js";
import ApiError from "../utils/ApiError.js";
import logger from "../utils/logger.js";
import { emitToUser } from "../sockets/index.js";
import { resolveMentions } from "../utils/mentionParser.js";

const ensureId = (value, label) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ${label} identifier`);
  }
};

const toReferenceId = (value) => value?._id || value;

const pageOptions = (page = 1, limit = 20) => ({
  page: Math.max(1, Number.parseInt(page, 10) || 1),
  limit: Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20)),
});

export const createNotification = async ({
  recipientId,
  workspaceId,
  actorId,
  type,
  entityType,
  entityId,
  taskId = null,
  projectId = null,
  message,
  metadata = {},
}) => {
  recipientId = toReferenceId(recipientId);
  workspaceId = toReferenceId(workspaceId);
  actorId = toReferenceId(actorId);
  entityId = toReferenceId(entityId);
  taskId = toReferenceId(taskId);
  projectId = toReferenceId(projectId);

  logger.debug('Notification creation validated input', {
    recipientId: recipientId?.toString?.() || recipientId,
    workspaceId: workspaceId?.toString?.() || workspaceId,
    actorId: actorId?.toString?.() || actorId,
    entityId: entityId?.toString?.() || entityId,
    taskId: taskId?.toString?.() || taskId || null,
    projectId: projectId?.toString?.() || projectId || null,
    type,
  });
  ensureId(recipientId, "recipient");
  ensureId(workspaceId, "workspace");
  ensureId(actorId, "actor");
  ensureId(entityId, "entity");
  if (taskId) ensureId(taskId, "task");
  if (projectId) ensureId(projectId, "project");

  // Suppress self-notifications
  if (recipientId.toString() === actorId.toString()) {
    return null;
  }

  // Validate that the recipient is a member of the workspace
  const membership = await WorkspaceMember.findOne({
    workspaceId,
    userId: recipientId,
  });
  logger.debug('Notification recipient membership checked', {
    recipientId: recipientId.toString(),
    workspaceId: workspaceId.toString(),
    found: Boolean(membership),
  });
  if (!membership) {
    throw new ApiError(403, "Recipient is not a member of the workspace");
  }

  const notification = await Notification.create({
    recipientId,
    workspaceId,
    actorId,
    type,
    entityType,
    entityId,
    taskId,
    projectId,
    message,
    metadata,
  });
  logger.debug('Notification persisted', {
    notificationId: notification?._id?.toString?.() || notification?._id,
    recipientId: recipientId.toString(),
    taskId: taskId?.toString?.() || taskId || null,
    type,
  });

  // Safe real-time delivery via user socket room
  try {
    const populated = await Notification.findById(notification._id).populate(
      "actorId",
      "name avatar"
    );
    emitToUser(recipientId, "notification:new", populated || notification);

    const unreadCount = await Notification.countDocuments({
      recipientId,
      isRead: false,
    });
    emitToUser(recipientId, "notification:unreadCount", { count: unreadCount, unreadCount });
    emitToUser(recipientId, "notification:unread_count", { count: unreadCount, unreadCount });
  } catch (err) {
    logger.warn(`Failed to emit socket notification to user ${recipientId}: ${err.message}`);
  }

  return notification;
};

/**
 * Safe wrapper to ensure notification errors never break caller operations.
 */
export const safeCreateNotification = async (payload) => {
  try {
    return await createNotification(payload);
  } catch (error) {
    logger.error(`Notification creation failed safely: ${error.message}`, {
      type: payload?.type,
      recipientId: payload?.recipientId?._id?.toString?.() || payload?.recipientId?.toString?.() || payload?.recipientId,
      workspaceId: payload?.workspaceId?.toString?.() || payload?.workspaceId,
      entityId: payload?.entityId?.toString?.() || payload?.entityId,
      taskId: payload?.taskId?.toString?.() || payload?.taskId,
    });
    return null;
  }
};

export const notifyTaskCreated = async ({
  workspaceId,
  task,
  actorId,
  actor,
}) => {
  try {
    const assigneeId = toReferenceId(task?.assignee);
    logger.debug('Task-created notification requested', {
      taskId: task?._id?.toString?.() || task?._id,
      workspaceId: workspaceId?.toString?.() || workspaceId,
      assigneeId: assigneeId?.toString?.() || assigneeId || null,
      actorId: actorId?.toString?.() || actorId,
    });
    if (!assigneeId) return;

    if (assigneeId.toString() === actorId?.toString()) return;

    const actorName = actor?.name || "A team member";

    await safeCreateNotification({
      recipientId: assigneeId,
      workspaceId,
      actorId,
      type: "TASK_ASSIGNED",
      entityType: "TASK",
      entityId: task._id,
      taskId: task._id,
      projectId: task.projectId,
      message: `${actorName} assigned you to task "${task.title}"`,
      metadata: {
        taskTitle: task.title,
        priority: task.priority,
        status: task.status,
      },
    });
  } catch (error) {
    logger.error(`Failed to generate task created notification: ${error.message}`);
  }
};

export const notifyTaskUpdated = async ({
  workspaceId,
  task,
  oldStatus,
  oldAssignee,
  statusChanged,
  assigneeChanged,
  actorId,
  actor,
}) => {
  try {
    const actorName = actor?.name || "A team member";
    const actorStr = actorId?.toString();

    // 1. Task assignment and reassignment
    if (assigneeChanged) {
      const newAssigneeId = task.assignee?._id || task.assignee || null;
      const oldAssigneeId = oldAssignee?._id || oldAssignee || null;

      // Notify previous assignee of unassignment (if different from actor)
      if (oldAssigneeId && oldAssigneeId.toString() !== actorStr) {
        await safeCreateNotification({
          recipientId: oldAssigneeId,
          workspaceId,
          actorId,
          type: "TASK_UNASSIGNED",
          entityType: "TASK",
          entityId: task._id,
          taskId: task._id,
          projectId: task.projectId,
          message: `${actorName} unassigned you from task "${task.title}"`,
          metadata: {
            taskTitle: task.title,
            newAssigneeId: newAssigneeId ? newAssigneeId.toString() : null,
          },
        });
      }

      // Notify new assignee of assignment (if different from actor)
      if (newAssigneeId && newAssigneeId.toString() !== actorStr) {
        await safeCreateNotification({
          recipientId: newAssigneeId,
          workspaceId,
          actorId,
          type: "TASK_ASSIGNED",
          entityType: "TASK",
          entityId: task._id,
          taskId: task._id,
          projectId: task.projectId,
          message: `${actorName} assigned you to task "${task.title}"`,
          metadata: {
            taskTitle: task.title,
            previousAssigneeId: oldAssigneeId ? oldAssigneeId.toString() : null,
          },
        });
      }
    }

    // 2. Status change for assigned tasks
    if (statusChanged && task.assignee) {
      const currentAssigneeId = task.assignee?._id || task.assignee;
      if (currentAssigneeId && currentAssigneeId.toString() !== actorStr) {
        await safeCreateNotification({
          recipientId: currentAssigneeId,
          workspaceId,
          actorId,
          type: "TASK_STATUS_CHANGED",
          entityType: "TASK",
          entityId: task._id,
          taskId: task._id,
          projectId: task.projectId,
          message: `${actorName} changed status of task "${task.title}" to ${task.status}`,
          metadata: {
            taskTitle: task.title,
            oldStatus,
            newStatus: task.status,
          },
        });
      }
    }
  } catch (error) {
    logger.error(`Failed to generate task updated notification: ${error.message}`);
  }
};

export const notifyCommentCreated = async ({
  workspaceId,
  task,
  comment,
  actorId,
  actor,
}) => {
  try {
    const actorName = actor?.name || "A team member";
    const actorStr = actorId?.toString();

    // 1. Resolve mentions from comment content
    const mentionedUsers = await resolveMentions(comment.content, workspaceId);

    // Filter out self-mentions
    const validMentionedUsers = (mentionedUsers || []).filter(
      (u) => u?._id && u._id.toString() !== actorStr
    );

    const mentionedUserIds = new Set(
      validMentionedUsers.map((u) => u._id.toString())
    );

    // Send COMMENT_MENTION to all mentioned users
    for (const mentionedUser of validMentionedUsers) {
      await safeCreateNotification({
        recipientId: mentionedUser._id,
        workspaceId,
        actorId,
        type: "COMMENT_MENTION",
        entityType: "COMMENT",
        entityId: comment._id,
        taskId: task._id,
        projectId: task.projectId,
        message: `${actorName} mentioned you in a comment on "${task.title}"`,
        metadata: {
          commentId: comment._id,
          taskTitle: task.title,
        },
      });
    }

    // 2. Notify task assignee if:
    // - Task has an assignee
    // - Assignee is not the commenter (self-notification suppression)
    // - Assignee was not already mentioned (deduplicate, preferring COMMENT_MENTION)
    const assigneeId = task.assignee?._id || task.assignee;
    if (assigneeId) {
      const assigneeStr = assigneeId.toString();
      if (assigneeStr !== actorStr && !mentionedUserIds.has(assigneeStr)) {
        await safeCreateNotification({
          recipientId: assigneeId,
          workspaceId,
          actorId,
          type: "COMMENT_ADDED",
          entityType: "COMMENT",
          entityId: comment._id,
          taskId: task._id,
          projectId: task.projectId,
          message: `${actorName} commented on task "${task.title}"`,
          metadata: {
            commentId: comment._id,
            taskTitle: task.title,
          },
        });
      }
    }
  } catch (error) {
    logger.error(`Failed to generate comment notifications: ${error.message}`);
  }
};

export const getUserNotifications = async (
  userId,
  { workspaceId = null, isRead = undefined, page = 1, limit = 20 } = {}
) => {
  ensureId(userId, "user");
  const options = pageOptions(page, limit);

  const filter = { recipientId: userId };

  if (workspaceId) {
    ensureId(workspaceId, "workspace");
    filter.workspaceId = workspaceId;
  }

  if (isRead !== undefined && isRead !== null && isRead !== "") {
    filter.isRead = String(isRead) === "true";
  }

  const unreadFilter = {
    recipientId: userId,
    isRead: false,
    ...(workspaceId ? { workspaceId } : {}),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .populate("actorId", "name avatar")
      .sort({ createdAt: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit),
    Notification.countDocuments(filter),
    Notification.countDocuments(unreadFilter),
  ]);

  return {
    notifications,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      pages: Math.ceil(total / options.limit),
    },
    unreadCount,
  };
};

export const getUnreadCount = async (userId, workspaceId = null) => {
  ensureId(userId, "user");
  const filter = { recipientId: userId, isRead: false };

  if (workspaceId) {
    ensureId(workspaceId, "workspace");
    filter.workspaceId = workspaceId;
  }

  const unreadCount = await Notification.countDocuments(filter);
  return unreadCount;
};

export const markAsRead = async (notificationId, userId) => {
  ensureId(notificationId, "notification");
  ensureId(userId, "user");

  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  // Enforce recipient ownership
  if (notification.recipientId.toString() !== userId.toString()) {
    throw new ApiError(403, "Access denied to this notification");
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    try {
      const unreadCount = await Notification.countDocuments({
        recipientId: userId,
        isRead: false,
      });
      emitToUser(userId, "notification:unreadCount", { count: unreadCount, unreadCount });
      emitToUser(userId, "notification:unread_count", { count: unreadCount, unreadCount });
    } catch (_) {}
  }

  return notification;
};

export const markAllAsRead = async (userId, workspaceId = null) => {
  ensureId(userId, "user");
  const filter = { recipientId: userId, isRead: false };

  if (workspaceId) {
    ensureId(workspaceId, "workspace");
    filter.workspaceId = workspaceId;
  }

  const result = await Notification.updateMany(filter, {
    $set: { isRead: true, readAt: new Date() },
  });

  try {
    const unreadCount = await Notification.countDocuments({
      recipientId: userId,
      isRead: false,
    });
    emitToUser(userId, "notification:unreadCount", { count: unreadCount, unreadCount });
    emitToUser(userId, "notification:unread_count", { count: unreadCount, unreadCount });
  } catch (_) {}

  return { modifiedCount: result.modifiedCount };
};

export const deleteNotification = async (notificationId, userId) => {
  ensureId(notificationId, "notification");
  ensureId(userId, "user");

  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  // Enforce recipient ownership
  if (notification.recipientId.toString() !== userId.toString()) {
    throw new ApiError(403, "Access denied to this notification");
  }

  await Notification.deleteOne({ _id: notificationId });

  try {
    const unreadCount = await Notification.countDocuments({
      recipientId: userId,
      isRead: false,
    });
    emitToUser(userId, "notification:unreadCount", { count: unreadCount, unreadCount });
    emitToUser(userId, "notification:unread_count", { count: unreadCount, unreadCount });
  } catch (_) {}

  return { message: "Notification deleted successfully" };
};

export default {
  createNotification,
  safeCreateNotification,
  notifyTaskCreated,
  notifyTaskUpdated,
  notifyCommentCreated,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
