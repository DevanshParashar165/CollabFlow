import mongoose from 'mongoose';
import { slugify } from './Workspace.js';

export const PROJECT_STATUSES = Object.freeze({
  PLANNING: 'PLANNING',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
});

const projectSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a project name'],
      trim: true,
      minlength: [2, 'Project name must be at least 2 characters long'],
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Project slug is required'],
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: Object.values(PROJECT_STATUSES),
      default: PROJECT_STATUSES.PLANNING,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project creator is required'],
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

projectSchema.index({ workspaceId: 1, slug: 1 }, { unique: true });
projectSchema.index({ workspaceId: 1, createdAt: -1 });

export { slugify };
export const Project = mongoose.model('Project', projectSchema);
export default Project;