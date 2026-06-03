import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { aiLimiter } from "../middlewares/rateLimiter.js";
import { writingAssist, suggestTags, blogChat } from "../controllers/aiController.js";

const router = Router();

router.post("/writing-assist", authenticate, aiLimiter, writingAssist);
router.post("/suggest-tags", authenticate, aiLimiter, suggestTags);
router.post("/blog-chat", authenticate, aiLimiter, blogChat);

export default router;
