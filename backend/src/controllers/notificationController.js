import Notification from "../models/Notification.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/apiResponse.js";
import { PAGINATION } from "../utils/constants.js";

// @desc    Get notifications for current user
// @route   GET /api/notifications
export const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(
      parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT
    );
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("relatedUser", "name avatar")
        .populate("relatedBlog", "title slug"),
      Notification.countDocuments({ recipient: req.user._id }),
      Notification.countDocuments({
        recipient: req.user._id,
        isRead: false,
      }),
    ]);

    return sendPaginated(
      res,
      200,
      "Notifications retrieved",
      { notifications, unreadCount },
      {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return sendError(res, 404, "Notification not found");
    }

    notification.isRead = true;
    await notification.save();

    return sendSuccess(res, 200, "Notification marked as read");
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    return sendSuccess(res, 200, "All notifications marked as read");
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a single notification
// @route   DELETE /api/notifications/:id
export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return sendError(res, 404, "Notification not found");
    }

    return sendSuccess(res, 200, "Notification deleted");
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all notifications
// @route   DELETE /api/notifications
export const clearAllNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });
    return sendSuccess(res, 200, "All notifications cleared");
  } catch (error) {
    next(error);
  }
};
