import Notification from "../models/Notification.js";
import { getIO } from "../config/socket.js";
import { NOTIFICATION_TYPES } from "../utils/constants.js";

export const createNotification = async ({
  recipient,
  type,
  message,
  relatedBlog = null,
  relatedUser = null,
}) => {
  try {
    const notification = await Notification.create({
      recipient,
      type,
      message,
      relatedBlog,
      relatedUser,
    });

    // Send real-time notification via Socket.io
    try {
      const io = getIO();
      const populated = await notification.populate([
        { path: "relatedUser", select: "name avatar" },
        { path: "relatedBlog", select: "title slug" },
      ]);
      io.to(`user:${recipient}`).emit("notification:new", populated);
    } catch (socketErr) {
      console.warn("Socket notification failed:", socketErr.message);
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error.message);
    return null;
  }
};

export const notifyFollowers = async (followers, authorName, blog) => {
  const notifications = followers.map((followerId) =>
    createNotification({
      recipient: followerId,
      type: NOTIFICATION_TYPES.NEW_POST,
      message: `${authorName} published a new post: "${blog.title}"`,
      relatedBlog: blog._id,
      relatedUser: blog.author,
    })
  );

  return Promise.allSettled(notifications);
};
