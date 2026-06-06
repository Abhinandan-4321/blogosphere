import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Blog from "../models/Blog.js";
import Like from "../models/Like.js";
import Follow from "../models/Follow.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/apiResponse.js";
import { BLOG_VISIBILITY, BLOG_STATUS, PAGINATION } from "../utils/constants.js";
import { deleteCache, deleteCachePattern } from "../services/cacheService.js";
import { uploadToCloudinary } from "../middlewares/upload.js";

// @desc    Get current user profile
// @route   GET /api/users/me
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-resetPasswordToken -resetPasswordExpiry"
    );
    
    // Check if account is deleted
    if (user && user.deletedAt) {
      return sendError(res, 403, "This account has been deleted and cannot be accessed");
    }
    
    return sendSuccess(res, 200, "Profile retrieved", user);
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/me
export const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, phone, preferred2FA, is2FAEnabled } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (phone !== undefined) updateData.phone = phone;
    if (preferred2FA !== undefined) updateData.preferred2FA = preferred2FA;
    if (is2FAEnabled !== undefined) updateData.is2FAEnabled = is2FAEnabled;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });

    await deleteCache(`user:${req.user._id}`);

    return sendSuccess(res, 200, "Profile updated", user);
  } catch (error) {
    next(error);
  }
};

// @desc    Update avatar (file upload or URL)
// @route   PUT /api/users/me/avatar
export const updateAvatar = async (req, res, next) => {
  try {
    let avatarUrl;

    if (req.file) {
      // File upload — upload buffer to Cloudinary
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: "blog-app/avatars",
      });
      avatarUrl = result.secure_url;
    } else if (req.body.avatarUrl) {
      // Preset avatar URL (e.g. DiceBear)
      avatarUrl = req.body.avatarUrl;
    } else {
      return sendError(res, 400, "No image file or avatar URL provided");
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl, hasPickedAvatar: true },
      { new: true }
    );

    await deleteCache(`user:${req.user._id}`);

    return sendSuccess(res, 200, "Avatar updated", { avatar: user.avatar });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/users/me/password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");

    if (!user.password) {
      return sendError(
        res,
        400,
        "Cannot change password for Google-only accounts"
      );
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return sendError(res, 401, "Current password is incorrect");
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return sendSuccess(res, 200, "Password changed successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Get public user profile
// @route   GET /api/users/:id
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      "name email avatar bio followersCount followingCount createdAt"
    );

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    // Check if current user follows this user and if it's mutual
    let isFollowing = false;
    let isMutual = false;
    if (req.user) {
      const [meFollowsThem, theyFollowMe] = await Promise.all([
        Follow.findOne({ follower: req.user._id, following: req.params.id }),
        Follow.findOne({ follower: req.params.id, following: req.user._id }),
      ]);
      isFollowing = !!meFollowsThem;
      isMutual = !!(meFollowsThem && theyFollowMe);
    }

    return sendSuccess(res, 200, "User profile retrieved", {
      ...user.toObject(),
      isFollowing,
      isMutual,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's public blogs
// @route   GET /api/users/:id/blogs
export const getUserBlogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(
      parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT
    );
    const skip = (page - 1) * limit;

    const query = {
      author: req.params.id,
      status: BLOG_STATUS.PUBLISHED,
    };

    // Show private posts only if viewing own profile
    if (!req.user || req.user._id.toString() !== req.params.id) {
      query.visibility = BLOG_VISIBILITY.PUBLIC;
    }

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name avatar"),
      Blog.countDocuments(query),
    ]);

    return sendPaginated(res, 200, "User blogs retrieved", blogs, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get posts liked by current user
// @route   GET /api/users/me/liked-posts
export const getLikedPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(
      parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT
    );
    const skip = (page - 1) * limit;

    const [likes, total] = await Promise.all([
      Like.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "blog",
          populate: { path: "author", select: "name avatar" },
        }),
      Like.countDocuments({ user: req.user._id }),
    ]);

    const blogs = likes
      .map((like) => like.blog)
      .filter((blog) => blog !== null);

    return sendPaginated(res, 200, "Liked posts retrieved", blogs, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};
