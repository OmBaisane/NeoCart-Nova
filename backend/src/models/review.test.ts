import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { Review } from "./review.model";

const validReview = () => ({
  user: new mongoose.Types.ObjectId(),
  product: new mongoose.Types.ObjectId(),
  rating: 5,
  comment: "Excellent product!",
});

describe("Review model", () => {
  it("accepts a valid review", async () => {
    const review = new Review(validReview());

    await expect(review.validate()).resolves.toBeUndefined();
  });

  it("requires user and product references", async () => {
    const review = new Review({});

    await expect(review.validate()).rejects.toThrow();
  });

  it("rejects ratings below one or above five", async () => {
    for (const rating of [0, 6]) {
      const review = new Review({
        ...validReview(),
        rating,
      });

      await expect(review.validate()).rejects.toThrow();
    }
  });

  it("rejects fractional ratings", async () => {
    const review = new Review({
      ...validReview(),
      rating: 4.5,
    });

    await expect(review.validate()).rejects.toThrow();
  });

  it("trims review comments", async () => {
    const review = new Review({
      ...validReview(),
      comment: "  Excellent product!  ",
    });

    await review.validate();

    expect(review.comment).toBe("Excellent product!");
  });

  it("rejects comments longer than 500 characters", async () => {
    const review = new Review({
      ...validReview(),
      comment: "a".repeat(501),
    });

    await expect(review.validate()).rejects.toThrow();
  });

  it("rejects more than three review images", async () => {
    const review = new Review({
      ...validReview(),
      images: [
        "https://example.com/1.jpg",
        "https://example.com/2.jpg",
        "https://example.com/3.jpg",
        "https://example.com/4.jpg",
      ],
    });

    await expect(review.validate()).rejects.toThrow();
  });

  it("defaults verified purchase to false", () => {
    const review = new Review(validReview());

    expect(review.isVerifiedPurchase).toBe(false);
  });

  it("defines a unique user-product index", () => {
    const indexes = Review.schema.indexes();

    expect(
      indexes.some(
        ([fields, options]) =>
          fields.user === 1 && fields.product === 1 && options.unique === true,
      ),
    ).toBe(true);
  });
});
