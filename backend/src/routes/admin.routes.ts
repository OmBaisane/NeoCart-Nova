import { Router } from "express";
import {
  getDashboardStats,
  getAllUsers,
  getAdminProducts,
  toggleProductStatus,
  getAdminOrders,
  updateOrderStatus,
} from "../controllers/admin.controller.js";
import { getAdminAnalytics } from "../controllers/analytics.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protect, adminOnly);

router.get("/stats", getDashboardStats);
router.get("/analytics", getAdminAnalytics);

router.get("/users", getAllUsers);

router.get("/products", getAdminProducts);
router.patch("/products/:id/toggle-status", toggleProductStatus);

router.get("/orders", getAdminOrders);
router.patch("/orders/:id/status", updateOrderStatus);

export default router;
