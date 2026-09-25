import crypto from 'crypto';
import mongoose from 'mongoose';
import Project, { slugify } from '../models/Project.js';
import ApiError from '../utils/ApiError.js';
import activityService from './activityService.js';
import { actorPayload, emitWorkspaceEvent } from '../sockets/emitter.js';

const ensureProjectId = (projectId) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, 'Invalid project identifier');
  }
};

const generateUniqueSlug = async (workspaceId, name) => {
  const baseSlug = slugify(name) || 'project';
  let candidate = baseSlug;
  let attempts = 0;

  while (attempts < 10) {
    const existing = await Project.findOne({ workspaceId, slug: candidate });
    if (!existing) return candidate;
    candidate = `${baseSlug}-${crypto.randomBytes(3).toString('hex')}`;
    attempts += 1;
  }

  return `${baseSlug}-${Date.now()}`;
};

const findProject = async (workspaceId, projectId) => {
  ensureProjectId(projectId);
  const project = await Project.findOne({ _id: projectId, workspaceId })
    .populate('createdBy', 'name email avatar');
  if (!project) throw new ApiError(404, 'Project not found');
  return project;
};

export const createProject = async ({ workspaceId, name, description = '', status, userId, actor }) => {
  const slug = await generateUniqueSlug(workspaceId, name);
  try {
    const project = await Project.create({
      workspaceId,
      name: name.trim(),
      slug,
      description: description ? description.trim() : '',
      status,
      createdBy: userId,
    });
    await activityService.createActivity({ workspaceId, projectId: project._id, actorId: userId, action: 'PROJECT_CREATED', entityType: 'PROJECT', entityId: project._id });
    emitWorkspaceEvent(workspaceId, 'project:created', { projectId: project._id, workspaceId, name: project.name, status: project.status, updatedBy: actorPayload(actor || { _id: userId }) });
    return project;
  } catch (error) {
    if (error.code === 11000) throw new ApiError(409, 'A project with this name already exists in the workspace');
    throw error;
  }
};

export const getWorkspaceProjects = async (workspaceId) =>
  Project.find({ workspaceId }).populate('createdBy', 'name email avatar').sort({ createdAt: -1 });

export const getProjectById = async (workspaceId, projectId) => findProject(workspaceId, projectId);

export const updateProject = async (workspaceId, projectId, updates, actorId) => {
  const project = await findProject(workspaceId, projectId);
  if (updates.name !== undefined) project.name = updates.name.trim();
  if (updates.description !== undefined) project.description = updates.description.trim();
  if (updates.status !== undefined) project.status = updates.status;
  try {
    await project.save();
    if (actorId) await activityService.createActivity({ workspaceId, projectId: project._id, actorId, action: 'PROJECT_UPDATED', entityType: 'PROJECT', entityId: project._id });
    if (actorId) emitWorkspaceEvent(workspaceId, 'project:updated', { projectId: project._id, workspaceId, name: project.name, status: project.status, updatedBy: actorPayload(updates.actor) });
    return project;
  } catch (error) {
    if (error.code === 11000) throw new ApiError(409, 'A project with this name already exists in the workspace');
    throw error;
  }
};

export const deleteProject = async (workspaceId, projectId, actorId, actor) => {
  ensureProjectId(projectId);
  const result = await Project.deleteOne({ _id: projectId, workspaceId });
  if (!result.deletedCount) throw new ApiError(404, 'Project not found');
  if (actorId) await activityService.createActivity({ workspaceId, projectId, actorId, action: 'PROJECT_DELETED', entityType: 'PROJECT', entityId: projectId });
  if (actorId) emitWorkspaceEvent(workspaceId, 'project:deleted', { projectId, workspaceId, updatedBy: actorPayload(actor || { _id: actorId }) });
  return { message: 'Project deleted successfully' };
};

export default {
  createProject,
  getWorkspaceProjects,
  getProjectById,
  updateProject,
  deleteProject,
};