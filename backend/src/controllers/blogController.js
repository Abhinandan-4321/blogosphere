import slugify from "slugify";
import Blog from "../models/Blog.js";
import Like from "../models/Like.js";
import Follow from "../models/Follow.js";
import User from "../models/User.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/apiResponse.js";
import {
  BLOG_STATUS,
  BLOG_VISIBILITY,
  PAGINATION,
  NOTIFICATION_TYPES,
  CACHE_TTL,
} from "../utils/constants.js";
import { getCache, setCache, deleteCache, deleteCachePattern } from "../services/cacheService.js";
import { createNotification, notifyFollowers } from "../services/notificationService.js";
import { sendNewPostNotification } from "../services/emailService.js";
import { uploadToCloudinary } from "../middlewares/upload.js";

// Generate unique slug
const generateUniqueSlug = async (title) => {
  let slug = slugify(title, { lower: true, strict: true });
  let existing = await Blog.findOne({ slug });
  let counter = 1;
  while (existing) {
    slug = `${slugify(title, { lower: true, strict: true })}-${counter}`;
    existing = await Blog.findOne({ slug });
    counter++;
  }
  return slug;
};

// @desc    Create a new blog post
// @route   POST /api/blogs
export const createBlog = async (req, res, next) => {
  try {
    const { title, content, excerpt, tags, category, visibility } = req.body;

    const slug = await generateUniqueSlug(title);

    const blogData = {
      title,
      slug,
      content,
      excerpt: excerpt || "",
      author: req.user._id,
      visibility: visibility || BLOG_VISIBILITY.PUBLIC,
      status: BLOG_STATUS.PUBLISHED,
      category: category || "general",
    };

    // Handle tags (could be string or array)
    if (tags) {
      blogData.tags = Array.isArray(tags)
        ? tags
        : tags.split(",").map((t) => t.trim());
    }

    // Handle cover image — upload buffer to Cloudinary
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: "blog-app/covers",
      });
      blogData.coverImage = result.secure_url;
    }

    const blog = await Blog.create(blogData);
    const populatedBlog = await blog.populate("author", "name avatar");

    // Invalidate caches
    await deleteCachePattern("blogs:*");

    // Notify followers if public
    if (blog.visibility === BLOG_VISIBILITY.PUBLIC) {
      const followers = await Follow.find({ following: req.user._id }).select(
        "follower"
      );
      const followerIds = followers.map((f) => f.follower);

      // In-app notifications
      await notifyFollowers(followerIds, req.user.name, blog);

      // Email notifications (async, don't await)
      const followerUsers = await User.find({
        _id: { $in: followerIds },
      }).select("email");

      followerUsers.forEach((follower) => {
        sendNewPostNotification(
          follower.email,
          req.user.name,
          blog.title,
          blog.slug
        ).catch((err) =>
          console.error("Email notification failed:", err.message)
        );
      });
    }

    return sendSuccess(res, 201, "Blog created successfully", populatedBlog);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all public blogs (paginated, filterable)
// @route   GET /api/blogs
export const getBlogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(
      parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT
    );
    const skip = (page - 1) * limit;
    const { tag, category, search, sort, dateFrom, dateTo, minReadTime, maxReadTime } = req.query;

    // Check cache (skip cache when user is authenticated for accurate isLiked, or when searching)
    const userId = req.user?._id?.toString() || "anon";
    const cacheKey = `blogs:${userId}:${page}:${limit}:${tag || ""}:${category || ""}:${search || ""}:${sort || ""}:${dateFrom || ""}:${dateTo || ""}:${minReadTime || ""}:${maxReadTime || ""}`;
    if (!search && !req.user) {
      const cached = await getCache(cacheKey);
      if (cached) {
        return sendPaginated(res, 200, "Blogs retrieved (cached)", cached.data, cached.pagination);
      }
    }

    const query = {
      status: BLOG_STATUS.PUBLISHED,
      visibility: BLOG_VISIBILITY.PUBLIC,
    };

    if (tag) {
      query.tags = { $in: [tag.toLowerCase()] };
    }

    if (category) {
      query.category = category;
    }

    // Fuzzy / partial matching via regex
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { title: { $regex: escaped, $options: "i" } },
        { content: { $regex: escaped, $options: "i" } },
        { tags: { $regex: escaped, $options: "i" } },
      ];
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Read time filter
    if (minReadTime || maxReadTime) {
      query.readTime = {};
      if (minReadTime) query.readTime.$gte = parseInt(minReadTime);
      if (maxReadTime) query.readTime.$lte = parseInt(maxReadTime);
    }

    let sortOption = { createdAt: -1 };
    if (sort === "popular") {
      sortOption = { likesCount: -1, createdAt: -1 };
    } else if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    }

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .populate("author", "name avatar"),
      Blog.countDocuments(query),
    ]);

    // Attach isLiked status for authenticated users
    let blogsWithLikeStatus = blogs;
    if (req.user) {
      const blogIds = blogs.map((b) => b._id);
      const userLikes = await Like.find({
        user: req.user._id,
        blog: { $in: blogIds },
      }).select("blog");
      const likedBlogIds = new Set(userLikes.map((like) => like.blog.toString()));
      
      blogsWithLikeStatus = blogs.map((blog) => ({
        ...blog.toObject(),
        isLiked: likedBlogIds.has(blog._id.toString()),
      }));
    }

    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };

    // Cache the result
    await setCache(cacheKey, { data: blogsWithLikeStatus, pagination }, CACHE_TTL.SHORT);

    return sendPaginated(res, 200, "Blogs retrieved", blogsWithLikeStatus, pagination);
  } catch (error) {
    next(error);
  }
};

// @desc    Get trending blogs (most liked in last 7 days)
// @route   GET /api/blogs/trending
export const getTrending = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5, 20);
    const days = parseInt(req.query.days) || 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Aggregate likes from last N days and join with blogs
    const trending = await Like.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: "$blog", recentLikes: { $sum: 1 } } },
      { $sort: { recentLikes: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "blogs",
          localField: "_id",
          foreignField: "_id",
          as: "blog",
        },
      },
      { $unwind: "$blog" },
      {
        $match: {
          "blog.status": BLOG_STATUS.PUBLISHED,
          "blog.visibility": BLOG_VISIBILITY.PUBLIC,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "blog.author",
          foreignField: "_id",
          as: "authorInfo",
        },
      },
      { $unwind: "$authorInfo" },
      {
        $project: {
          _id: "$blog._id",
          title: "$blog.title",
          slug: "$blog.slug",
          excerpt: "$blog.excerpt",
          coverImage: "$blog.coverImage",
          tags: "$blog.tags",
          category: "$blog.category",
          likesCount: "$blog.likesCount",
          commentsCount: "$blog.commentsCount",
          readTime: "$blog.readTime",
          createdAt: "$blog.createdAt",
          recentLikes: 1,
          author: {
            _id: "$authorInfo._id",
            name: "$authorInfo.name",
            avatar: "$authorInfo.avatar",
          },
        },
      },
    ]);

    return sendSuccess(res, 200, "Trending blogs retrieved", trending);
  } catch (error) {
    next(error);
  }
};

// @desc    Get personalized feed (posts from followed users)
// @route   GET /api/blogs/feed
export const getFeed = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(
      parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT
    );
    const skip = (page - 1) * limit;

    // Get list of users the current user follows
    const following = await Follow.find({ follower: req.user._id }).select(
      "following"
    );
    const followingIds = following.map((f) => f.following);

    const query = {
      author: { $in: followingIds },
      status: BLOG_STATUS.PUBLISHED,
      visibility: BLOG_VISIBILITY.PUBLIC,
    };

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name avatar"),
      Blog.countDocuments(query),
    ]);

    return sendPaginated(res, 200, "Feed retrieved", blogs, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single blog by slug or ID
// @route   GET /api/blogs/:slug
export const getBlogBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    // Try to find by slug first, then by ID (for editing)
    let blog = await Blog.findOne({ slug }).populate(
      "author",
      "name avatar bio followersCount"
    );

    // If not found by slug, try by ID (for edit routes)
    if (!blog) {
      blog = await Blog.findById(slug).populate(
        "author",
        "name avatar bio followersCount"
      );
    }

    if (!blog) {
      return sendError(res, 404, "Blog not found");
    }

    // Check visibility
    if (blog.visibility === BLOG_VISIBILITY.PRIVATE) {
      if (!req.user || req.user._id.toString() !== blog.author._id.toString()) {
        return sendError(res, 403, "This blog is private");
      }
    }

    // Check if current user liked this blog
    let isLiked = false;
    if (req.user) {
      const like = await Like.findOne({
        user: req.user._id,
        blog: blog._id,
      });
      isLiked = !!like;
    }

    return sendSuccess(res, 200, "Blog retrieved", {
      ...blog.toObject(),
      isLiked,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update blog
// @route   PUT /api/blogs/:id
export const updateBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return sendError(res, 404, "Blog not found");
    }

    if (blog.author.toString() !== req.user._id.toString()) {
      return sendError(res, 403, "You can only edit your own blogs");
    }

    const { title, content, excerpt, tags, category, visibility } = req.body;

    if (title) {
      blog.title = title;
      blog.slug = await generateUniqueSlug(title);
    }
    if (content !== undefined) blog.content = content;
    if (excerpt !== undefined) blog.excerpt = excerpt;
    if (category !== undefined) blog.category = category;
    if (visibility !== undefined) blog.visibility = visibility;

    if (tags) {
      blog.tags = Array.isArray(tags)
        ? tags
        : tags.split(",").map((t) => t.trim());
    }

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: "blog-app/covers",
      });
      blog.coverImage = result.secure_url;
    }

    await blog.save();
    const updatedBlog = await blog.populate("author", "name avatar");

    await deleteCachePattern("blogs:*");
    await deleteCache(`blog:${req.params.id}`);

    return sendSuccess(res, 200, "Blog updated", updatedBlog);
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle blog visibility
// @route   PATCH /api/blogs/:id/visibility
export const toggleVisibility = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return sendError(res, 404, "Blog not found");
    }

    if (blog.author.toString() !== req.user._id.toString()) {
      return sendError(res, 403, "You can only modify your own blogs");
    }

    const { visibility } = req.body;
    blog.visibility = visibility;
    await blog.save();

    await deleteCachePattern("blogs:*");

    return sendSuccess(res, 200, `Blog is now ${visibility}`, {
      visibility: blog.visibility,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
export const deleteBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return sendError(res, 404, "Blog not found");
    }

    if (blog.author.toString() !== req.user._id.toString()) {
      return sendError(res, 403, "You can only delete your own blogs");
    }

    await Blog.findByIdAndDelete(req.params.id);

    // Clean up related data
    await Like.deleteMany({ blog: req.params.id });

    await deleteCachePattern("blogs:*");
    await deleteCache(`blog:${req.params.id}`);

    return sendSuccess(res, 200, "Blog deleted");
  } catch (error) {
    next(error);
  }
};
