import { Router } from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../controllers/notificationController.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

router.get("/", authenticate, getNotifications);
router.patch("/read-all", authenticate, markAllAsRead);
router.patch("/:id/read", authenticate, markAsRead);
router.delete("/", authenticate, clearAllNotifications);
router.delete("/:id", authenticate, deleteNotification);

export default router;
