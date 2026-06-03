import Bookmark from "../models/Bookmark.js";
import Blog from "../models/Blog.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/apiResponse.js";
import { PAGINATION } from "../utils/constants.js";

// @desc    Toggle bookmark (save/unsave)
// @route   POST /api/bookmarks/:blogId
export const toggleBookmark = async (req, res, next) => {
  try {
    const { blogId } = req.params;
    const { folder = "default" } = req.body;

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return sendError(res, 404, "Blog not found");
    }

    const existingBookmark = await Bookmark.findOne({
      user: req.user._id,
      blog: blogId,
    });

    if (existingBookmark) {
      // Remove bookmark
      await Bookmark.findByIdAndDelete(existingBookmark._id);
      return sendSuccess(res, 200, "Bookmark removed", { bookmarked: false });
    } else {
      // Add bookmark
      await Bookmark.create({
        user: req.user._id,
        blog: blogId,
        folder,
      });
      return sendSuccess(res, 200, "Bookmark added", { bookmarked: true, folder });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookmarks for current user
// @route   GET /api/bookmarks
export const getBookmarks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(
      parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT
    );
    const skip = (page - 1) * limit;
    const { folder } = req.query;

    const query = { user: req.user._id };
    if (folder) {
      query.folder = folder;
    }

    const [bookmarks, total] = await Promise.all([
      Bookmark.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "blog",
          populate: { path: "author", select: "name avatar" },
        }),
      Bookmark.countDocuments(query),
    ]);

    // Filter out bookmarks where the blog was deleted, and clean up stale records
    const staleIds = bookmarks.filter((b) => !b.blog).map((b) => b._id);
    if (staleIds.length > 0) {
      await Bookmark.deleteMany({ _id: { $in: staleIds } });
    }

    const blogs = bookmarks
      .filter((b) => b.blog)
      .map((b) => ({
        ...b.blog.toObject(),
        bookmarkFolder: b.folder,
        bookmarkedAt: b.createdAt,
      }));

    return sendPaginated(res, 200, "Bookmarks retrieved", blogs, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookmark folders for current user
// @route   GET /api/bookmarks/folders
export const getFolders = async (req, res, next) => {
  try {
    // Aggregate folders only counting bookmarks with existing (non-deleted) blogs
    const folderAgg = await Bookmark.aggregate([
      { $match: { user: req.user._id } },
      { $lookup: { from: "blogs", localField: "blog", foreignField: "_id", as: "blogDoc" } },
      { $match: { "blogDoc.0": { $exists: true } } },
      { $group: { _id: "$folder", count: { $sum: 1 } } },
    ]);

    const folderCounts = folderAgg.map((f) => ({ name: f._id, count: f.count }));

    return sendSuccess(res, 200, "Folders retrieved", folderCounts);
  } catch (error) {
    next(error);
  }
};

// @desc    Update bookmark folder
// @route   PATCH /api/bookmarks/:blogId/folder
export const updateBookmarkFolder = async (req, res, next) => {
  try {
    const { blogId } = req.params;
    const { folder } = req.body;

    if (!folder || !folder.trim()) {
      return sendError(res, 400, "Folder name is required");
    }

    const bookmark = await Bookmark.findOne({
      user: req.user._id,
      blog: blogId,
    });

    if (!bookmark) {
      return sendError(res, 404, "Bookmark not found");
    }

    bookmark.folder = folder.trim();
    await bookmark.save();

    return sendSuccess(res, 200, "Bookmark folder updated", {
      folder: bookmark.folder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if blog is bookmarked
// @route   GET /api/bookmarks/:blogId/status
export const getBookmarkStatus = async (req, res, next) => {
  try {
    const { blogId } = req.params;

    const bookmark = await Bookmark.findOne({
      user: req.user._id,
      blog: blogId,
    });

    return sendSuccess(res, 200, "Bookmark status retrieved", {
      bookmarked: !!bookmark,
      folder: bookmark?.folder || null,
    });
  } catch (error) {
    next(error);
  }
};
