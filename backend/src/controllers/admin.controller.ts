import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import {
  updateOrderStatusSchema,
  ALLOWED_STATUS_TRANSITIONS,
  OrderStatus,
} from "../utils/validators.js";

export const getDashboardStats = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const [
      totalProducts,
      totalOrders,
      totalUsers,
      lowStockProducts,
      recentOrders,
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      User.countDocuments({ role: "user" }),
      Product.countDocuments({ stock: { $lte: 5 }, isActive: true }),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("user", "name email"),
    ]);

    const revenueAggregation = await Order.aggregate<{
      _id: null;
      totalRevenue: number;
    }>([
      { $match: { orderStatus: { $ne: "cancelled" } } },
      { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
    ]);

    const totalRevenue = revenueAggregation[0]?.totalRevenue || 0;

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        totalOrders,
        totalUsers,
        totalRevenue,
        lowStockProducts,
      },
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 20);
    const skip = (page - 1) * limit;

    const [totalUsers, users] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.find({ role: "user" })
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      users,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const validatedData = updateOrderStatusSchema.parse(req.body);

    const order = await Order.findById(id).session(session);
    if (!order) {
      await session.abortTransaction();
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    // 1. Terminal state check
    if (
      order.orderStatus === "cancelled" ||
      order.orderStatus === "delivered"
    ) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        message: `Cannot change status of an already ${order.orderStatus} order`,
      });
      return;
    }

    // 2. State transition validation
    const currentStatus = order.orderStatus as OrderStatus;
    const nextStatus = validatedData.orderStatus as OrderStatus;
    const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(nextStatus)) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        message: `Invalid transition from "${currentStatus}" to "${nextStatus}". Permitted transitions: ${allowedTransitions.join(", ") || "none"}`,
      });
      return;
    }

    // 3. Inventory restoration if transitioning to cancelled
    if (nextStatus === "cancelled") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } },
          { session },
        );
      }
    }

    // 4. Apply updates
    order.orderStatus = nextStatus;
    if (validatedData.paymentStatus) {
      order.paymentStatus = validatedData.paymentStatus;
    }
    if (validatedData.trackingNumber !== undefined) {
      order.trackingNumber = validatedData.trackingNumber;
    }

    await order.save({ session });
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: `Order status successfully updated to ${nextStatus}`,
      order,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    await session.endSession();
  }
};
