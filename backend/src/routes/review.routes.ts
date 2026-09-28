import { Router } from "express";
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
} from "../controllers/review.controller.js";
import { protect } from "../middleware/auth.middleware.js";

// mergeParams: true allows accessing :productId when nested under /api/products/:productId/reviews
const router = Router({ mergeParams: true });

// GET /api/products/:productId/reviews or /api/reviews
router.get("/", getProductReviews);

// POST /api/products/:productId/reviews (Protected - Create Review)
router.post("/", protect, createReview);

// PATCH /api/reviews/:id (Protected - Author Edit Own Review)
router.patch("/:id", protect, updateReview);

// DELETE /api/reviews/:id (Protected - Author Delete Own Review or Admin Delete)
router.delete("/:id", protect, deleteReview);

export default router;
