import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';

export const listTaskActivity = async (workspaceId, taskId, page = 1) => (await api.get(`${API_ENDPOINTS.TASK_ACTIVITY(workspaceId, taskId)}?page=${page}&limit=50`)).data.data;
export default { listTaskActivity };