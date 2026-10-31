import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Wishlist } from "../models/wishlist.model.js";
import { Product } from "../models/product.model.js";

const PRODUCT_POPULATE = {
  path: "products",
  select:
    "name slug price discountPrice images stock rating reviewCount category isActive",
};

interface PopulatedProduct {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number;
  images: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
}

// GET /api/wishlist
export const getWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!._id;

    const wishlist = await Wishlist.findOne({ user: userId }).populate(
      PRODUCT_POPULATE,
    );

    const populatedProducts = (wishlist?.products ||
      []) as unknown as PopulatedProduct[];

    const validProducts = populatedProducts.filter(
      (product) => product && product.isActive,
    );

    res.status(200).json({
      success: true,
      count: validProducts.length,
      products: validProducts,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/wishlist
export const addToWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const productId = req.body.productId as string;

    if (
      typeof productId !== "string" ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      res.status(400).json({
        success: false,
        message: "Valid product ID is required",
      });
      return;
    }

    const productObjectId = new mongoose.Types.ObjectId(productId);

    const product = await Product.findOne({
      _id: productObjectId,
      isActive: true,
    }).select("_id");

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found or is no longer active",
      });
      return;
    }

    // Create wishlist if it does not exist.
    // The unique user index protects against duplicate wishlists.
    try {
      await Wishlist.updateOne(
        { user: userId },
        { $setOnInsert: { user: userId, products: [] } },
        { upsert: true },
      );
    } catch (error) {
      // Another concurrent request may have created the wishlist.
      if (
        !(
          error instanceof mongoose.mongo.MongoServerError &&
          error.code === 11000
        )
      ) {
        throw error;
      }
    }

    // Atomic addition prevents duplicate product IDs.
    await Wishlist.updateOne(
      { user: userId },
      { $addToSet: { products: productObjectId } },
    );

    const wishlist = await Wishlist.findOne({ user: userId }).populate(
      PRODUCT_POPULATE,
    );

    const populatedProducts = (wishlist?.products ||
      []) as unknown as PopulatedProduct[];

    const validProducts = populatedProducts.filter(
      (item) => item && item.isActive,
    );

    res.status(200).json({
      success: true,
      message: "Product added to wishlist successfully",
      count: validProducts.length,
      products: validProducts,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/wishlist/:productId
export const removeFromWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const productId = req.params.productId as string;

    if (
      typeof productId !== "string" ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      res.status(400).json({
        success: false,
        message: "Valid product ID is required",
      });
      return;
    }

    const productObjectId = new mongoose.Types.ObjectId(productId);

    // Atomic removal; safe even if the product is already absent.
    await Wishlist.updateOne(
      { user: userId },
      { $pull: { products: productObjectId } },
    );

    const wishlist = await Wishlist.findOne({ user: userId }).populate(
      PRODUCT_POPULATE,
    );

    const populatedProducts = (wishlist?.products ||
      []) as unknown as PopulatedProduct[];

    const validProducts = populatedProducts.filter(
      (item) => item && item.isActive,
    );

    res.status(200).json({
      success: true,
      message: "Product removed from wishlist successfully",
      count: validProducts.length,
      products: validProducts,
    });
  } catch (error) {
    next(error);
  }
};
