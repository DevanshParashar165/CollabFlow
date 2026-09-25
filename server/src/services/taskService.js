import mongoose from 'mongoose';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import ApiError from '../utils/ApiError.js';
import activityService from './activityService.js';
import { actorPayload, emitWorkspaceEvent } from '../sockets/emitter.js';

const ensureId = (value, label) => {
  if (!mongoose.Types.ObjectId.isValid(value)) throw new ApiError(400, `Invalid ${label} identifier`);
};

const getProjectInWorkspace = async (workspaceId, projectId) => {
  ensureId(workspaceId, 'workspace');
  ensureId(projectId, 'project');
  const project = await Project.findOne({ _id: projectId, workspaceId });
  if (!project) throw new ApiError(404, 'Project not found');
  return project;
};

const validateAssignee = async (workspaceId, assignee) => {
  if (assignee === undefined || assignee === null || assignee === '') return null;
  ensureId(assignee, 'assignee');
  const membership = await WorkspaceMember.findOne({ workspaceId, userId: assignee });
  if (!membership) throw new ApiError(400, 'Assignee must be a member of this workspace');
  return assignee;
};

const populateTask = (query) => query
  .populate('assignee', 'name email avatar')
  .populate('createdBy', 'name email avatar');

const findTask = async (workspaceId, projectId, taskId) => {
  await getProjectInWorkspace(workspaceId, projectId);
  ensureId(taskId, 'task');
  const task = await populateTask(Task.findOne({ _id: taskId, workspaceId, projectId }));
  if (!task) throw new ApiError(404, 'Task not found');
  return task;
};

export const createTask = async ({ workspaceId, projectId, title, description = '', status, priority, assignee, dueDate, userId, actor }) => {
  await getProjectInWorkspace(workspaceId, projectId);
  const validatedAssignee = await validateAssignee(workspaceId, assignee);
  const task = await Task.create({
    workspaceId,
    projectId,
    title: title.trim(),
    description: description ? description.trim() : '',
    status,
    priority,
    assignee: validatedAssignee,
    dueDate: dueDate || null,
    createdBy: userId,
  });
  await activityService.createActivity({ workspaceId, projectId, taskId: task._id, actorId: userId, action: 'TASK_CREATED', entityType: 'TASK', entityId: task._id });
  emitWorkspaceEvent(workspaceId, 'task:created', { taskId: task._id, projectId, workspaceId, title: task.title, status: task.status, priority: task.priority, updatedBy: actorPayload(actor || { _id: userId }) });
  return findTask(workspaceId, projectId, task._id);
};

export const getProjectTasks = async (workspaceId, projectId) => {
  await getProjectInWorkspace(workspaceId, projectId);
  return populateTask(Task.find({ workspaceId, projectId }).sort({ createdAt: -1 }));
};

export const getTaskById = async (workspaceId, projectId, taskId) => findTask(workspaceId, projectId, taskId);

export const updateTask = async (workspaceId, projectId, taskId, updates, actorId, actor) => {
  const task = await findTask(workspaceId, projectId, taskId);
  const oldStatus = task.status;
  const oldAssignee = task.assignee?._id || task.assignee || null;
  if (updates.title !== undefined) task.title = updates.title.trim();
  if (updates.description !== undefined) task.description = updates.description.trim();
  if (updates.status !== undefined) task.status = updates.status;
  if (updates.priority !== undefined) task.priority = updates.priority;
  if (updates.dueDate !== undefined) task.dueDate = updates.dueDate || null;
  if (Object.prototype.hasOwnProperty.call(updates, 'assignee')) {
    task.assignee = await validateAssignee(workspaceId, updates.assignee);
  }
  await task.save();
  if (actorId) {
    const statusChanged = updates.status !== undefined && oldStatus !== task.status;
    const assigneeChanged = Object.prototype.hasOwnProperty.call(updates, 'assignee') && String(oldAssignee || '') !== String(task.assignee || '');
    if (statusChanged) await activityService.createActivity({ workspaceId, projectId, taskId, actorId, action: 'TASK_STATUS_CHANGED', entityType: 'TASK', entityId: taskId, metadata: { oldStatus, newStatus: task.status } });
    if (assigneeChanged) await activityService.createActivity({ workspaceId, projectId, taskId, actorId, action: 'TASK_ASSIGNED', entityType: 'TASK', entityId: taskId, metadata: { assigneeId: task.assignee || null } });
    if (!statusChanged && !assigneeChanged) await activityService.createActivity({ workspaceId, projectId, taskId, actorId, action: 'TASK_UPDATED', entityType: 'TASK', entityId: taskId });
    const updatedBy = actorPayload(actor || { _id: actorId });
    if (statusChanged) emitWorkspaceEvent(workspaceId, 'task:statusChanged', { taskId, projectId, workspaceId, oldStatus, newStatus: task.status, updatedBy });
    if (assigneeChanged) emitWorkspaceEvent(workspaceId, 'task:assigned', { taskId, projectId, workspaceId, previousAssignee: oldAssignee, newAssignee: task.assignee || null, updatedBy });
    if (!statusChanged && !assigneeChanged) emitWorkspaceEvent(workspaceId, 'task:updated', { taskId, projectId, workspaceId, title: task.title, description: task.description, priority: task.priority, dueDate: task.dueDate, updatedBy });
  }
  return task;
};

export const deleteTask = async (workspaceId, projectId, taskId, actorId, actor) => {
  await getProjectInWorkspace(workspaceId, projectId);
  ensureId(taskId, 'task');
  const result = await Task.deleteOne({ _id: taskId, workspaceId, projectId });
  if (!result.deletedCount) throw new ApiError(404, 'Task not found');
  if (actorId) await activityService.createActivity({ workspaceId, projectId, taskId, actorId, action: 'TASK_DELETED', entityType: 'TASK', entityId: taskId });
  if (actorId) emitWorkspaceEvent(workspaceId, 'task:deleted', { taskId, projectId, workspaceId, updatedBy: actorPayload(actor || { _id: actorId }) });
  return { message: 'Task deleted successfully' };
};

export default { createTask, getProjectTasks, getTaskById, updateTask, deleteTask };