import Comment from "../models/Comment.js";
import Blog from "../models/Blog.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/apiResponse.js";
import { NOTIFICATION_TYPES, PAGINATION } from "../utils/constants.js";
import { createNotification } from "../services/notificationService.js";
import { getIO } from "../config/socket.js";

// @desc    Add comment to a blog
// @route   POST /api/blogs/:blogId/comments
export const addComment = async (req, res, next) => {
  try {
    const { blogId } = req.params;
    const { content, parentComment } = req.body;

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return sendError(res, 404, "Blog not found");
    }

    // Validate parent comment if provided
    if (parentComment) {
      const parent = await Comment.findOne({
        _id: parentComment,
        blog: blogId,
      });
      if (!parent) {
        return sendError(res, 404, "Parent comment not found");
      }
    }

    const comment = await Comment.create({
      content,
      author: req.user._id,
      blog: blogId,
      parentComment: parentComment || null,
    });

    // Increment comment count
    await Blog.findByIdAndUpdate(blogId, { $inc: { commentsCount: 1 } });

    const populatedComment = await comment.populate(
      "author",
      "name avatar"
    );

    // Emit real-time comment
    try {
      const io = getIO();
      io.to(`blog:${blogId}`).emit("comment:new", populatedComment);
    } catch (socketErr) {
      console.warn("Socket comment emit failed:", socketErr.message);
    }

    // Notify blog author (if not self-commenting)
    if (blog.author.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: blog.author,
        type: NOTIFICATION_TYPES.COMMENT,
        message: `${req.user.name} commented on your post "${blog.title}"`,
        relatedBlog: blog._id,
        relatedUser: req.user._id,
      });
    }

    return sendSuccess(res, 201, "Comment added", populatedComment);
  } catch (error) {
    next(error);
  }
};

// @desc    Get comments for a blog (threaded)
// @route   GET /api/blogs/:blogId/comments
export const getComments = async (req, res, next) => {
  try {
    const { blogId } = req.params;
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(
      parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT
    );
    const skip = (page - 1) * limit;

    // Get top-level comments
    const [comments, total] = await Promise.all([
      Comment.find({ blog: blogId, parentComment: null })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name avatar"),
      Comment.countDocuments({ blog: blogId, parentComment: null }),
    ]);

    // Get replies for each top-level comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parentComment: comment._id })
          .sort({ createdAt: 1 })
          .populate("author", "name avatar");
        return {
          ...comment.toObject(),
          replies,
        };
      })
    );

    return sendPaginated(res, 200, "Comments retrieved", commentsWithReplies, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment
// @route   DELETE /api/blogs/:blogId/comments/:commentId
export const deleteComment = async (req, res, next) => {
  try {
    const { blogId, commentId } = req.params;

    const comment = await Comment.findOne({ _id: commentId, blog: blogId });
    if (!comment) {
      return sendError(res, 404, "Comment not found");
    }

    // Only comment author or admin can delete
    if (
      comment.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return sendError(res, 403, "You can only delete your own comments");
    }

    // Delete the comment and its replies
    const deletedCount = await Comment.countDocuments({
      $or: [{ _id: commentId }, { parentComment: commentId }],
    });

    await Comment.deleteMany({
      $or: [{ _id: commentId }, { parentComment: commentId }],
    });

    // Decrement comment count
    await Blog.findByIdAndUpdate(blogId, {
      $inc: { commentsCount: -deletedCount },
    });

    return sendSuccess(res, 200, "Comment deleted");
  } catch (error) {
    next(error);
  }
};
