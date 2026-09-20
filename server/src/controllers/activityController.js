import activityService from '../services/activityService.js';

export const getWorkspaceActivity = async (req, res, next) => {
  try { const result = await activityService.getWorkspaceActivity(req.params.workspaceId, req.query.page, req.query.limit); res.status(200).json({ status: 'success', data: result }); } catch (error) { next(error); }
};

export const getProjectActivity = async (req, res, next) => {
  try { const result = await activityService.getProjectActivity(req.params.workspaceId, req.params.projectId, req.query.page, req.query.limit); res.status(200).json({ status: 'success', data: result }); } catch (error) { next(error); }
};

export const getTaskActivity = async (req, res, next) => {
  try { const result = await activityService.getTaskActivity(req.params.workspaceId, req.params.taskId, req.query.page, req.query.limit); res.status(200).json({ status: 'success', data: result }); } catch (error) { next(error); }
};

export default { getWorkspaceActivity, getProjectActivity, getTaskActivity };