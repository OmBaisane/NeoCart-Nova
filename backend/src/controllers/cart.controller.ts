import { Request, Response, NextFunction } from "express";
import { Cart, recalculateCart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { addToCartSchema, updateCartItemSchema } from "../utils/validators.js";

const handleCartWriteError = (
  error: unknown,
  res: Response,
  next: NextFunction,
): void => {
  if (error instanceof Error && error.name === "VersionError") {
    res.status(409).json({
      success: false,
      message:
        "Your cart was updated by another request. Please refresh your cart and try again.",
    });
    return;
  }

  next(error);
};

// Safely find or create a cart, handling simultaneous first requests.
const findOrCreateCart = async (userId: string) => {
  const existingCart = await Cart.findOne({ user: userId });

  if (existingCart) return existingCart;

  try {
    return await Cart.create({ user: userId, items: [] });
  } catch (error) {
    // Another request may have created this user's cart first.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      const cart = await Cart.findOne({ user: userId });

      if (cart) return cart;
    }

    throw error;
  }
};

// GET /api/cart (Protected)
export const getCart = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();

    const cart = await findOrCreateCart(userId);

    await cart.populate({
      path: "items.product",
      select: "name slug price discountPrice images stock isActive",
    });

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    handleCartWriteError(error, res, next);
  }
};

// GET /api/cart/validate (Protected - Live Stock & Price Validation)
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

    let hasPriceChanged = false;

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
      }

      const livePrice =
        product.discountPrice !== undefined && product.discountPrice > 0
          ? product.discountPrice
          : product.price;

      if (livePrice !== item.price) {
        item.price = livePrice;
        hasPriceChanged = true;
      }
    }

    // Update cart totals only when product prices actually change.
    if (hasPriceChanged) {
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
    handleCartWriteError(error, res, next);
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

    const product = await Product.findById(productId);

    if (!product || !product.isActive) {
      res.status(404).json({
        success: false,
        message: "Product is not available or does not exist",
      });
      return;
    }

    const cart = await findOrCreateCart(userId.toString());

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
    handleCartWriteError(error, res, next);
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
    handleCartWriteError(error, res, next);
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
    handleCartWriteError(error, res, next);
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
    handleCartWriteError(error, res, next);
  }
};
