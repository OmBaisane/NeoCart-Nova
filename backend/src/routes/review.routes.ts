import { Router } from "express";
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
} from "../controllers/review.controller.js";
import { protect } from "../middleware/auth.middleware.js";

// MergeParams allows access to :productId from the parent product router
const router = Router({ mergeParams: true });

// GET /api/products/:productId/reviews
router.get("/", getProductReviews);

// POST /api/products/:productId/reviews (Protected)
router.post("/", protect, createReview);

export default router;
