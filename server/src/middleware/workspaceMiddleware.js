import mongoose from 'mongoose';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import ApiError from '../utils/ApiError.js';

/**
 * Middleware to verify that the authenticated user is an active member of the requested workspace.
 * Attaches `req.workspace` and `req.workspaceMembership` to the request context.
 */
export const requireWorkspaceMember = async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId;

    if (!workspaceId || !mongoose.Types.ObjectId.isValid(workspaceId)) {
      throw new ApiError(400, 'Invalid or missing workspace identifier');
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new ApiError(404, 'Workspace not found');
    }

    const membership = await WorkspaceMember.findOne({
      workspaceId,
      userId: req.user._id,
    });

    if (!membership) {
      throw new ApiError(403, 'Forbidden: You are not a member of this workspace');
    }

    req.workspace = workspace;
    req.workspaceMembership = membership;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * RBAC middleware factory for workspace-scoped operations.
 * Enforces that `req.workspaceMembership.role` matches one of the allowed roles.
 *
 * @param {...string} allowedRoles - e.g. 'OWNER', 'ADMIN'
 */
export const requireWorkspaceRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.workspaceMembership) {
      return next(new ApiError(403, 'Forbidden: Workspace membership required'));
    }

    if (!allowedRoles.includes(req.workspaceMembership.role)) {
      return next(
        new ApiError(
          403,
          `Forbidden: Workspace role '${req.workspaceMembership.role}' lacks permission to perform this action`
        )
      );
    }

    next();
  };
};

export default {
  requireWorkspaceMember,
  requireWorkspaceRoles,
};
