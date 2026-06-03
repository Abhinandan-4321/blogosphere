import User from "../models/User.js";
import Blog from "../models/Blog.js";
import Comment from "../models/Comment.js";
import Like from "../models/Like.js";
import Follow from "../models/Follow.js";
import Notification from "../models/Notification.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/apiResponse.js";
import { ROLES, NOTIFICATION_TYPES, PAGINATION } from "../utils/constants.js";
import { createNotification } from "../services/notificationService.js";
import { sendApprovalEmail } from "../services/emailService.js";
import { deleteCachePattern } from "../services/cacheService.js";

// @desc    Get all users
// @route   GET /api/admin/users
export const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(
      parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT
    );
    const skip = (page - 1) * limit;
    const { approved, search } = req.query;

    const query = {};

    if (approved !== undefined) {
      query.isApproved = approved === "true";
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    return sendPaginated(res, 200, "Users retrieved", users, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve user registration
// @route   PATCH /api/admin/users/:id/approve
export const approveUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 404, "User not found");
    }

    if (user.isApproved) {
      return sendError(res, 400, "User is already approved");
    }

    user.isApproved = true;
    await user.save();

    // Send approval notification
    await createNotification({
      recipient: user._id,
      type: NOTIFICATION_TYPES.APPROVAL,
      message: "Your account has been approved! Welcome aboard.",
      relatedUser: req.user._id,
    });

    // Send approval email
    sendApprovalEmail(user.email, user.name).catch((err) =>
      console.error("Approval email failed:", err.message)
    );

    return sendSuccess(res, 200, "User approved", {
      _id: user._id,
      name: user.name,
      email: user.email,
      isApproved: user.isApproved,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change user role
// @route   PATCH /api/admin/users/:id/role
export const changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!Object.values(ROLES).includes(role)) {
      return sendError(res, 400, "Invalid role");
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 404, "User not found");
    }

    // Prevent demoting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return sendError(res, 400, "You cannot change your own role");
    }

    user.role = role;
    await user.save();

    return sendSuccess(res, 200, `User role changed to ${role}`, {
      _id: user._id,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user (admin)
// @route   DELETE /api/admin/users/:id
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 404, "User not found");
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return sendError(res, 400, "You cannot delete your own account");
    }

    // Get all follow relationships to update counts
    const followRelationships = await Follow.find({
      $or: [{ follower: user._id }, { following: user._id }],
    });

    // Update follower/following counts for affected users
    const updatePromises = [];
    for (const follow of followRelationships) {
      if (follow.follower.toString() === user._id.toString()) {
        // User was following someone - decrement that person's follower count
        updatePromises.push(
          User.findByIdAndUpdate(follow.following, { $inc: { followersCount: -1 } })
        );
      }
      if (follow.following.toString() === user._id.toString()) {
        // Someone was following user - decrement that person's following count
        updatePromises.push(
          User.findByIdAndUpdate(follow.follower, { $inc: { followingCount: -1 } })
        );
      }
    }

    // Soft delete user and clean up related data
    await Promise.all([
      ...updatePromises,
      Blog.deleteMany({ author: user._id }),
      Comment.deleteMany({ author: user._id }),
      Like.deleteMany({ user: user._id }),
      Follow.deleteMany({
        $or: [{ follower: user._id }, { following: user._id }],
      }),
      Notification.deleteMany({ recipient: user._id }),
      User.findByIdAndUpdate(user._id, { 
        deletedAt: new Date(),
        name: '[Deleted User]',
        email: `deleted_${user._id}@deleted.com`,
      }),
    ]);

    await deleteCachePattern("blogs:*");
    await deleteCachePattern("user:*");

    return sendSuccess(res, 200, "User and all related data deleted");
  } catch (error) {
    next(error);
  }
};

// @desc    Delete any blog post (admin)
// @route   DELETE /api/admin/blogs/:id
export const deleteAnyBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return sendError(res, 404, "Blog not found");
    }

    // Notify the author
    await createNotification({
      recipient: blog.author,
      type: NOTIFICATION_TYPES.ADMIN_ACTION,
      message: `Your blog post "${blog.title}" was removed by an admin`,
      relatedUser: req.user._id,
    });

    await Promise.all([
      Comment.deleteMany({ blog: blog._id }),
      Like.deleteMany({ blog: blog._id }),
      Blog.findByIdAndDelete(blog._id),
    ]);

    await deleteCachePattern("blogs:*");

    return sendSuccess(res, 200, "Blog deleted by admin");
  } catch (error) {
    next(error);
  }
};

// @desc    Admin dashboard stats
// @route   GET /api/admin/dashboard
export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      pendingApprovals,
      totalBlogs,
      totalComments,
      totalLikes,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isApproved: false, isVerified: true }),
      Blog.countDocuments(),
      Comment.countDocuments(),
      Like.countDocuments(),
    ]);

    // Recent signups
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email isApproved createdAt");

    return sendSuccess(res, 200, "Dashboard stats retrieved", {
      totalUsers,
      pendingApprovals,
      totalBlogs,
      totalComments,
      totalLikes,
      recentUsers,
    });
  } catch (error) {
    next(error);
  }
};
