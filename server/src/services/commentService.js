import mongoose from "mongoose";
import Comment from "../models/Comment.js";
import Task from "../models/Task.js";
import activityService from "./activityService.js";
import ApiError from "../utils/ApiError.js";
import { actorPayload, emitWorkspaceEvent } from "../sockets/emitter.js";

const ensureId = (value, label) => {
  if (!mongoose.Types.ObjectId.isValid(value))
    throw new ApiError(400, `Invalid ${label} identifier`);
};

const getTask = async (workspaceId, taskId) => {
  ensureId(workspaceId, "workspace");
  ensureId(taskId, "task");
  const task = await Task.findOne({ _id: taskId, workspaceId });
  if (!task) throw new ApiError(404, "Task not found");
  return task;
};

const findComment = async (workspaceId, taskId, commentId) => {
  await getTask(workspaceId, taskId);
  ensureId(commentId, "comment");
  const comment = await Comment.findOne({
    _id: commentId,
    workspaceId,
    taskId,
  }).populate("userId", "name avatar");
  if (!comment) throw new ApiError(404, "Comment not found");
  return comment;
};

const canModerate = (role) => role === "OWNER" || role === "ADMIN";
const assertCommentOwnerOrModerator = (comment, actorId, role) => {
  if (
    !canModerate(role) &&
    comment.userId?._id?.toString() !== actorId.toString() &&
    comment.userId?.toString() !== actorId.toString()
  ) {
    throw new ApiError(403, "Forbidden: You can only modify your own comments");
  }
};

export const createComment = async ({
  workspaceId,
  taskId,
  content,
  userId,
  actor,
}) => {
  const task = await getTask(workspaceId, taskId);
  const comment = await Comment.create({
    workspaceId,
    taskId,
    content: content.trim(),
    userId,
  });
  await activityService.createActivity({
    workspaceId,
    projectId: task.projectId,
    taskId,
    actorId: userId,
    action: "COMMENT_CREATED",
    entityType: "COMMENT",
    entityId: comment._id,
  });
  emitWorkspaceEvent(workspaceId, "comment:created", {
    commentId: comment._id,
    taskId,
    workspaceId,
    content: comment.content,
    author: actorPayload(actor || { _id: userId }),
    createdAt: comment.createdAt,
  });
  return Comment.findById(comment._id).populate("userId", "name avatar");
};

export const getTaskComments = async (workspaceId, taskId) => {
  await getTask(workspaceId, taskId);
  return Comment.find({ workspaceId, taskId })
    .populate("userId", "name avatar")
    .sort({ createdAt: 1 });
};

export const updateComment = async ({
  workspaceId,
  taskId,
  commentId,
  content,
  actorId,
  role,
  actor,
}) => {
  const comment = await findComment(workspaceId, taskId, commentId);
  assertCommentOwnerOrModerator(comment, actorId, role);
  comment.content = content.trim();
  await comment.save();
  const task = await getTask(workspaceId, taskId);
  await activityService.createActivity({
    workspaceId,
    projectId: task.projectId,
    taskId,
    actorId,
    action: "COMMENT_UPDATED",
    entityType: "COMMENT",
    entityId: comment._id,
  });
  emitWorkspaceEvent(workspaceId, "comment:updated", {
    commentId,
    taskId,
    workspaceId,
    content: comment.content,
    updatedBy: actorPayload(actor || { _id: actorId }),
    updatedAt: comment.updatedAt,
  });
  return comment;
};

export const deleteComment = async ({
  workspaceId,
  taskId,
  commentId,
  actorId,
  role,
  actor,
}) => {
  const comment = await findComment(workspaceId, taskId, commentId);
  assertCommentOwnerOrModerator(comment, actorId, role);
  const task = await getTask(workspaceId, taskId);
  const result = await Comment.deleteOne({
    _id: commentId,
    workspaceId,
    taskId,
  });
  if (!result.deletedCount) throw new ApiError(404, "Comment not found");
  await activityService.createActivity({
    workspaceId,
    projectId: task.projectId,
    taskId,
    actorId,
    action: "COMMENT_DELETED",
    entityType: "COMMENT",
    entityId: commentId,
  });
  emitWorkspaceEvent(workspaceId, "comment:deleted", {
    commentId,
    taskId,
    workspaceId,
    deletedBy: actorPayload(actor || { _id: actorId }),
  });
  return { message: "Comment deleted successfully" };
};

export default { createComment, getTaskComments, updateComment, deleteComment };
