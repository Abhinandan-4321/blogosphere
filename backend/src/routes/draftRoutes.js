import { Router } from "express";
import { getDrafts, getDraft, deleteDraft } from "../controllers/draftController.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

router.get("/", authenticate, getDrafts);
router.get("/:id", authenticate, getDraft);
router.delete("/:id", authenticate, deleteDraft);

export default router;
