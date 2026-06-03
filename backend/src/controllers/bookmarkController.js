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

    const blogs = bookmarks.map((b) => ({
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
    const folders = await Bookmark.distinct("folder", { user: req.user._id });
    
    // Get count for each folder
    const folderCounts = await Promise.all(
      folders.map(async (folder) => {
        const count = await Bookmark.countDocuments({
          user: req.user._id,
          folder,
        });
        return { name: folder, count };
      })
    );

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
