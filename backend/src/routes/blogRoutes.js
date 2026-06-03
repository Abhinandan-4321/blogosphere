import { Router } from "express";
import {
  createBlog,
  getBlogs,
  getFeed,
  getTrending,
  getBlogBySlug,
  updateBlog,
  toggleVisibility,
  deleteBlog,
} from "../controllers/blogController.js";
import { addComment, getComments, deleteComment } from "../controllers/commentController.js";
import { toggleLike, getLikeStatus, getLikers } from "../controllers/likeController.js";
import { authenticate, optionalAuth } from "../middlewares/auth.js";
import { uploadCoverImage } from "../middlewares/upload.js";
import validate from "../middlewares/validate.js";
import {
  createBlogSchema,
  updateBlogSchema,
  updateVisibilitySchema,
} from "../validators/blogValidator.js";
import { createCommentSchema } from "../validators/commentValidator.js";

const router = Router();

// Blog CRUD
router.post("/", authenticate, uploadCoverImage, validate(createBlogSchema), createBlog);
router.get("/", optionalAuth, getBlogs);
router.get("/feed", authenticate, getFeed);
router.get("/trending", optionalAuth, getTrending);
router.get("/:slug", optionalAuth, getBlogBySlug);
router.put("/:id", authenticate, uploadCoverImage, validate(updateBlogSchema), updateBlog);
router.patch("/:id/visibility", authenticate, validate(updateVisibilitySchema), toggleVisibility);
router.delete("/:id", authenticate, deleteBlog);

// Like routes
router.post("/:blogId/like", authenticate, toggleLike);
router.get("/:blogId/like", optionalAuth, getLikeStatus);
router.get("/:blogId/likers", getLikers);

// Comment routes
router.post("/:blogId/comments", authenticate, validate(createCommentSchema), addComment);
router.get("/:blogId/comments", getComments);
router.delete("/:blogId/comments/:commentId", authenticate, deleteComment);

export default router;
