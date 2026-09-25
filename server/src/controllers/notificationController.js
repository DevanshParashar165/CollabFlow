import notificationService from "../services/notificationService.js";

export const getNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.getUserNotifications(
      req.user._id,
      {
        workspaceId: req.query.workspaceId,
        isRead: req.query.isRead,
        page: req.query.page,
        limit: req.query.limit,
      }
    );
    res.status(200).json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await notificationService.getUnreadCount(
      req.user._id,
      req.query.workspaceId
    );
    res.status(200).json({ status: "success", data: { unreadCount } });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(
      req.params.notificationId,
      req.user._id
    );
    res.status(200).json({
      status: "success",
      message: "Notification marked as read",
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const workspaceId = req.body?.workspaceId || req.query?.workspaceId;
    const result = await notificationService.markAllAsRead(
      req.user._id,
      workspaceId
    );
    res.status(200).json({
      status: "success",
      message: "All notifications marked as read",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const result = await notificationService.deleteNotification(
      req.params.notificationId,
      req.user._id
    );
    res.status(200).json({
      status: "success",
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
