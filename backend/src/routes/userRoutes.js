import { Router } from "express";
import {
  getMe,
  updateProfile,
  updateAvatar,
  changePassword,
  getUserProfile,
  getUserBlogs,
  getLikedPosts,
} from "../controllers/userController.js";
import {
  toggleFollow,
  getFollowers,
  getFollowing,
  removeFollower,
} from "../controllers/followController.js";
import { authenticate, optionalAuth } from "../middlewares/auth.js";
import { uploadAvatar } from "../middlewares/upload.js";
import validate from "../middlewares/validate.js";
import {
  updateProfileSchema,
  changePasswordSchema,
} from "../validators/userValidator.js";

const router = Router();

// Authenticated user routes
router.get("/me", authenticate, getMe);
router.put("/me", authenticate, validate(updateProfileSchema), updateProfile);
router.put("/me/avatar", authenticate, uploadAvatar, updateAvatar);
router.put("/me/password", authenticate, validate(changePasswordSchema), changePassword);
router.get("/me/liked-posts", authenticate, getLikedPosts);

// Public user profile routes
router.get("/:id", optionalAuth, getUserProfile);
router.get("/:id/blogs", optionalAuth, getUserBlogs);

// Follow routes
router.post("/:id/follow", authenticate, toggleFollow);
router.delete("/:id/follower", authenticate, removeFollower);
router.get("/:id/followers", getFollowers);
router.get("/:id/following", getFollowing);

export default router;
