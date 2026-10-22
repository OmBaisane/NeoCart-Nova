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

// GET /api/admin/stats (Admin Analytics Summary)
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
      outOfStockProducts,
      recentOrders,
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      User.countDocuments({ role: "user" }),
      Product.countDocuments({ stock: { $gt: 0, $lte: 5 }, isActive: true }),
      Product.countDocuments({ stock: { $lte: 0 }, isActive: true }),
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
        outOfStockProducts,
      },
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 20);
    const search = (req.query.search as string)?.trim();
    const skip = (page - 1) * limit;

    const query: Record<string, any> = { role: "user" };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [totalUsers, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
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

// GET /api/admin/products
export const getAdminProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 20);
    const search = (req.query.search as string)?.trim();
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (status === "active") {
      filter.isActive = true;
    } else if (status === "inactive") {
      filter.isActive = false;
    } else if (status === "low_stock") {
      filter.stock = { $lte: 5 };
      filter.isActive = true;
    }

    const [totalProducts, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
      products,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/products/:id/toggle-status
export const toggleProductStatus = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    product.isActive = !product.isActive;
    await product.save();

    res.status(200).json({
      success: true,
      message: `Product successfully ${product.isActive ? "activated" : "deactivated"}`,
      product,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/orders
export const getAdminOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 20);
    const status = req.query.status as string;
    const search = (req.query.search as string)?.trim();
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (status && status !== "all") {
      filter.orderStatus = status;
    }

    if (search) {
      filter.$or = [
        { trackingNumber: { $regex: search, $options: "i" } },
        { "shippingAddress.fullName": { $regex: search, $options: "i" } },
        { "shippingAddress.city": { $regex: search, $options: "i" } },
      ];
    }

    const [totalOrders, orders] = await Promise.all([
      Order.countDocuments(filter),
      Order.find(filter)
        .populate("user", "name email phone")
        .populate("items.product", "name images price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/orders/:id/status (Strict State Machine & Restock Guard)
export const updateOrderStatus = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const validationResult = updateOrderStatusSchema.safeParse(req.body);
    if (!validationResult.success) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        message: validationResult.error.issues[0].message,
      });
      return;
    }

    const validatedData = validationResult.data;

    const order = await Order.findById(id).session(session);
    if (!order) {
      await session.abortTransaction();
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

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

    if (nextStatus === "cancelled") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } },
          { session },
        );
      }
      order.cancelledAt = new Date();
    }

    if (nextStatus === "delivered") {
      order.deliveredAt = new Date();
      order.paymentStatus = "paid";
    }

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
