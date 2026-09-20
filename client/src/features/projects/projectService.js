import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';

export const listProjects = async (workspaceId) => {
  const response = await api.get(API_ENDPOINTS.PROJECTS(workspaceId));
  return response.data.data.projects;
};

export const getProject = async (workspaceId, projectId) => {
  const response = await api.get(API_ENDPOINTS.PROJECT_BY_ID(workspaceId, projectId));
  return response.data.data.project;
};

export const createProject = async (workspaceId, projectData) => {
  const response = await api.post(API_ENDPOINTS.PROJECTS(workspaceId), projectData);
  return response.data.data.project;
};

export const updateProject = async (workspaceId, projectId, projectData) => {
  const response = await api.patch(API_ENDPOINTS.PROJECT_BY_ID(workspaceId, projectId), projectData);
  return response.data.data.project;
};

export const deleteProject = async (workspaceId, projectId) => {
  const response = await api.delete(API_ENDPOINTS.PROJECT_BY_ID(workspaceId, projectId));
  return response.data;
};

export default { listProjects, getProject, createProject, updateProject, deleteProject };