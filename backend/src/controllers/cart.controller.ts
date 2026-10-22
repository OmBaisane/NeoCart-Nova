import { Request, Response, NextFunction } from "express";
import { Cart, recalculateCart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { addToCartSchema, updateCartItemSchema } from "../utils/validators.js";

// GET /api/cart (Protected)
export const getCart = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!._id;

    let cart = await Cart.findOne({ user: userId }).populate({
      path: "items.product",
      select: "name slug price discountPrice images stock isActive",
    });

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/cart/validate (Protected - Live Stock & Price Concurrency Guard)
export const validateCart = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart || cart.items.length === 0) {
      res.status(200).json({
        success: true,
        isValid: false,
        message: "Your cart is empty.",
        issues: [],
      });
      return;
    }

    const issues: Array<{
      productId: string;
      name: string;
      issueType:
        | "OUT_OF_STOCK"
        | "INSUFFICIENT_STOCK"
        | "INACTIVE"
        | "PRICE_CHANGED";
      message: string;
      availableStock: number;
      requestedQuantity: number;
    }> = [];

    let hasPriceOrStockMismatch = false;

    for (const item of cart.items) {
      const product = await Product.findById(item.product);

      if (!product || !product.isActive) {
        issues.push({
          productId: item.product.toString(),
          name: product?.name || "Discontinued Item",
          issueType: "INACTIVE",
          message: `"${product?.name || "Item"}" is no longer available.`,
          availableStock: 0,
          requestedQuantity: item.quantity,
        });
        hasPriceOrStockMismatch = true;
        continue;
      }

      if (product.stock === 0) {
        issues.push({
          productId: product._id.toString(),
          name: product.name,
          issueType: "OUT_OF_STOCK",
          message: `"${product.name}" is completely out of stock.`,
          availableStock: 0,
          requestedQuantity: item.quantity,
        });
        hasPriceOrStockMismatch = true;
        continue;
      }

      if (product.stock < item.quantity) {
        issues.push({
          productId: product._id.toString(),
          name: product.name,
          issueType: "INSUFFICIENT_STOCK",
          message: `Only ${product.stock} units available for "${product.name}" (requested ${item.quantity}).`,
          availableStock: product.stock,
          requestedQuantity: item.quantity,
        });
        hasPriceOrStockMismatch = true;
      }

      const livePrice =
        product.discountPrice !== undefined && product.discountPrice > 0
          ? product.discountPrice
          : product.price;

      if (livePrice !== item.price) {
        item.price = livePrice;
        hasPriceOrStockMismatch = true;
      }
    }

    // Auto-update price adjustments if live product prices shifted
    if (hasPriceOrStockMismatch) {
      recalculateCart(cart);
      await cart.save();
    }

    res.status(200).json({
      success: true,
      isValid: issues.length === 0,
      issues,
      cart,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/cart/items (Protected - Add item or increment)
export const addToCart = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validationResult = addToCartSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: validationResult.error.issues[0].message,
      });
      return;
    }

    const { productId, quantity } = validationResult.data;
    const userId = req.user!._id;

    // Fetch live product from DB
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      res.status(404).json({
        success: false,
        message: "Product is not available or does not exist",
      });
      return;
    }

    // Fetch or initialize user cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    const currentQtyInCart =
      existingItemIndex > -1 ? cart.items[existingItemIndex].quantity : 0;
    const finalQuantity = currentQtyInCart + quantity;

    if (finalQuantity > product.stock) {
      res.status(400).json({
        success: false,
        message: `Insufficient stock. Only ${product.stock} units available (${currentQtyInCart} already in your cart)`,
      });
      return;
    }

    const effectivePrice =
      product.discountPrice !== undefined && product.discountPrice > 0
        ? product.discountPrice
        : product.price;

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity = finalQuantity;
      cart.items[existingItemIndex].price = effectivePrice;
    } else {
      cart.items.push({
        product: product._id,
        quantity,
        price: effectivePrice,
      });
    }

    recalculateCart(cart);
    await cart.save();

    await cart.populate({
      path: "items.product",
      select: "name slug price discountPrice images stock isActive",
    });

    res.status(200).json({
      success: true,
      message: "Item added to cart",
      cart,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/cart/items/:productId (Protected - Set exact quantity)
export const updateCartItemQuantity = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { productId } = req.params;
    const validationResult = updateCartItemSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: validationResult.error.issues[0].message,
      });
      return;
    }

    const { quantity } = validationResult.data;
    const userId = req.user!._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      res.status(404).json({
        success: false,
        message: "Cart not found",
      });
      return;
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (itemIndex === -1) {
      res.status(404).json({
        success: false,
        message: "Item not found in your cart",
      });
      return;
    }

    if (quantity === 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      const product = await Product.findById(productId);
      if (!product || !product.isActive) {
        res.status(400).json({
          success: false,
          message: "Product is no longer active or available",
        });
        return;
      }

      if (quantity > product.stock) {
        res.status(400).json({
          success: false,
          message: `Cannot update. Only ${product.stock} units in stock.`,
        });
        return;
      }

      const effectivePrice =
        product.discountPrice !== undefined && product.discountPrice > 0
          ? product.discountPrice
          : product.price;

      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].price = effectivePrice;
    }

    recalculateCart(cart);
    await cart.save();

    await cart.populate({
      path: "items.product",
      select: "name slug price discountPrice images stock isActive",
    });

    res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      cart,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/cart/items/:productId (Protected - Remove single item)
export const removeCartItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { productId } = req.params;
    const userId = req.user!._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      res.status(404).json({
        success: false,
        message: "Cart not found",
      });
      return;
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId,
    );

    recalculateCart(cart);
    await cart.save();

    await cart.populate({
      path: "items.product",
      select: "name slug price discountPrice images stock isActive",
    });

    res.status(200).json({
      success: true,
      message: "Item removed from cart",
      cart,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/cart (Protected - Clear entire cart)
export const clearCart = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!._id;

    const cart = await Cart.findOne({ user: userId });
    if (cart) {
      cart.items = [];
      cart.totalItems = 0;
      cart.subtotal = 0;
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      cart: cart || { items: [], totalItems: 0, subtotal: 0 },
    });
  } catch (error) {
    next(error);
  }
};
