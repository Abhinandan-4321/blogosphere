import Follow from "../models/Follow.js";
import User from "../models/User.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/apiResponse.js";
import { NOTIFICATION_TYPES, PAGINATION } from "../utils/constants.js";
import { createNotification } from "../services/notificationService.js";
import { deleteCache } from "../services/cacheService.js";

// @desc    Toggle follow/unfollow a user
// @route   POST /api/users/:id/follow
export const toggleFollow = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    if (targetUserId === req.user._id.toString()) {
      return sendError(res, 400, "You cannot follow yourself");
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return sendError(res, 404, "User not found");
    }

    const existingFollow = await Follow.findOne({
      follower: req.user._id,
      following: targetUserId,
    });

    let followed;
    if (existingFollow) {
      // Unfollow
      await Follow.findByIdAndDelete(existingFollow._id);
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { followingCount: -1 },
      });
      await User.findByIdAndUpdate(targetUserId, {
        $inc: { followersCount: -1 },
      });
      followed = false;
    } else {
      // Follow
      await Follow.create({
        follower: req.user._id,
        following: targetUserId,
      });
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { followingCount: 1 },
      });
      await User.findByIdAndUpdate(targetUserId, {
        $inc: { followersCount: 1 },
      });
      followed = true;

      // Notify the user being followed
      await createNotification({
        recipient: targetUserId,
        type: NOTIFICATION_TYPES.FOLLOW,
        message: `${req.user.name} started following you`,
        relatedUser: req.user._id,
      });
    }

    await deleteCache(`user:${targetUserId}`);
    await deleteCache(`user:${req.user._id}`);

    return sendSuccess(
      res,
      200,
      followed ? "User followed" : "User unfollowed",
      { followed }
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a follower (the caller removes someone who follows them)
// @route   DELETE /api/users/:id/follower
export const removeFollower = async (req, res, next) => {
  try {
    const followerId = req.params.id;

    const follow = await Follow.findOneAndDelete({
      follower: followerId,
      following: req.user._id,
    });

    if (!follow) {
      return sendError(res, 404, "This user is not following you");
    }

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { followersCount: -1 },
    });
    await User.findByIdAndUpdate(followerId, {
      $inc: { followingCount: -1 },
    });

    await deleteCache(`user:${req.user._id}`);
    await deleteCache(`user:${followerId}`);

    return sendSuccess(res, 200, "Follower removed");
  } catch (error) {
    next(error);
  }
};

// @desc    Get followers of a user
// @route   GET /api/users/:id/followers
export const getFollowers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(
      parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT
    );
    const skip = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      Follow.find({ following: req.params.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("follower", "name avatar bio"),
      Follow.countDocuments({ following: req.params.id }),
    ]);

    const followers = follows.map((f) => f.follower);

    return sendPaginated(res, 200, "Followers retrieved", followers, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get users that a user follows
// @route   GET /api/users/:id/following
export const getFollowing = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(
      parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT
    );
    const skip = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      Follow.find({ follower: req.params.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("following", "name avatar bio"),
      Follow.countDocuments({ follower: req.params.id }),
    ]);

    const following = follows.map((f) => f.following);

    return sendPaginated(res, 200, "Following retrieved", following, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};
