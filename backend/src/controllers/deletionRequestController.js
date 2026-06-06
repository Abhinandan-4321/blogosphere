import DeletionRequest from "../models/DeletionRequest.js";
import User from "../models/User.js";
import Blog from "../models/Blog.js";
import Notification from "../models/Notification.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

// @desc    Request account deletion
// @route   POST /api/deletion-request
export const requestDeletion = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const userId = req.user._id;

    // Check if user already has a pending deletion request
    const existingRequest = await DeletionRequest.findOne({
      userId,
      status: "pending",
    });

    if (existingRequest) {
      return sendError(res, 409, "You already have a pending deletion request");
    }

    // Create deletion request
    const deletionRequest = await DeletionRequest.create({
      userId,
      reason: reason || "",
    });

    return sendSuccess(res, 201, "Deletion request submitted", {
      deletionRequest,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get deletion request status for current user
// @route   GET /api/deletion-request
export const getDeletionRequest = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const deletionRequest = await DeletionRequest.findOne({ userId }).populate(
      "approvedBy",
      "name email"
    );

    if (!deletionRequest) {
      return sendSuccess(res, 200, "No deletion request found", {
        deletionRequest: null,
      });
    }

    return sendSuccess(res, 200, "Deletion request retrieved", {
      deletionRequest,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel deletion request
// @route   DELETE /api/deletion-request
export const cancelDeletionRequest = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const deletionRequest = await DeletionRequest.findOne({
      userId,
      status: "pending",
    });

    if (!deletionRequest) {
      return sendError(res, 404, "No pending deletion request found");
    }

    await DeletionRequest.deleteOne({ _id: deletionRequest._id });

    return sendSuccess(res, 200, "Deletion request cancelled");
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pending deletion requests (admin only)
// @route   GET /api/admin/deletion-requests
export const getPendingDeletionRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const deletionRequests = await DeletionRequest.find({ status: "pending" })
      .populate("userId", "name email avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await DeletionRequest.countDocuments({ status: "pending" });

    return sendSuccess(res, 200, "Deletion requests retrieved", {
      deletionRequests,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve deletion request (admin only)
// @route   POST /api/admin/deletion-requests/:id/approve
export const approveDeletionRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approvalReason } = req.body;
    const adminId = req.user._id;

    const deletionRequest = await DeletionRequest.findById(id);

    if (!deletionRequest) {
      return sendError(res, 404, "Deletion request not found");
    }

    if (deletionRequest.status !== "pending") {
      return sendError(res, 409, "This deletion request has already been processed");
    }

    const user = await User.findById(deletionRequest.userId);

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    // Delete all user data
    await Promise.all([
      Blog.deleteMany({ author: user._id }),
      Notification.deleteMany({
        $or: [{ recipient: user._id }, { actor: user._id }],
      }),
      User.findByIdAndUpdate(user._id, {
        deletedAt: new Date(),
        name: "[Deleted User]",
        email: `deleted_${user._id}@deleted.com`,
      }),
    ]);

    // Update deletion request
    deletionRequest.status = "approved";
    deletionRequest.approvedBy = adminId;
    deletionRequest.approvalReason = approvalReason || "";
    deletionRequest.approvedAt = new Date();
    await deletionRequest.save();

    return sendSuccess(res, 200, "Deletion request approved and account deleted");
  } catch (error) {
    next(error);
  }
};

// @desc    Reject deletion request (admin only)
// @route   POST /api/admin/deletion-requests/:id/reject
export const rejectDeletionRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const deletionRequest = await DeletionRequest.findById(id);

    if (!deletionRequest) {
      return sendError(res, 404, "Deletion request not found");
    }

    if (deletionRequest.status !== "pending") {
      return sendError(res, 409, "This deletion request has already been processed");
    }

    deletionRequest.status = "rejected";
    deletionRequest.approvalReason = rejectionReason || "";
    deletionRequest.approvedAt = new Date();
    await deletionRequest.save();

    return sendSuccess(res, 200, "Deletion request rejected");
  } catch (error) {
    next(error);
  }
};
