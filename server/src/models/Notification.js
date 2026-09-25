import mongoose from "mongoose";

export const NOTIFICATION_TYPES = Object.freeze([
  "TASK_ASSIGNED",
  "TASK_UNASSIGNED",
  "TASK_STATUS_CHANGED",
  "TASK_UPDATED",
  "COMMENT_ADDED",
  "COMMENT_MENTION",
]);

export const NOTIFICATION_ENTITY_TYPES = Object.freeze([
  "TASK",
  "COMMENT",
  "PROJECT",
]);

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    entityType: {
      type: String,
      enum: NOTIFICATION_ENTITY_TYPES,
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
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

notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ workspaceId: 1, recipientId: 1 });
notificationSchema.index({ recipientId: 1, type: 1, entityId: 1, actorId: 1, createdAt: 1 });

export const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
