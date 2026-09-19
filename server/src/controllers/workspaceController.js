import workspaceService from '../services/workspaceService.js';

export const createWorkspace = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const workspace = await workspaceService.createWorkspace({
      name,
      description,
      userId: req.user._id,
    });

    res.status(201).json({
      status: 'success',
      message: 'Workspace created successfully',
      data: { workspace },
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await workspaceService.getUserWorkspaces(req.user._id);

    res.status(200).json({
      status: 'success',
      data: { workspaces },
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceById = async (req, res, next) => {
  try {
    const workspace = await workspaceService.getWorkspaceById(
      req.params.workspaceId,
      req.user._id
    );

    res.status(200).json({
      status: 'success',
      data: { workspace },
    });
  } catch (error) {
    next(error);
  }
};

export const updateWorkspace = async (req, res, next) => {
  try {
    const workspace = await workspaceService.updateWorkspace(
      req.params.workspaceId,
      req.body
    );

    res.status(200).json({
      status: 'success',
      message: 'Workspace updated successfully',
      data: { workspace },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWorkspace = async (req, res, next) => {
  try {
    const result = await workspaceService.deleteWorkspace(req.params.workspaceId);

    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceMembers = async (req, res, next) => {
  try {
    const members = await workspaceService.getWorkspaceMembers(req.params.workspaceId);

    res.status(200).json({
      status: 'success',
      data: { members },
    });
  } catch (error) {
    next(error);
  }
};

export const addWorkspaceMember = async (req, res, next) => {
  try {
    const { email, userId, role } = req.body;
    const member = await workspaceService.addWorkspaceMember({
      workspaceId: req.params.workspaceId,
      callerRole: req.workspaceMembership.role,
      email,
      userId,
      role,
    });

    res.status(201).json({
      status: 'success',
      message: 'Member added successfully',
      data: { member },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMemberRole = async (req, res, next) => {
  try {
    const member = await workspaceService.updateMemberRole({
      workspaceId: req.params.workspaceId,
      callerRole: req.workspaceMembership.role,
      targetUserId: req.params.userId,
      newRole: req.body.role,
    });

    res.status(200).json({
      status: 'success',
      message: 'Member role updated successfully',
      data: { member },
    });
  } catch (error) {
    next(error);
  }
};

export const removeWorkspaceMember = async (req, res, next) => {
  try {
    const result = await workspaceService.removeWorkspaceMember({
      workspaceId: req.params.workspaceId,
      callerRole: req.workspaceMembership.role,
      targetUserId: req.params.userId,
    });

    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceMembers,
  addWorkspaceMember,
  updateMemberRole,
  removeWorkspaceMember,
};
