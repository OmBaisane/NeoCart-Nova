import { Router } from "express";
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";
import reviewRouter from "./review.routes.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = Router();

// Re-route into review router for reviews on a product
router.use("/:productId/reviews", reviewRouter);

// Public storefront routes
router.get("/", getProducts);
router.get("/:slug", getProductBySlug);

// Admin-only management routes
router.post("/", protect, adminOnly, createProduct);
router.patch("/:id", protect, adminOnly, updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

export default router;
