import ApiError from '../utils/ApiError.js';
import { WORKSPACE_ROLES } from '../models/WorkspaceMember.js';

export const validateCreateWorkspace = (req, res, next) => {
  const { name, description } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return next(new ApiError(400, 'Workspace name must be at least 2 characters long'));
  }

  if (name.trim().length > 50) {
    return next(new ApiError(400, 'Workspace name cannot exceed 50 characters'));
  }

  if (description && (typeof description !== 'string' || description.trim().length > 250)) {
    return next(new ApiError(400, 'Description cannot exceed 250 characters'));
  }

  // Sanitize authority-bearing fields if submitted by client
  delete req.body.createdBy;
  delete req.body.ownerId;
  delete req.body.role;
  delete req.body.platformRole;

  next();
};

export const validateUpdateWorkspace = (req, res, next) => {
  const { name, description } = req.body;

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      return next(new ApiError(400, 'Workspace name must be at least 2 characters long'));
    }
    if (name.trim().length > 50) {
      return next(new ApiError(400, 'Workspace name cannot exceed 50 characters'));
    }
  }

  if (description !== undefined) {
    if (typeof description !== 'string' || description.trim().length > 250) {
      return next(new ApiError(400, 'Description cannot exceed 250 characters'));
    }
  }

  delete req.body.createdBy;
  delete req.body.ownerId;
  delete req.body.role;
  delete req.body.platformRole;

  next();
};

export const validateAddMember = (req, res, next) => {
  const { email, userId, role } = req.body;

  if (!email && !userId) {
    return next(new ApiError(400, 'Member email or user ID is required'));
  }

  if (!role || !Object.values(WORKSPACE_ROLES).includes(role)) {
    return next(
      new ApiError(
        400,
        `Role must be one of: ${Object.values(WORKSPACE_ROLES).join(', ')}`
      )
    );
  }

  next();
};

export const validateUpdateMemberRole = (req, res, next) => {
  const { role } = req.body;

  if (!role || !Object.values(WORKSPACE_ROLES).includes(role)) {
    return next(
      new ApiError(
        400,
        `Role must be one of: ${Object.values(WORKSPACE_ROLES).join(', ')}`
      )
    );
  }

  next();
};

export default {
  validateCreateWorkspace,
  validateUpdateWorkspace,
  validateAddMember,
  validateUpdateMemberRole,
};
