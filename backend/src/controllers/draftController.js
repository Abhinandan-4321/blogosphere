import Draft from "../models/Draft.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/apiResponse.js";
import { PAGINATION } from "../utils/constants.js";

// @desc    Get all drafts for current user
// @route   GET /api/drafts
export const getDrafts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(
      parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT
    );
    const skip = (page - 1) * limit;

    const [drafts, total] = await Promise.all([
      Draft.find({ author: req.user._id })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Draft.countDocuments({ author: req.user._id }),
    ]);

    return sendPaginated(res, 200, "Drafts retrieved", drafts, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single draft
// @route   GET /api/drafts/:id
export const getDraft = async (req, res, next) => {
  try {
    const draft = await Draft.findOne({
      _id: req.params.id,
      author: req.user._id,
    });

    if (!draft) {
      return sendError(res, 404, "Draft not found");
    }

    return sendSuccess(res, 200, "Draft retrieved", draft);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete draft
// @route   DELETE /api/drafts/:id
export const deleteDraft = async (req, res, next) => {
  try {
    const draft = await Draft.findOneAndDelete({
      _id: req.params.id,
      author: req.user._id,
    });

    if (!draft) {
      return sendError(res, 404, "Draft not found");
    }

    return sendSuccess(res, 200, "Draft deleted");
  } catch (error) {
    next(error);
  }
};
