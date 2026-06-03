import { Router } from "express";
import {
  toggleBookmark,
  getBookmarks,
  getFolders,
  updateBookmarkFolder,
  getBookmarkStatus,
} from "../controllers/bookmarkController.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

// All bookmark routes require authentication
router.use(authenticate);

router.post("/:blogId", toggleBookmark);
router.get("/", getBookmarks);
router.get("/folders", getFolders);
router.patch("/:blogId/folder", updateBookmarkFolder);
router.get("/:blogId/status", getBookmarkStatus);

export default router;
