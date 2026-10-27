import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Wishlist } from "../models/wishlist.model.js";
import { Product } from "../models/product.model.js";

// Helper interface for populated product
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

// GET /api/wishlist (Protected)
export const getWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!._id;

    let wishlist = await Wishlist.findOne({ user: userId }).populate({
      path: "products",
      select:
        "name slug price discountPrice images stock rating reviewCount category isActive",
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, products: [] });
    }

    // Safely cast and filter active products without using 'any'
    const populatedProducts =
      wishlist.products as unknown as PopulatedProduct[];
    const validProducts = populatedProducts.filter((p) => p && p.isActive);

    res.status(200).json({
      success: true,
      count: validProducts.length,
      products: validProducts,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/wishlist (Protected)
export const addToWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const productId = req.body.productId as string;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({
        success: false,
        message: "Valid product ID is required",
      });
      return;
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      res.status(404).json({
        success: false,
        message: "Product not found or is no longer active",
      });
      return;
    }

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, products: [] });
    }

    const productObjectId = new mongoose.Types.ObjectId(productId);
    if (wishlist.products.some((id) => id.equals(productObjectId))) {
      res.status(400).json({
        success: false,
        message: "Product is already in your wishlist",
      });
      return;
    }

    wishlist.products.push(productObjectId);
    await wishlist.save();

    await wishlist.populate({
      path: "products",
      select:
        "name slug price discountPrice images stock rating reviewCount category isActive",
    });

    res.status(200).json({
      success: true,
      message: "Product added to wishlist successfully",
      products: wishlist.products,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/wishlist/:productId (Protected)
export const removeFromWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const productId = req.params.productId as string;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({
        success: false,
        message: "Valid product ID is required",
      });
      return;
    }

    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      res.status(404).json({
        success: false,
        message: "Wishlist not found",
      });
      return;
    }

    const productObjectId = new mongoose.Types.ObjectId(productId);
    wishlist.products = wishlist.products.filter(
      (id) => !id.equals(productObjectId),
    );

    await wishlist.save();

    await wishlist.populate({
      path: "products",
      select:
        "name slug price discountPrice images stock rating reviewCount category isActive",
    });

    res.status(200).json({
      success: true,
      message: "Product removed from wishlist successfully",
      products: wishlist.products,
    });
  } catch (error) {
    next(error);
  }
};
