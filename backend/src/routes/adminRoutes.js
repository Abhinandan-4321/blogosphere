import { Router } from "express";
import {
  getAllUsers,
  approveUser,
  changeUserRole,
  deleteUser,
  deleteAnyBlog,
  getDashboardStats,
} from "../controllers/adminController.js";
import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/rbac.js";
import { ROLES } from "../utils/constants.js";

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, authorize(ROLES.ADMIN));

router.get("/dashboard", getDashboardStats);
router.get("/users", getAllUsers);
router.patch("/users/:id/approve", approveUser);
router.patch("/users/:id/role", changeUserRole);
router.delete("/users/:id", deleteUser);
router.delete("/blogs/:id", deleteAnyBlog);

export default router;
