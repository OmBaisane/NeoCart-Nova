import { Router } from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = Router();

// All order operations require authentication
router.use(protect);

// Customer endpoints
router.post("/", createOrder);
router.get("/", getMyOrders);
router.get("/:id", getOrderById);
router.patch("/:id/cancel", cancelOrder);

// Admin-only management endpoints
router.patch("/:id/status", adminOnly, updateOrderStatus);

export default router;
