import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';

export const listWorkspaces = async () => {
  const response = await api.get(API_ENDPOINTS.WORKSPACES);
  return response.data.data.workspaces;
};

export const getWorkspace = async (workspaceId) => {
  const response = await api.get(API_ENDPOINTS.WORKSPACE_BY_ID(workspaceId));
  return response.data.data.workspace;
};

export const createWorkspace = async (workspaceData) => {
  const response = await api.post(API_ENDPOINTS.WORKSPACES, workspaceData);
  return response.data.data.workspace;
};

export const updateWorkspace = async (workspaceId, workspaceData) => {
  const response = await api.patch(API_ENDPOINTS.WORKSPACE_BY_ID(workspaceId), workspaceData);
  return response.data.data.workspace;
};

export const deleteWorkspace = async (workspaceId) => {
  const response = await api.delete(API_ENDPOINTS.WORKSPACE_BY_ID(workspaceId));
  return response.data;
};

export const listMembers = async (workspaceId) => {
  const response = await api.get(API_ENDPOINTS.WORKSPACE_MEMBERS(workspaceId));
  return response.data.data.members;
};

export const addMember = async (workspaceId, memberData) => {
  const response = await api.post(API_ENDPOINTS.WORKSPACE_MEMBERS(workspaceId), memberData);
  return response.data.data.member;
};

export const updateMember = async (workspaceId, userId, roleData) => {
  const response = await api.patch(
    API_ENDPOINTS.WORKSPACE_MEMBER_BY_ID(workspaceId, userId),
    roleData
  );
  return response.data.data.member;
};

export const removeMember = async (workspaceId, userId) => {
  const response = await api.delete(
    API_ENDPOINTS.WORKSPACE_MEMBER_BY_ID(workspaceId, userId)
  );
  return response.data;
};

export default {
  listWorkspaces,
  getWorkspace,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  listMembers,
  addMember,
  updateMember,
  removeMember,
};
