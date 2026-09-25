import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";

export const validateNotificationId = (req, res, next) => {
  const { notificationId } = req.params;
  if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
    return next(new ApiError(400, "Invalid notification identifier"));
  }
  next();
};

export const validateGetNotifications = (req, res, next) => {
  const { workspaceId, page, limit, isRead } = req.query;

  if (workspaceId && !mongoose.Types.ObjectId.isValid(workspaceId)) {
    return next(new ApiError(400, "Invalid workspace identifier"));
  }

  if (page !== undefined && page !== "") {
    const parsedPage = Number.parseInt(page, 10);
    if (Number.isNaN(parsedPage) || parsedPage < 1) {
      return next(new ApiError(400, "Page must be a positive integer"));
    }
  }

  if (limit !== undefined && limit !== "") {
    const parsedLimit = Number.parseInt(limit, 10);
    if (Number.isNaN(parsedLimit) || parsedLimit < 1) {
      return next(new ApiError(400, "Limit must be a positive integer"));
    }
  }

  if (isRead !== undefined && isRead !== "" && isRead !== "true" && isRead !== "false") {
    return next(new ApiError(400, "isRead must be a boolean ('true' or 'false')"));
  }

  next();
};

export const validateUnreadCount = (req, res, next) => {
  const { workspaceId } = req.query;
  if (workspaceId && !mongoose.Types.ObjectId.isValid(workspaceId)) {
    return next(new ApiError(400, "Invalid workspace identifier"));
  }
  next();
};

export const validateMarkAllAsRead = (req, res, next) => {
  const body = req.body || {};
  const unexpected = Object.keys(body).find((field) => field !== "workspaceId");
  if (unexpected) {
    return next(new ApiError(400, `Unexpected field: ${unexpected}`));
  }

  const workspaceId = body.workspaceId || req.query.workspaceId;
  if (workspaceId && !mongoose.Types.ObjectId.isValid(workspaceId)) {
    return next(new ApiError(400, "Invalid workspace identifier"));
  }

  next();
};

export default {
  validateNotificationId,
  validateGetNotifications,
  validateUnreadCount,
  validateMarkAllAsRead,
};
