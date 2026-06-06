import express from "express";
import {
  requestDeletion,
  getDeletionRequest,
  cancelDeletionRequest,
  getPendingDeletionRequests,
  approveDeletionRequest,
  rejectDeletionRequest,
} from "../controllers/deletionRequestController.js";
import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

// User routes (protected)
router.post("/", authenticate, requestDeletion);
router.get("/", authenticate, getDeletionRequest);
router.delete("/", authenticate, cancelDeletionRequest);

// Admin routes
router.get("/admin/pending", authenticate, authorize(["admin"]), getPendingDeletionRequests);
router.post("/admin/:id/approve", authenticate, authorize(["admin"]), approveDeletionRequest);
router.post("/admin/:id/reject", authenticate, authorize(["admin"]), rejectDeletionRequest);

export default router;
