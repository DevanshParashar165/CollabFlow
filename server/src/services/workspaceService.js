import crypto from 'crypto';
import mongoose from 'mongoose';
import Workspace, { slugify } from '../models/Workspace.js';
import WorkspaceMember, { WORKSPACE_ROLES } from '../models/WorkspaceMember.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';

/**
 * Creates a unique slug from workspace name.
 */
const generateUniqueSlug = async (name, session = null) => {
  const baseSlug = slugify(name) || 'workspace';
  let candidateSlug = baseSlug;
  let counter = 0;

  while (counter < 10) {
    const existing = await Workspace.findOne({ slug: candidateSlug }).session(session);
    if (!existing) {
      return candidateSlug;
    }
    const suffix = crypto.randomBytes(3).toString('hex');
    candidateSlug = `${baseSlug}-${suffix}`;
    counter++;
  }

  return `${baseSlug}-${Date.now()}`;
};

/**
 * Creates a new Workspace and assigns the creator as OWNER in an atomic MongoDB transaction.
 */
export const createWorkspace = async ({ name, description = '', userId }) => {
  let session;
  let transactionStarted = false;

  try {
    session = await mongoose.startSession();
    session.startTransaction();
    transactionStarted = true;

    const slug = await generateUniqueSlug(name, session);

    const [workspace] = await Workspace.create(
      [
        {
          name: name.trim(),
          slug,
          description: description ? description.trim() : '',
          createdBy: userId,
        },
      ],
      { session }
    );

    const [member] = await WorkspaceMember.create(
      [
        {
          workspaceId: workspace._id,
          userId,
          role: WORKSPACE_ROLES.OWNER,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return {
      ...workspace.toJSON(),
      membership: {
        role: member.role,
        _id: member._id,
      },
    };
  } catch (error) {
    if (session && transactionStarted) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        // Preserve the original operation error; cleanup must not mask it.
      }
    }

    // Check if error is due to MongoDB transactions not being supported (standalone MongoDB)
    if (
      error.message?.includes('replica set') ||
      error.message?.includes('Transaction numbers') ||
      error.code === 20 ||
      error.codeName === 'IllegalOperation'
    ) {
      throw new ApiError(
        500,
        'MongoDB transactions are not supported in the current database environment. A replica set is required for atomic workspace creation.'
      );
    }

    throw error;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

/**
 * Returns all workspaces the current user is a member of.
 */
export const getUserWorkspaces = async (userId) => {
  const memberships = await WorkspaceMember.find({ userId })
    .populate('workspaceId')
    .sort({ createdAt: -1 });

  return memberships
    .filter((m) => m.workspaceId !== null)
    .map((m) => ({
      ...m.workspaceId.toJSON(),
      role: m.role,
      membershipId: m._id,
    }));
};

/**
 * Returns workspace details and member's role.
 */
export const getWorkspaceById = async (workspaceId, userId) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new ApiError(404, 'Workspace not found');
  }

  const membership = await WorkspaceMember.findOne({ workspaceId, userId });
  if (!membership) {
    throw new ApiError(403, 'Forbidden: You are not a member of this workspace');
  }

  return {
    ...workspace.toJSON(),
    role: membership.role,
  };
};

/**
 * Updates workspace properties (OWNER or ADMIN only).
 */
export const updateWorkspace = async (workspaceId, { name, description }) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new ApiError(404, 'Workspace not found');
  }

  if (name !== undefined) workspace.name = name.trim();
  if (description !== undefined) workspace.description = description.trim();

  await workspace.save();
  return workspace;
};

/**
 * Deletes workspace and all member records (OWNER only).
 */
export const deleteWorkspace = async (workspaceId) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new ApiError(404, 'Workspace not found');
  }

  await WorkspaceMember.deleteMany({ workspaceId });
  await Workspace.findByIdAndDelete(workspaceId);

  return { message: 'Workspace deleted successfully' };
};

/**
 * Retrieves list of members for a workspace.
 */
export const getWorkspaceMembers = async (workspaceId) => {
  const members = await WorkspaceMember.find({ workspaceId })
    .populate('userId', 'name email avatar platformRole createdAt')
    .sort({ createdAt: 1 });

  return members.map((m) => ({
    _id: m._id,
    role: m.role,
    createdAt: m.createdAt,
    user: m.userId,
  }));
};

/**
 * Adds a new member to a workspace.
 */
export const addWorkspaceMember = async ({
  workspaceId,
  callerRole,
  email,
  userId,
  role,
}) => {
  if (role === WORKSPACE_ROLES.OWNER) {
    throw new ApiError(
      403,
      'Forbidden: Ownership transfer is not available through the member invitation endpoint'
    );
  }

  // Permission checks
  if (callerRole === WORKSPACE_ROLES.ADMIN) {
    if (role === WORKSPACE_ROLES.ADMIN) {
      throw new ApiError(403, 'Forbidden: Admins can only invite Members or Viewers');
    }
  }

  let targetUser;
  if (userId) {
    targetUser = await User.findById(userId);
  } else if (email) {
    targetUser = await User.findOne({ email: email.trim().toLowerCase() });
  }

  if (!targetUser) {
    throw new ApiError(404, 'User to add was not found');
  }

  // Check for existing membership
  const existingMembership = await WorkspaceMember.findOne({
    workspaceId,
    userId: targetUser._id,
  });

  if (existingMembership) {
    throw new ApiError(409, 'User is already a member of this workspace');
  }

  const membership = await WorkspaceMember.create({
    workspaceId,
    userId: targetUser._id,
    role,
  });

  return {
    _id: membership._id,
    role: membership.role,
    createdAt: membership.createdAt,
    user: {
      _id: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
      avatar: targetUser.avatar,
      platformRole: targetUser.platformRole,
    },
  };
};

/**
 * Updates a member's role within a workspace.
 * Enforces critical owner protection rules:
 * - Cannot demote the last OWNER (409 Conflict)
 * - ADMIN cannot modify or demote an OWNER
 * - ADMIN cannot promote anyone to OWNER
 */
export const updateMemberRole = async ({
  workspaceId,
  callerRole,
  targetUserId,
  newRole,
}) => {
  const membership = await WorkspaceMember.findOne({
    workspaceId,
    userId: targetUserId,
  });

  if (!membership) {
    throw new ApiError(404, 'Workspace member not found');
  }

  // ADMIN restrictions
  if (callerRole === WORKSPACE_ROLES.ADMIN) {
    if (membership.role === WORKSPACE_ROLES.OWNER) {
      throw new ApiError(403, 'Forbidden: Admins cannot modify Owner role');
    }
    if (membership.role === WORKSPACE_ROLES.ADMIN && newRole !== WORKSPACE_ROLES.ADMIN) {
      throw new ApiError(403, 'Forbidden: Admins cannot demote other Admins');
    }
    if (newRole === WORKSPACE_ROLES.OWNER || newRole === WORKSPACE_ROLES.ADMIN) {
      throw new ApiError(403, 'Forbidden: Admins cannot promote users to Admin or Owner');
    }
  }

  // OWNER protection: If demoting an OWNER to a non-OWNER role
  if (membership.role === WORKSPACE_ROLES.OWNER && newRole !== WORKSPACE_ROLES.OWNER) {
    const ownerCount = await WorkspaceMember.countDocuments({
      workspaceId,
      role: WORKSPACE_ROLES.OWNER,
    });

    if (ownerCount <= 1) {
      throw new ApiError(409, 'Cannot remove or demote the last OWNER of the workspace.');
    }
  }

  membership.role = newRole;
  await membership.save();

  return membership;
};

/**
 * Removes a member from a workspace.
 * Enforces critical owner protection rules:
 * - Cannot remove the last OWNER (409 Conflict)
 * - ADMIN cannot remove an OWNER or another ADMIN
 */
export const removeWorkspaceMember = async ({
  workspaceId,
  callerRole,
  targetUserId,
}) => {
  const membership = await WorkspaceMember.findOne({
    workspaceId,
    userId: targetUserId,
  });

  if (!membership) {
    throw new ApiError(404, 'Workspace member not found');
  }

  // ADMIN restrictions
  if (callerRole === WORKSPACE_ROLES.ADMIN) {
    if (membership.role === WORKSPACE_ROLES.OWNER) {
      throw new ApiError(403, 'Forbidden: Admins cannot remove an Owner');
    }
    if (membership.role === WORKSPACE_ROLES.ADMIN) {
      throw new ApiError(403, 'Forbidden: Admins cannot remove another Admin');
    }
  }

  // OWNER protection
  if (membership.role === WORKSPACE_ROLES.OWNER) {
    const ownerCount = await WorkspaceMember.countDocuments({
      workspaceId,
      role: WORKSPACE_ROLES.OWNER,
    });

    if (ownerCount <= 1) {
      throw new ApiError(409, 'Cannot remove or demote the last OWNER of the workspace.');
    }
  }

  await WorkspaceMember.findByIdAndDelete(membership._id);
  return { message: 'Member removed successfully from workspace' };
};

export default {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceMembers,
  addWorkspaceMember,
  updateMemberRole,
  removeWorkspaceMember,
};
