import Like from "../models/Like.js";
import Blog from "../models/Blog.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { NOTIFICATION_TYPES } from "../utils/constants.js";
import { createNotification } from "../services/notificationService.js";
import { getIO } from "../config/socket.js";

// @desc    Toggle like on a blog
// @route   POST /api/blogs/:blogId/like
export const toggleLike = async (req, res, next) => {
  try {
    const { blogId } = req.params;

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return sendError(res, 404, "Blog not found");
    }

    const existingLike = await Like.findOne({
      user: req.user._id,
      blog: blogId,
    });

    let liked;
    if (existingLike) {
      // Unlike
      await Like.findByIdAndDelete(existingLike._id);
      await Blog.findByIdAndUpdate(blogId, { $inc: { likesCount: -1 } });
      liked = false;
    } else {
      // Like
      await Like.create({ user: req.user._id, blog: blogId });
      await Blog.findByIdAndUpdate(blogId, { $inc: { likesCount: 1 } });
      liked = true;

      // Notify blog author (if not self-liking)
      if (blog.author.toString() !== req.user._id.toString()) {
        await createNotification({
          recipient: blog.author,
          type: NOTIFICATION_TYPES.LIKE,
          message: `${req.user.name} liked your post "${blog.title}"`,
          relatedBlog: blog._id,
          relatedUser: req.user._id,
        });
      }
    }

    const updatedBlog = await Blog.findById(blogId).select("likesCount");

    // Broadcast real-time like update
    try {
      const io = getIO();
      io.to(`blog:${blogId}`).emit("blog:like-updated", {
        blogId,
        likesCount: updatedBlog.likesCount,
        userId: req.user._id,
        liked,
      });
    } catch (socketErr) {
      console.warn("Socket like emit failed:", socketErr.message);
    }

    return sendSuccess(res, 200, liked ? "Blog liked" : "Blog unliked", {
      liked,
      likesCount: updatedBlog.likesCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get like status and count
// @route   GET /api/blogs/:blogId/like
export const getLikeStatus = async (req, res, next) => {
  try {
    const { blogId } = req.params;

    const blog = await Blog.findById(blogId).select("likesCount");
    if (!blog) {
      return sendError(res, 404, "Blog not found");
    }

    let isLiked = false;
    if (req.user) {
      const like = await Like.findOne({
        user: req.user._id,
        blog: blogId,
      });
      isLiked = !!like;
    }

    return sendSuccess(res, 200, "Like status retrieved", {
      isLiked,
      likesCount: blog.likesCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get users who liked a blog (for tooltip)
// @route   GET /api/blogs/:blogId/likers
export const getLikers = async (req, res, next) => {
  try {
    const { blogId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 5, 20);

    const likes = await Like.find({ blog: blogId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("user", "name avatar");

    const likers = likes.map((like) => ({
      _id: like.user._id,
      name: like.user.name,
      avatar: like.user.avatar,
    }));

    const total = await Like.countDocuments({ blog: blogId });

    return sendSuccess(res, 200, "Likers retrieved", { likers, total });
  } catch (error) {
    next(error);
  }
};
