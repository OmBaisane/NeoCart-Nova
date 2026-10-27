import { Router } from "express";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import {
  protect,
  optionalProtect,
  adminOnly,
} from "../middleware/auth.middleware.js";

const router = Router();

// Public routes (with optional auth extraction for privileged filters)
router.get("/", optionalProtect, getCategories);
router.get("/:id", optionalProtect, getCategoryById);

// Admin-protected routes
router.post("/", protect, adminOnly, createCategory);
router.patch("/:id", protect, adminOnly, updateCategory);
router.delete("/:id", protect, adminOnly, deleteCategory);

export default router;
