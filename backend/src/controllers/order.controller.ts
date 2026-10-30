import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { randomBytes } from "node:crypto";
import { Order, IOrderItemSnapshot } from "../models/order.model.js";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  ALLOWED_STATUS_TRANSITIONS,
  OrderStatus,
} from "../utils/validators.js";

// Generates a stronger human-readable tracking number.
const generateTrackingNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomSuffix = randomBytes(4).toString("hex").toUpperCase();

  return `NC-NOV-${timestamp}-${randomSuffix}`;
};

// MongoDB transactions require a replica set, sharded cluster,
// or another transaction-capable deployment.
export const isReplicaSet = (): boolean => {
  if (mongoose.connection.readyState !== 1) return false;

  const client = mongoose.connection.getClient();

  const topologyType = (
    client as unknown as {
      topology?: { description?: { type?: string } };
    }
  ).topology?.description?.type;

  return Boolean(
    client.options.replicaSet ||
    topologyType?.startsWith("ReplicaSet") ||
    topologyType === "Sharded" ||
    topologyType === "LoadBalanced",
  );
};

const sendTransactionUnavailable = (res: Response): void => {
  res.status(503).json({
    success: false,
    message:
      "This operation requires MongoDB transaction support. Configure MongoDB as a replica set or use a transaction-capable cluster.",
  });
};

const roundCurrency = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

// Restores inventory inside the caller's active transaction.
// A missing product is skipped because a deleted product has no
// inventory record left to restore.
const restoreOrderInventory = async (
  items: IOrderItemSnapshot[],
  session: mongoose.ClientSession,
): Promise<void> => {
  for (const item of items) {
    await Product.updateOne(
      { _id: item.product },
      { $inc: { stock: item.quantity } },
      { session },
    );
  }
};

// POST /api/orders (Protected - Transaction-Safe Checkout)
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

  if (!isReplicaSet()) {
    sendTransactionUnavailable(res);
    return;
  }

  const { shippingAddress, paymentMethod } = validationResult.data;
  const userId = req.user!._id;
  let session: mongoose.ClientSession | undefined;

  try {
    session = await mongoose.startSession();
    session.startTransaction();

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

    // Atomically reserve every product's current stock.
    for (const cartItem of cart.items) {
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: cartItem.product,
          stock: { $gte: cartItem.quantity },
          isActive: true,
        },
        {
          $inc: { stock: -cartItem.quantity },
        },
        {
          session,
          new: true,
        },
      );

      if (!updatedProduct) {
        const existing = await Product.findById(cartItem.product).session(
          session,
        );

        const reason = !existing
          ? "An item was deleted or discontinued."
          : !existing.isActive
            ? `"${existing.name}" is currently unavailable.`
            : `Insufficient stock for "${existing.name}". Only ${existing.stock} units remain.`;

        await session.abortTransaction();

        res.status(409).json({
          success: false,
          message: `Checkout failed: ${reason}`,
        });
        return;
      }

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

    calculatedSubtotal = roundCurrency(calculatedSubtotal);

    const shippingFee = calculatedSubtotal >= 1000 ? 0 : 99;
    const discount = 0;
    const total = roundCurrency(calculatedSubtotal + shippingFee - discount);

    const order = new Order({
      user: userId,
      items: orderItems,
      shippingAddress,
      subtotal: calculatedSubtotal,
      shippingFee,
      discount,
      total,
      paymentMethod,
      paymentStatus: "pending",
      orderStatus: "pending",
      trackingNumber: generateTrackingNumber(),
      inventoryRestocked: false,
    });

    await order.save({ session });

    // Clear the same cart document within this transaction.
    cart.items = [];
    cart.totalItems = 0;
    cart.subtotal = 0;

    await cart.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Order placed successfully via Cash on Delivery.",
      order,
    });
  } catch (error) {
    if (session?.inTransaction()) {
      await session.abortTransaction();
    }

    next(error);
  } finally {
    if (session) {
      await session.endSession();
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
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
      return;
    }

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

// PATCH /api/orders/:id/cancel
// Protected - Transaction-Safe Exactly-Once Inventory Restoration
export const cancelOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({
      success: false,
      message: "Invalid order ID.",
    });
    return;
  }

  if (!isReplicaSet()) {
    sendTransactionUnavailable(res);
    return;
  }

  const userId = req.user!._id;
  const isAdmin = req.user!.role === "admin";
  let session: mongoose.ClientSession | undefined;

  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const query: Record<string, unknown> = {
      _id: req.params.id,
      orderStatus: { $in: ["pending", "confirmed"] },
      inventoryRestocked: { $ne: true },
    };

    if (!isAdmin) {
      query.user = userId;
    }

    // The state transition and restoration marker are written
    // together. Concurrent cancellation attempts cannot both win.
    const order = await Order.findOneAndUpdate(
      query,
      {
        $set: {
          orderStatus: "cancelled",
          cancelledAt: new Date(),
          inventoryRestocked: true,
        },
      },
      {
        new: true,
        session,
        runValidators: true,
      },
    );

    if (!order) {
      await session.abortTransaction();

      res.status(400).json({
        success: false,
        message:
          "Order cannot be cancelled. It may not exist, may belong to another user, or may already be processed or cancelled.",
      });
      return;
    }

    await restoreOrderInventory(order.items, session);

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully and inventory has been restored.",
      order,
    });
  } catch (error) {
    if (session?.inTransaction()) {
      await session.abortTransaction();
    }

    next(error);
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

// PATCH /api/orders/:id/status
// Admin Only - Transaction-Safe State Machine
export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const validationResult = updateOrderStatusSchema.safeParse(req.body);

  if (!validationResult.success) {
    res.status(400).json({
      success: false,
      message: validationResult.error.issues[0].message,
    });
    return;
  }

  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({
      success: false,
      message: "Invalid order ID.",
    });
    return;
  }

  if (!isReplicaSet()) {
    sendTransactionUnavailable(res);
    return;
  }

  const { orderStatus, paymentStatus, trackingNumber } = validationResult.data;

  let session: mongoose.ClientSession | undefined;

  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      await session.abortTransaction();

      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    const currentStatus = order.orderStatus as OrderStatus;
    const nextStatus = orderStatus as OrderStatus;

    const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(nextStatus)) {
      await session.abortTransaction();

      res.status(400).json({
        success: false,
        message: `Invalid transition from "${currentStatus}" to "${nextStatus}". Permitted transitions: ${allowedTransitions.join(", ") || "none"}`,
      });
      return;
    }

    // COD orders remain pending until delivery.
    // Payment integrations and manual refunds are not implemented.
    const resultingPaymentStatus =
      nextStatus === "delivered" ? "paid" : order.paymentStatus;

    if (
      paymentStatus !== undefined &&
      paymentStatus !== resultingPaymentStatus
    ) {
      await session.abortTransaction();

      res.status(400).json({
        success: false,
        message:
          "Payment status cannot be changed independently. COD orders are marked paid only when delivered.",
      });
      return;
    }

    if (nextStatus === "cancelled") {
      if (order.inventoryRestocked) {
        await session.abortTransaction();

        res.status(409).json({
          success: false,
          message:
            "Inventory for this order has already been restored. Cancellation cannot be repeated.",
        });
        return;
      }

      await restoreOrderInventory(order.items, session);

      order.inventoryRestocked = true;
      order.cancelledAt = new Date();
    }

    if (nextStatus === "delivered") {
      order.deliveredAt = new Date();
      order.paymentStatus = "paid";
    }

    order.orderStatus = nextStatus;

    if (trackingNumber !== undefined) {
      order.trackingNumber = trackingNumber;
    }

    await order.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: `Order status successfully updated to ${nextStatus}`,
      order,
    });
  } catch (error) {
    if (session?.inTransaction()) {
      await session.abortTransaction();
    }

    next(error);
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};
