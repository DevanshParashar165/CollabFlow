import mongoose from 'mongoose';
import { z } from 'zod';
import { TASK_PRIORITIES } from '../models/Task.js';
import ApiError from '../utils/ApiError.js';

export const taskSuggestionSchema = z.object({
  title: z.string().trim().min(2, 'Task title must be at least 2 characters long').max(150, 'Task title cannot exceed 150 characters'),
  description: z.string().trim().max(2000, 'Task description cannot exceed 2000 characters').default(''),
  priority: z.enum(Object.values(TASK_PRIORITIES)).default(TASK_PRIORITIES.MEDIUM),
});

export const taskSuggestionListSchema = z.object({
  tasks: z.array(taskSuggestionSchema).min(1, 'At least one task suggestion is required').max(10, 'Task suggestions cannot exceed 10 items'),
});

export const createTaskGenerationRequestSchema = z
  .object({
    workspaceId: z.string().trim().refine((value) => mongoose.Types.ObjectId.isValid(value), {
      message: 'Invalid workspace identifier',
    }),
    projectId: z.string().trim().refine((value) => mongoose.Types.ObjectId.isValid(value), {
      message: 'Invalid project identifier',
    }),
    goal: z
      .string()
      .trim()
      .min(10, 'Project goal must be at least 10 characters long')
      .max(2000, 'Project goal cannot exceed 2000 characters'),
    taskCount: z.coerce
      .number({ invalid_type_error: 'Task count must be a number', required_error: 'Task count is required' })
      .int('Task count must be a whole number')
      .min(1, 'Task count must be at least 1')
      .max(10, 'Task count cannot exceed 10'),
  })
  .strict();

export const buildTaskGenerationPrompt = ({ goal, taskCount }) => {
  return `You are a project planning assistant for a collaborative project management app. Based on the project goal below, produce up to ${taskCount} actionable work items for a software team. Make each item concrete, sequenced, and directly tied to delivery of the goal. Return valid JSON only with this exact shape: {"tasks":[{"title":"...","description":"...","priority":"LOW|MEDIUM|HIGH|URGENT"}]}. Do not include markdown, comments, or extra fields. Prioritize outcomes and execution flow. Project goal: ${goal}`;
};

export const sanitizeGeneratedTasks = (payload) => {
  const tasks = Array.isArray(payload?.tasks) ? payload.tasks : [];
  const sanitizedTasks = tasks
    .map((task) => {
      const parsed = taskSuggestionSchema.safeParse({
        title: typeof task?.title === 'string' ? task.title.trim() : '',
        description: typeof task?.description === 'string' ? task.description.trim() : '',
        priority: typeof task?.priority === 'string' ? task.priority.toUpperCase() : 'MEDIUM',
      });

      if (!parsed.success) {
        return null;
      }

      return {
        title: parsed.data.title.slice(0, 150),
        description: parsed.data.description.slice(0, 2000),
        priority: parsed.data.priority,
      };
    })
    .filter(Boolean)
    .slice(0, 10);

  return { tasks: sanitizedTasks };
};

export const validateGenerateProjectTasks = (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId,
    };

    const parsed = createTaskGenerationRequestSchema.safeParse(payload);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return next(new ApiError(400, issue?.message || 'Invalid AI task generation payload'));
    }

    req.body = parsed.data;
    next();
  } catch (error) {
    next(error);
  }
};

export default {
  taskSuggestionSchema,
  taskSuggestionListSchema,
  createTaskGenerationRequestSchema,
  buildTaskGenerationPrompt,
  sanitizeGeneratedTasks,
  validateGenerateProjectTasks,
};
