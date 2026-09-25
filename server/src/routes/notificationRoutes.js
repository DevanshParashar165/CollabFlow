import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";
import {
  validateNotificationId,
  validateGetNotifications,
  validateUnreadCount,
  validateMarkAllAsRead,
} from "../validators/notificationValidators.js";

const router = express.Router();

// All notification routes are protected with user authentication
router.use(authMiddleware);

// Specific routes first to prevent route param collision
router.get("/unread-count", validateUnreadCount, getUnreadCount);
router.patch("/read-all", validateMarkAllAsRead, markAllAsRead);

// Collection routes
router.get("/", validateGetNotifications, getNotifications);

// Parametric notification item routes
router.patch("/:notificationId/read", validateNotificationId, markAsRead);
router.delete("/:notificationId", validateNotificationId, deleteNotification);

export default router;
