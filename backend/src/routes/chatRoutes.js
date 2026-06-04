import { Router } from "express";
import {
  getConversations,
  getHiddenConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  sendImageMessage,
  markConversationRead,
  getMutualFollowers,
  createWhiteboard,
  getWhiteboard,
  saveWhiteboard,
  listWhiteboards,
  hideConversation,
  unhideConversation,
} from "../controllers/chatController.js";
import { authenticate } from "../middlewares/auth.js";
import { uploadImages } from "../middlewares/upload.js";

const router = Router();

router.get("/mutual", authenticate, getMutualFollowers);
router.get("/", authenticate, getConversations);
router.get("/hidden", authenticate, getHiddenConversations);
router.post("/", authenticate, getOrCreateConversation);
router.get("/:id/messages", authenticate, getMessages);
router.post("/:id/messages", authenticate, sendMessage);
router.post(
  "/:id/messages/image",
  authenticate,
  uploadImages,
  sendImageMessage
);
router.patch("/:id/read", authenticate, markConversationRead);
router.patch("/:id/hide", authenticate, hideConversation);
router.patch("/:id/unhide", authenticate, unhideConversation);
router.get("/:id/whiteboards", authenticate, listWhiteboards);
router.post("/:id/whiteboard", authenticate, createWhiteboard);
router.get("/:id/whiteboard/:whiteboardId", authenticate, getWhiteboard);
router.put("/:id/whiteboard/:whiteboardId", authenticate, saveWhiteboard);

export default router;
