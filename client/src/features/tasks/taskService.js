import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';

export const listTasks = async (workspaceId, projectId) => {
  const response = await api.get(API_ENDPOINTS.TASKS(workspaceId, projectId));
  return response.data.data.tasks;
};

export const getTask = async (workspaceId, projectId, taskId) => {
  const response = await api.get(API_ENDPOINTS.TASK_BY_ID(workspaceId, projectId, taskId));
  return response.data.data.task;
};

export const createTask = async (workspaceId, projectId, taskData) => {
  const response = await api.post(API_ENDPOINTS.TASKS(workspaceId, projectId), taskData);
  return response.data.data.task;
};

export const updateTask = async (workspaceId, projectId, taskId, taskData) => {
  const response = await api.patch(API_ENDPOINTS.TASK_BY_ID(workspaceId, projectId, taskId), taskData);
  return response.data.data.task;
};

export const deleteTask = async (workspaceId, projectId, taskId) => {
  const response = await api.delete(API_ENDPOINTS.TASK_BY_ID(workspaceId, projectId, taskId));
  return response.data;
};

export default { listTasks, getTask, createTask, updateTask, deleteTask };