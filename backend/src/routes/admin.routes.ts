import { Router } from "express";
import {
  getDashboardStats,
  getAllUsers,
  getAdminProducts,
  toggleProductStatus,
  getAdminOrders,
  updateOrderStatus,
} from "../controllers/admin.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = Router();

// All admin routes require both session authentication and admin role
router.use(protect, adminOnly);

router.get("/stats", getDashboardStats);
router.get("/users", getAllUsers);

// Dedicated Admin Catalog endpoints
router.get("/products", getAdminProducts);
router.patch("/products/:id/toggle-status", toggleProductStatus);

// Dedicated Admin Orders endpoints
router.get("/orders", getAdminOrders);
router.patch("/orders/:id/status", updateOrderStatus);

export default router;
