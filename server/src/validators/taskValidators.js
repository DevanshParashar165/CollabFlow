import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import { TASK_PRIORITIES, TASK_STATUSES } from '../models/Task.js';

const allowedFields = new Set(['title', 'description', 'status', 'priority', 'assignee', 'dueDate']);

const validateTaskBody = (req, next, { partial }) => {
  const body = req.body || {};
  const unknownField = Object.keys(body).find((field) => !allowedFields.has(field));
  if (unknownField) return next(new ApiError(400, `Unexpected task field: ${unknownField}`));

  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim().length < 2) {
      return next(new ApiError(400, 'Task title must be at least 2 characters long'));
    }
    if (body.title.trim().length > 150) return next(new ApiError(400, 'Task title cannot exceed 150 characters'));
  }
  if (body.description !== undefined && (typeof body.description !== 'string' || body.description.trim().length > 2000)) {
    return next(new ApiError(400, 'Task description cannot exceed 2000 characters'));
  }
  if (body.status !== undefined && !Object.values(TASK_STATUSES).includes(body.status)) {
    return next(new ApiError(400, `Status must be one of: ${Object.values(TASK_STATUSES).join(', ')}`));
  }
  if (body.priority !== undefined && !Object.values(TASK_PRIORITIES).includes(body.priority)) {
    return next(new ApiError(400, `Priority must be one of: ${Object.values(TASK_PRIORITIES).join(', ')}`));
  }
  if (body.assignee !== undefined && body.assignee !== null && !mongoose.Types.ObjectId.isValid(body.assignee)) {
    return next(new ApiError(400, 'Invalid assignee identifier'));
  }
  if (body.dueDate !== undefined && body.dueDate !== null && (typeof body.dueDate !== 'string' || Number.isNaN(Date.parse(body.dueDate)))) {
    return next(new ApiError(400, 'Due date must be a valid date'));
  }
  if (req.workspaceMembership?.role === 'MEMBER' && Object.prototype.hasOwnProperty.call(body, 'assignee')) {
    return next(new ApiError(403, 'Forbidden: Members cannot change task assignments'));
  }
  next();
};

export const validateCreateTask = (req, res, next) => validateTaskBody(req, next, { partial: false });
export const validateUpdateTask = (req, res, next) => validateTaskBody(req, next, { partial: true });

export default { validateCreateTask, validateUpdateTask };