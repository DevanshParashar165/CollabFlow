import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';

/**
 * Superadmin endpoint: List all platform users with pagination.
 * Excludes sensitive fields (password hash, internal auth secrets).
 */
export const getPlatformUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({}, 'name email avatar platformRole createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Superadmin endpoint: List all platform workspaces with member counts.
 */
export const getPlatformWorkspaces = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [workspaces, total] = await Promise.all([
      Workspace.find()
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Workspace.countDocuments(),
    ]);

    // Attach member count for each workspace
    const workspacesWithCounts = await Promise.all(
      workspaces.map(async (ws) => {
        const memberCount = await WorkspaceMember.countDocuments({ workspaceId: ws._id });
        return {
          ...ws.toJSON(),
          memberCount,
        };
      })
    );

    res.status(200).json({
      status: 'success',
      data: {
        workspaces: workspacesWithCounts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getPlatformUsers,
  getPlatformWorkspaces,
};
