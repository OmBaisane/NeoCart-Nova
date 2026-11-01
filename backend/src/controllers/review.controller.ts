import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Review, IReviewModel } from "../models/review.model.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { createReviewSchema, updateReviewSchema } from "../utils/validators.js";

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === 11000;

// GET /api/products/:productId/reviews
export const getProductReviews = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const productId = req.params.productId;

    if (
      typeof productId !== "string" ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
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

// POST /api/products/:productId/reviews
export const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const productId = req.params.productId;
    const userId = req.user!._id;

    if (
      typeof productId !== "string" ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
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

    const { rating, comment, images } = validationResult.data;
    const productObjectId = new mongoose.Types.ObjectId(productId);

    const product = await Product.findById(productObjectId);

    if (!product || !product.isActive) {
      res.status(404).json({
        success: false,
        message: "Product not found or is no longer active",
      });
      return;
    }

    const existingReview = await Review.findOne({
      user: userId,
      product: productObjectId,
    });

    if (existingReview) {
      res.status(409).json({
        success: false,
        message:
          "You have already reviewed this product. You can update your existing review.",
      });
      return;
    }

    const deliveredOrder = await Order.findOne({
      user: userId,
      orderStatus: "delivered",
      "items.product": productObjectId,
    }).select("_id");

    const review = new Review({
      user: userId,
      product: productObjectId,
      rating,
      comment,
      images: images || [],
      isVerifiedPurchase: Boolean(deliveredOrder),
    });

    await review.save();
    await review.populate("user", "name avatar");

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    // The unique { user, product } index also protects concurrent requests.
    if (isDuplicateKeyError(error)) {
      res.status(409).json({
        success: false,
        message:
          "You have already reviewed this product. You can update your existing review.",
      });
      return;
    }

    next(error);
  }
};

// PATCH /api/reviews/:id
export const updateReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id;
    const userId = req.user!._id;

    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
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

    if (review.user.toString() !== userId.toString()) {
      res.status(403).json({
        success: false,
        message: "You can only edit your own reviews",
      });
      return;
    }

    const { rating, comment, images } = validationResult.data;

    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    if (images !== undefined) review.images = images;

    await review.save();
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

// DELETE /api/reviews/:id
export const deleteReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id;
    const userId = req.user!._id;
    const isAdmin = req.user!.role === "admin";

    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
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

    if (review.user.toString() !== userId.toString() && !isAdmin) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to delete this review",
      });
      return;
    }

    const productId = review.product;

    await review.deleteOne();

    await (Review as IReviewModel).calculateAverageRating(productId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
