import { Router } from "express";
import {
  getDashboardStats,
  getAllUsers,
  updateOrderStatus,
} from "../controllers/admin.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = Router();

// All admin routes require both session authentication and admin role
router.use(protect, adminOnly);

router.get("/stats", getDashboardStats);
router.get("/users", getAllUsers);
router.patch("/orders/:id/status", updateOrderStatus);

export default router;
