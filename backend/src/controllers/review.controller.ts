import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Review, IReviewModel } from "../models/review.model.js";
import { Product } from "../models/product.model.js";
import { createReviewSchema, updateReviewSchema } from "../utils/validators.js";

// GET /api/products/:productId/reviews (Public)
export const getProductReviews = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId as string)) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
      return;
    }

    const reviews = await Review.find({ product: productId })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/products/:productId/reviews (Protected)
export const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { productId } = req.params;
    const userId = req.user!._id;

    if (!mongoose.Types.ObjectId.isValid(productId as string)) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
      return;
    }

    const validationResult = createReviewSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: validationResult.error.issues[0].message,
      });
      return;
    }

    const { rating, comment } = validationResult.data;

    // 1. Verify product exists
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      res.status(404).json({
        success: false,
        message: "Product not found or is no longer active",
      });
      return;
    }

    // 2. Check if user already reviewed this product (One review per user rule)
    const existingReview = await Review.findOne({
      user: userId,
      product: productId,
    });

    if (existingReview) {
      res.status(400).json({
        success: false,
        message:
          "You have already reviewed this product. You can edit your existing review.",
      });
      return;
    }

    // 3. Create review instance
    const review = new Review({
      user: userId,
      product: new mongoose.Types.ObjectId(productId as string),
      rating,
      comment,
    });

    await review.save(); // Triggers post('save') to update Product rating

    await review.populate("user", "name avatar");

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/reviews/:id (Protected - Edit Own Review)
export const updateReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      res.status(400).json({
        success: false,
        message: "Invalid review ID format",
      });
      return;
    }

    const validationResult = updateReviewSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: validationResult.error.issues[0].message,
      });
      return;
    }

    const review = await Review.findById(id);
    if (!review) {
      res.status(404).json({
        success: false,
        message: "Review not found",
      });
      return;
    }

    // Only review author can edit
    if (review.user.toString() !== userId.toString()) {
      res.status(403).json({
        success: false,
        message: "You can only edit your own reviews",
      });
      return;
    }

    const { rating, comment } = validationResult.data;
    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    await review.save(); // Triggers post('save') average rating update

    await review.populate("user", "name avatar");

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/reviews/:id (Protected - Delete Own Review or Admin)
export const deleteReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;
    const isAdmin = req.user!.role === "admin";

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      res.status(400).json({
        success: false,
        message: "Invalid review ID format",
      });
      return;
    }

    const review = await Review.findById(id);
    if (!review) {
      res.status(404).json({
        success: false,
        message: "Review not found",
      });
      return;
    }

    // Must be owner or admin
    if (review.user.toString() !== userId.toString() && !isAdmin) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to delete this review",
      });
      return;
    }

    const productId = review.product;
    await review.deleteOne();

    // Recalculate average rating after deletion
    await (Review as IReviewModel).calculateAverageRating(productId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
