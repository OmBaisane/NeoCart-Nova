import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { Product } from "./product.model.js";

export interface IReview extends Document {
  user: Types.ObjectId;
  product: Types.ObjectId;
  rating: number;
  comment: string;
  images: string[];
  isVerifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReviewModel extends Model<IReview> {
  calculateAverageRating(productId: Types.ObjectId): Promise<void>;
}

const reviewSchema = new Schema<IReview, IReviewModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
      index: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Review must belong to a product"],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, "Please provide a rating between 1 and 5"],
      min: [1, "Rating cannot be less than 1"],
      max: [5, "Rating cannot be more than 5"],
    },
    comment: {
      type: String,
      required: [true, "Please provide a review comment"],
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length <= 3;
        },
        message: "A review cannot exceed 3 attached proof images",
      },
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Enforce rule: 1 review per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Static method to recalculate product's average rating and reviewCount
reviewSchema.statics.calculateAverageRating = async function (
  productId: Types.ObjectId,
): Promise<void> {
  const stats = await this.aggregate([
    {
      $match: { product: productId },
    },
    {
      $group: {
        _id: "$product",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      numReviews: stats[0].nRating,
      reviewCount: stats[0].nRating,
      rating: Math.round(stats[0].avgRating * 10) / 10,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      numReviews: 0,
      reviewCount: 0,
      rating: 0,
    });
  }
};

// Post-save hook to update rating when a review is created or updated
reviewSchema.post("save", async function () {
  const ReviewModel = this.constructor as IReviewModel;
  await ReviewModel.calculateAverageRating(this.product);
});

export const Review: IReviewModel = mongoose.model<IReview, IReviewModel>(
  "Review",
  reviewSchema,
);
