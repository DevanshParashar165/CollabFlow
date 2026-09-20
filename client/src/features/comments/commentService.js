import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';

export const listComments = async (workspaceId, taskId) => (await api.get(API_ENDPOINTS.COMMENTS(workspaceId, taskId))).data.data.comments;
export const createComment = async (workspaceId, taskId, data) => (await api.post(API_ENDPOINTS.COMMENTS(workspaceId, taskId), data)).data.data.comment;
export const updateComment = async (workspaceId, taskId, commentId, data) => (await api.patch(API_ENDPOINTS.COMMENT_BY_ID(workspaceId, taskId, commentId), data)).data.data.comment;
export const deleteComment = async (workspaceId, taskId, commentId) => api.delete(API_ENDPOINTS.COMMENT_BY_ID(workspaceId, taskId, commentId));
export default { listComments, createComment, updateComment, deleteComment };