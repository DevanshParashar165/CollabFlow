import mongoose from "mongoose";
import Activity from "../models/Activity.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import ApiError from "../utils/ApiError.js";

const ensureId = (value, label) => {
  if (!mongoose.Types.ObjectId.isValid(value))
    throw new ApiError(400, `Invalid ${label} identifier`);
};

export const createActivity = async ({
  workspaceId,
  projectId = null,
  taskId = null,
  actorId,
  action,
  entityType,
  entityId,
  metadata = {},
}) => {
  return Activity.create({
    workspaceId,
    projectId,
    taskId,
    actorId,
    action,
    entityType,
    entityId,
    metadata,
  });
};

const pageOptions = (page = 1, limit = 20) => ({
  page: Math.max(1, Number.parseInt(page, 10) || 1),
  limit: Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20)),
});

const paginated = async (filter, page, limit) => {
  const options = pageOptions(page, limit);
  const [activities, total] = await Promise.all([
    Activity.find(filter)
      .populate("actorId", "name avatar")
      .sort({ createdAt: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit),
    Activity.countDocuments(filter),
  ]);
  return {
    activities,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      pages: Math.ceil(total / options.limit),
    },
  };
};

export const getWorkspaceActivity = (workspaceId, page, limit) => {
  ensureId(workspaceId, "workspace");
  return paginated({ workspaceId }, page, limit);
};

export const getProjectActivity = async (
  workspaceId,
  projectId,
  page,
  limit,
) => {
  ensureId(projectId, "project");
  const project = await Project.findOne({ _id: projectId, workspaceId });
  if (!project) throw new ApiError(404, "Project not found");
  return paginated({ workspaceId, projectId }, page, limit);
};

export const getTaskActivity = async (workspaceId, taskId, page, limit) => {
  ensureId(taskId, "task");
  const task = await Task.findOne({ _id: taskId, workspaceId });
  if (!task) throw new ApiError(404, "Task not found");
  return paginated({ workspaceId, taskId }, page, limit);
};

export default {
  createActivity,
  getWorkspaceActivity,
  getProjectActivity,
  getTaskActivity,
};
