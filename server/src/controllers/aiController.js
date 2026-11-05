import aiService from '../services/aiService.js';

export const generateProjectTaskSuggestions = async (req, res, next) => {
  try {
    const { workspaceId, projectId } = req.params;
    const { goal, taskCount } = req.body;

    const tasks = await aiService.generateTaskSuggestions({
      workspaceId,
      projectId,
      goal,
      taskCount,
    });

    res.status(200).json({
      status: 'success',
      message: 'AI task suggestions generated successfully',
      data: { tasks },
    });
  } catch (error) {
    next(error);
  }
};

export default { generateProjectTaskSuggestions };
