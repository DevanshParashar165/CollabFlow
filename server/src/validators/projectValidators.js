import ApiError from '../utils/ApiError.js';
import { PROJECT_STATUSES } from '../models/Project.js';

const allowedFields = new Set(['name', 'description', 'status']);

const validateProjectBody = (req, next, { partial }) => {
  const body = req.body || {};
  const unknownField = Object.keys(body).find((field) => !allowedFields.has(field));
  if (unknownField) {
    return next(new ApiError(400, `Unexpected project field: ${unknownField}`));
  }

  if (!partial || body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length < 2) {
      return next(new ApiError(400, 'Project name must be at least 2 characters long'));
    }
    if (body.name.trim().length > 100) {
      return next(new ApiError(400, 'Project name cannot exceed 100 characters'));
    }
  }

  if (body.description !== undefined &&
      (typeof body.description !== 'string' || body.description.trim().length > 500)) {
    return next(new ApiError(400, 'Description cannot exceed 500 characters'));
  }

  if (body.status !== undefined && !Object.values(PROJECT_STATUSES).includes(body.status)) {
    return next(new ApiError(400, `Status must be one of: ${Object.values(PROJECT_STATUSES).join(', ')}`));
  }

  next();
};

export const validateCreateProject = (req, res, next) =>
  validateProjectBody(req, next, { partial: false });

export const validateUpdateProject = (req, res, next) =>
  validateProjectBody(req, next, { partial: true });

export default { validateCreateProject, validateUpdateProject };