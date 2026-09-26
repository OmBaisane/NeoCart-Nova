import { Request, Response, NextFunction } from "express";
import { Order, IOrderItemSnapshot } from "../models/order.model.js";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from "../utils/validators.js";

// Helper: Generates unique human-readable tracking number
const generateTrackingNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `NC-NOV-${timestamp}-${randomSuffix}`;
};

// POST /api/orders (Protected - Checkout Flow with Atomic Stock Reservation)
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validationResult = createOrderSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: validationResult.error.issues[0].message,
      });
      return;
    }

    const { shippingAddress, paymentMethod } = validationResult.data;
    const userId = req.user!._id;

    // 1. Fetch user's cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart || cart.items.length === 0) {
      res.status(400).json({
        success: false,
        message: "Your cart is empty. Cannot place an order.",
      });
      return;
    }

    const orderItems: IOrderItemSnapshot[] = [];
    let calculatedSubtotal = 0;
    const reservedProducts: Array<{ productId: string; quantity: number }> = [];

    // 2. Atomic Stock Reservation Step
    for (const cartItem of cart.items) {
      const product = await Product.findById(cartItem.product);

      if (!product || !product.isActive) {
        // Rollback any items already decremented
        for (const reserved of reservedProducts) {
          await Product.findByIdAndUpdate(reserved.productId, {
            $inc: { stock: reserved.quantity },
          });
        }
        res.status(400).json({
          success: false,
          message: `Product "${cartItem.product}" is no longer available.`,
        });
        return;
      }

      // Atomic conditional update: ONLY decrements if stock >= requested quantity
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: product._id,
          stock: { $gte: cartItem.quantity },
          isActive: true,
        },
        { $inc: { stock: -cartItem.quantity } },
        { new: true },
      );

      if (!updatedProduct) {
        // Rollback any items already decremented in this transaction
        for (const reserved of reservedProducts) {
          await Product.findByIdAndUpdate(reserved.productId, {
            $inc: { stock: reserved.quantity },
          });
        }
        res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}".`,
        });
        return;
      }

      reservedProducts.push({
        productId: product._id.toString(),
        quantity: cartItem.quantity,
      });

      // Trusted price snapshot directly from DB
      const effectivePrice =
        product.discountPrice !== undefined && product.discountPrice > 0
          ? product.discountPrice
          : product.price;

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images[0] || "",
        price: effectivePrice,
        quantity: cartItem.quantity,
      });

      calculatedSubtotal += effectivePrice * cartItem.quantity;
    }

    // 3. Calculate delivery fee & grand total server-side
    calculatedSubtotal = Math.round(calculatedSubtotal * 100) / 100;
    const shippingFee = calculatedSubtotal >= 1000 ? 0 : 99;
    const discount = 0;
    const total =
      Math.round((calculatedSubtotal + shippingFee - discount) * 100) / 100;

    // 4. Create the Order Document with tracking number
    const trackingNumber = generateTrackingNumber();

    const order = await Order.create({
      user: userId,
      items: orderItems,
      shippingAddress,
      subtotal: calculatedSubtotal,
      shippingFee,
      discount,
      total,
      paymentMethod: paymentMethod || "COD",
      paymentStatus: "pending",
      orderStatus: "pending",
      trackingNumber,
    });

    // 5. Clear user's cart
    cart.items = [];
    cart.totalItems = 0;
    cart.subtotal = 0;
    await cart.save();

    res.status(201).json({
      success: true,
      message: "Order placed successfully via Cash on Delivery.",
      order,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders (Protected - Customer & Admin Order History)
export const getMyOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const isAdmin = req.user!.role === "admin";

    const filter = isAdmin ? {} : { user: userId };

    const orders = await Order.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/:id (Protected - Specific Order Details)
export const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    const isOwner = order.user.toString() === req.user!._id.toString();
    const isAdmin = req.user!.role === "admin";

    if (!isOwner && !isAdmin) {
      res.status(403).json({
        success: false,
        message:
          "Access denied. You do not have permission to view this order.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/orders/:id/cancel (Protected - Atomic & Idempotent Customer Cancellation)
export const cancelOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const isAdmin = req.user!.role === "admin";
    const orderId = req.params.id;

    // Build ownership query
    const query: Record<string, unknown> = {
      _id: orderId,
      orderStatus: { $in: ["pending", "confirmed"] },
    };

    if (!isAdmin) {
      query.user = userId;
    }

    // Atomically transition status from pending/confirmed to cancelled
    const order = await Order.findOneAndUpdate(
      query,
      {
        $set: {
          orderStatus: "cancelled",
          cancelledAt: new Date(),
        },
      },
      { new: true },
    );

    if (!order) {
      res.status(400).json({
        success: false,
        message:
          "Order cannot be cancelled. It may already be processed, dispatched, or cancelled.",
      });
      return;
    }

    // Restock items back to database (executes exactly once)
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully and inventory has been restocked.",
      order,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/orders/:id/status (Admin Only - Status & Tracking Update)
export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validationResult = updateOrderStatusSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: validationResult.error.issues[0].message,
      });
      return;
    }

    const { orderStatus, paymentStatus, trackingNumber } =
      validationResult.data;

    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    order.orderStatus = orderStatus;

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    if (orderStatus === "delivered") {
      order.deliveredAt = new Date();
      order.paymentStatus = "paid";
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      order,
    });
  } catch (error) {
    next(error);
  }
};
