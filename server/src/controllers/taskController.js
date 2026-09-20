import taskService from '../services/taskService.js';

export const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, assignee, dueDate } = req.body;
    const task = await taskService.createTask({
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId,
      title, description, status, priority, assignee, dueDate,
      userId: req.user._id,
    });
    res.status(201).json({ status: 'success', message: 'Task created successfully', data: { task } });
  } catch (error) { next(error); }
};

export const getProjectTasks = async (req, res, next) => {
  try {
    const tasks = await taskService.getProjectTasks(req.params.workspaceId, req.params.projectId);
    res.status(200).json({ status: 'success', data: { tasks } });
  } catch (error) { next(error); }
};

export const getTaskById = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.workspaceId, req.params.projectId, req.params.taskId);
    res.status(200).json({ status: 'success', data: { task } });
  } catch (error) { next(error); }
};

export const updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(req.params.workspaceId, req.params.projectId, req.params.taskId, req.body, req.user._id);
    res.status(200).json({ status: 'success', message: 'Task updated successfully', data: { task } });
  } catch (error) { next(error); }
};

export const deleteTask = async (req, res, next) => {
  try {
    const result = await taskService.deleteTask(req.params.workspaceId, req.params.projectId, req.params.taskId, req.user._id);
    res.status(200).json({ status: 'success', message: result.message });
  } catch (error) { next(error); }
};

export default { createTask, getProjectTasks, getTaskById, updateTask, deleteTask };