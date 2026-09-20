import commentService from '../services/commentService.js';

export const createComment = async (req, res, next) => {
  try {
    const comment = await commentService.createComment({ workspaceId: req.params.workspaceId, taskId: req.params.taskId, content: req.body.content, userId: req.user._id });
    res.status(201).json({ status: 'success', message: 'Comment created successfully', data: { comment } });
  } catch (error) { next(error); }
};

export const getTaskComments = async (req, res, next) => {
  try {
    const comments = await commentService.getTaskComments(req.params.workspaceId, req.params.taskId);
    res.status(200).json({ status: 'success', data: { comments } });
  } catch (error) { next(error); }
};

export const updateComment = async (req, res, next) => {
  try {
    const comment = await commentService.updateComment({ workspaceId: req.params.workspaceId, taskId: req.params.taskId, commentId: req.params.commentId, content: req.body.content, actorId: req.user._id, role: req.workspaceMembership.role });
    res.status(200).json({ status: 'success', message: 'Comment updated successfully', data: { comment } });
  } catch (error) { next(error); }
};

export const deleteComment = async (req, res, next) => {
  try {
    const result = await commentService.deleteComment({ workspaceId: req.params.workspaceId, taskId: req.params.taskId, commentId: req.params.commentId, actorId: req.user._id, role: req.workspaceMembership.role });
    res.status(200).json({ status: 'success', message: result.message });
  } catch (error) { next(error); }
};

export default { createComment, getTaskComments, updateComment, deleteComment };