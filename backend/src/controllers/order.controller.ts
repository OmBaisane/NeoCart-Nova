import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Order, IOrderItemSnapshot } from "../models/order.model.js";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from "../utils/validators.js";

// Generates a unique human-readable tracking number
const generateTrackingNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `NC-NOV-${timestamp}-${randomSuffix}`;
};

// POST /api/orders (Protected - Transaction-Safe Checkout Flow)
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
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

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Fetch user's cart inside session
    const cart = await Cart.findOne({ user: userId }).session(session);
    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        message: "Your cart is empty. Cannot place an order.",
      });
      return;
    }

    const orderItems: IOrderItemSnapshot[] = [];
    let calculatedSubtotal = 0;

    // 2. Validate availability and atomically decrement stock within session
    for (const cartItem of cart.items) {
      const product = await Product.findOne({
        _id: cartItem.product,
        isActive: true,
        isDeleted: false,
      }).session(session);

      if (!product) {
        await session.abortTransaction();
        res.status(400).json({
          success: false,
          message: `Product is no longer available.`,
        });
        return;
      }

      if (product.stock < cartItem.quantity) {
        await session.abortTransaction();
        res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}`,
        });
        return;
      }

      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: product._id,
          stock: { $gte: cartItem.quantity },
          isActive: true,
          isDeleted: false,
        },
        { $inc: { stock: -cartItem.quantity } },
        { session, new: true },
      );

      if (!updatedProduct) {
        await session.abortTransaction();
        res.status(400).json({
          success: false,
          message: `Stock reservation failed due to concurrent checkout for "${product.name}".`,
        });
        return;
      }

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

    calculatedSubtotal = Math.round(calculatedSubtotal * 100) / 100;
    const shippingFee = calculatedSubtotal >= 1000 ? 0 : 99;
    const discount = 0;
    const total =
      Math.round((calculatedSubtotal + shippingFee - discount) * 100) / 100;

    const trackingNumber = generateTrackingNumber();

    // 3. Create order document inside session
    const [order] = await Order.create(
      [
        {
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
        },
      ],
      { session },
    );

    // 4. Clear user's cart inside session
    cart.items = [];
    cart.totalItems = 0;
    cart.subtotal = 0;
    await cart.save({ session });

    // 5. Commit atomic transaction
    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Order placed successfully via Cash on Delivery.",
      order,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
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

// PATCH /api/orders/:id/cancel (Protected - Atomic & Transaction-Safe Customer Cancellation)
export const cancelOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user!._id;
    const isAdmin = req.user!.role === "admin";
    const orderId = req.params.id;

    const query: Record<string, unknown> = {
      _id: orderId,
      orderStatus: { $in: ["pending", "confirmed"] },
    };

    if (!isAdmin) {
      query.user = userId;
    }

    // Atomically transition status inside session to prevent race conditions & double cancellation
    const order = await Order.findOneAndUpdate(
      query,
      {
        $set: {
          orderStatus: "cancelled",
          cancelledAt: new Date(),
        },
      },
      { session, new: true },
    );

    if (!order) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        message:
          "Order cannot be cancelled. It may already be processed, dispatched, or cancelled.",
      });
      return;
    }

    // Restock all items atomically within the exact same transaction session
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } },
        { session },
      );
    }

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully and inventory has been restocked.",
      order,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
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
