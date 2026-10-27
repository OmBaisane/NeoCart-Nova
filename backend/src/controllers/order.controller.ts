import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Order, IOrderItemSnapshot } from "../models/order.model.js";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  ALLOWED_STATUS_TRANSITIONS,
  OrderStatus,
} from "../utils/validators.js";

// Generates a unique human-readable tracking number
const generateTrackingNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `NC-NOV-${timestamp}-${randomSuffix}`;
};

// Check if current MongoDB deployment supports multi-document transactions
export const isReplicaSet = (): boolean => {
  const client = mongoose.connection.getClient();
  return !!(
    client?.options?.replicaSet ||
    (mongoose.connection.db &&
      mongoose.connection.readyState === 1 &&
      Boolean(
        (
          mongoose.connection as unknown as {
            topology?: { description?: { type?: string } };
          }
        ).topology?.description?.type?.includes("ReplicaSet"),
      ))
  );
};

// POST /api/orders (Protected - Transaction-Safe Concurrency Guarded Checkout)
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

  // 1. Fetch user's cart
  const cart = await Cart.findOne({ user: userId });
  if (!cart || cart.items.length === 0) {
    res.status(400).json({
      success: false,
      message: "Your cart is empty. Cannot place an order.",
    });
    return;
  }

  const canUseTransactions = isReplicaSet();
  const session = canUseTransactions ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  const reservedProducts: Array<{ id: string; quantity: number }> = [];

  try {
    const orderItems: IOrderItemSnapshot[] = [];
    let calculatedSubtotal = 0;

    // 2. Concurrency-safe atomic reservation loop
    for (const cartItem of cart.items) {
      // Atomic Decrement: Only decrements if stock >= requested quantity AND product is active
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: cartItem.product,
          stock: { $gte: cartItem.quantity },
          isActive: true,
        },
        { $inc: { stock: -cartItem.quantity } },
        { session: session || undefined, new: true },
      );

      if (!updatedProduct) {
        // Find product to provide accurate error reason
        const existing = await Product.findById(cartItem.product);
        const reason = !existing
          ? "Item was deleted or discontinued."
          : !existing.isActive
            ? `"${existing.name}" is currently inactive.`
            : `Insufficient stock for "${existing.name}". Only ${existing.stock} remaining.`;

        // Roll back any previously decremented items if not in replica transaction
        if (!session) {
          for (const reserved of reservedProducts) {
            await Product.findByIdAndUpdate(reserved.id, {
              $inc: { stock: reserved.quantity },
            });
          }
        } else {
          await session.abortTransaction();
        }

        res.status(409).json({
          success: false,
          message: `Checkout failed: ${reason}`,
        });
        return;
      }

      // Track successfully reserved item
      reservedProducts.push({
        id: cartItem.product.toString(),
        quantity: cartItem.quantity,
      });

      const effectivePrice =
        updatedProduct.discountPrice !== undefined &&
        updatedProduct.discountPrice > 0
          ? updatedProduct.discountPrice
          : updatedProduct.price;

      orderItems.push({
        product: updatedProduct._id,
        name: updatedProduct.name,
        image: updatedProduct.images[0] || "",
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

    // 3. Create order document using model instance
    const order = new Order({
      user: userId,
      items: orderItems,
      shippingAddress,
      subtotal: calculatedSubtotal,
      shippingFee,
      discount,
      total,
      paymentMethod:
        (paymentMethod as "COD" | "Card" | "UPI" | undefined) || "COD",
      paymentStatus: "pending" as const,
      orderStatus: "pending" as const,
      trackingNumber,
    });

    await order.save({ session: session || undefined });

    // 4. Clear user's cart atomically within the checkout boundary
    cart.items = [];
    cart.totalItems = 0;
    cart.subtotal = 0;
    await cart.save({ session: session || undefined });

    if (session) {
      await session.commitTransaction();
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully via Cash on Delivery.",
      order,
    });
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    } else {
      for (const reserved of reservedProducts) {
        await Product.findByIdAndUpdate(reserved.id, {
          $inc: { stock: reserved.quantity },
        });
      }
    }
    next(error);
  } finally {
    if (session) {
      session.endSession();
    }
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

// PATCH /api/orders/:id/cancel (Protected - Customer & Admin Cancellation with Exactly-Once Restock Guard)
export const cancelOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
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

    // Atomically transition status to prevent double-cancellation and race conditions
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

    // Restock all items exactly once
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

// PATCH /api/orders/:id/status (Admin Only - Strict State Machine & Replicaset-Safe Transitions)
export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const canUseTransactions = isReplicaSet();
  const session = canUseTransactions ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    const validationResult = updateOrderStatusSchema.safeParse(req.body);
    if (!validationResult.success) {
      if (session) await session.abortTransaction();
      res.status(400).json({
        success: false,
        message: validationResult.error.issues[0].message,
      });
      return;
    }

    const { orderStatus, paymentStatus, trackingNumber } =
      validationResult.data;

    const order = await (session
      ? Order.findById(req.params.id).session(session)
      : Order.findById(req.params.id));
    if (!order) {
      if (session) await session.abortTransaction();
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    if (!order) {
      if (session) await session.abortTransaction();
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    if (
      order.orderStatus === "cancelled" ||
      order.orderStatus === "delivered"
    ) {
      if (session) await session.abortTransaction();
      res.status(400).json({
        success: false,
        message: `Cannot change status of an already ${order.orderStatus} order`,
      });
      return;
    }

    const currentStatus = order.orderStatus as OrderStatus;
    const nextStatus = orderStatus as OrderStatus;
    const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(nextStatus)) {
      if (session) await session.abortTransaction();
      res.status(400).json({
        success: false,
        message: `Invalid transition from "${currentStatus}" to "${nextStatus}". Permitted transitions: ${allowedTransitions.join(", ") || "none"}`,
      });
      return;
    }

    // If transitioned to 'cancelled' from active state, restock items exactly once
    if (nextStatus === "cancelled") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } },
          { session: session || undefined },
        );
      }
      order.cancelledAt = new Date();
    }

    if (nextStatus === "delivered") {
      order.deliveredAt = new Date();
      order.paymentStatus = "paid";
    }

    order.orderStatus = nextStatus;

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    if (trackingNumber !== undefined) {
      order.trackingNumber = trackingNumber;
    }

    await order.save({ session: session || undefined });
    if (session) await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: `Order status successfully updated to ${nextStatus}`,
      order,
    });
  } catch (error) {
    if (session) await session.abortTransaction();
    next(error);
  } finally {
    if (session) session.endSession();
  }
};
