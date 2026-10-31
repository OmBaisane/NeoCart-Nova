import { Request, Response, NextFunction } from "express";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { updateOrderStatus as updateOrderStatusSafely } from "./order.controller.js";
import { boundedPositiveInt, escapeRegex } from "../utils/querySafety.js";

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
      Product.countDocuments({
        stock: { $gt: 0, $lte: 5 },
        isActive: true,
      }),
      Product.countDocuments({
        stock: { $lte: 0 },
        isActive: true,
      }),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("user", "name email"),
    ]);

    const revenueAggregation = await Order.aggregate<{
      _id: null;
      totalRevenue: number;
    }>([
      {
        $match: {
          orderStatus: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
        },
      },
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
    const page = boundedPositiveInt(req.query.page, 1, 1_000_000);
    const limit = boundedPositiveInt(req.query.limit, 20, 100);

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim().slice(0, 80)
        : "";

    const skip = (page - 1) * limit;

    const query: Record<string, any> = {
      role: "user",
    };

    if (search) {
      query.$or = [
        {
          name: {
            $regex: escapeRegex(search),
            $options: "i",
          },
        },
        {
          email: {
            $regex: escapeRegex(search),
            $options: "i",
          },
        },
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
    const page = boundedPositiveInt(req.query.page, 1, 1_000_000);
    const limit = boundedPositiveInt(req.query.limit, 20, 100);

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim().slice(0, 80)
        : "";

    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (search) {
      filter.$or = [
        {
          name: {
            $regex: escapeRegex(search),
            $options: "i",
          },
        },
        {
          description: {
            $regex: escapeRegex(search),
            $options: "i",
          },
        },
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
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
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
    const page = boundedPositiveInt(req.query.page, 1, 1_000_000);
    const limit = boundedPositiveInt(req.query.limit, 20, 100);

    const status = req.query.status as string;

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim().slice(0, 80)
        : "";

    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (status && status !== "all") {
      filter.orderStatus = status;
    }

    if (search) {
      filter.$or = [
        {
          trackingNumber: {
            $regex: escapeRegex(search),
            $options: "i",
          },
        },
        {
          "shippingAddress.fullName": {
            $regex: escapeRegex(search),
            $options: "i",
          },
        },
        {
          "shippingAddress.city": {
            $regex: escapeRegex(search),
            $options: "i",
          },
        },
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

// PATCH /api/admin/orders/:id/status
// Reuse the canonical order controller implementation.
export const updateOrderStatus = updateOrderStatusSafely;

const CSV_HEADERS = [
  "Order ID",
  "Tracking Number",
  "Order Date",
  "Customer Name",
  "Customer Email",
  "Customer Phone",
  "Shipping Address",
  "City",
  "State",
  "Pincode",
  "Products",
  "Quantities",
  "Subtotal",
  "Discount",
  "Shipping Fee",
  "Total",
  "Payment Method",
  "Payment Status",
  "Order Status",
];

const escapeCsvCell = (value: unknown): string => {
  let cell = value == null ? "" : String(value);

  // Protect spreadsheet users from formula injection.
  if (/^[\s\u0000-\u001F]*[=+\-@]/.test(cell)) {
    cell = `'${cell}`;
  }

  return `"${cell.replace(/"/g, '""')}"`;
};

const createCsvRow = (values: unknown[]): string =>
  values.map(escapeCsvCell).join(",") + "\r\n";

const parseExportDate = (value: unknown): Date | null | undefined => {
  if (value === undefined || value === "") return null;

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return undefined;
  }

  return date;
};

// GET /api/admin/orders/export
export const exportAdminOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  let cursor: ReturnType<ReturnType<typeof Order.find>["cursor"]> | undefined;

  try {
    const allowedStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    const status =
      typeof req.query.status === "string" ? req.query.status : "all";

    if (status !== "all" && !allowedStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid order status filter.",
      });
      return;
    }

    const fromDate = parseExportDate(req.query.from);
    const toDate = parseExportDate(req.query.to);

    if (fromDate === undefined || toDate === undefined) {
      res.status(400).json({
        success: false,
        message: "Dates must use the YYYY-MM-DD format.",
      });
      return;
    }

    if (fromDate && toDate && fromDate > toDate) {
      res.status(400).json({
        success: false,
        message: "Start date cannot be after end date.",
      });
      return;
    }

    const filter: Record<string, unknown> = {};

    if (status !== "all") {
      filter.orderStatus = status;
    }

    if (fromDate || toDate) {
      const createdAt: Record<string, Date> = {};

      if (fromDate) {
        createdAt.$gte = fromDate;
      }

      if (toDate) {
        const exclusiveEndDate = new Date(toDate);
        exclusiveEndDate.setUTCDate(exclusiveEndDate.getUTCDate() + 1);
        createdAt.$lt = exclusiveEndDate;
      }

      filter.createdAt = createdAt;
    }

    res.status(200);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="orders-export-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    );
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");

    // UTF-8 BOM helps spreadsheet applications display Indian text correctly.
    res.write("\uFEFF");
    res.write(createCsvRow(CSV_HEADERS));

    cursor = Order.find(filter)
      .select(
        "trackingNumber createdAt shippingAddress items subtotal discount shippingFee total paymentMethod paymentStatus orderStatus user",
      )
      .populate("user", "name email phone")
      .sort({ createdAt: -1, _id: -1 })
      .cursor();

    for await (const order of cursor) {
      if (res.destroyed) break;

      const customer = order.user as unknown as {
        name?: string;
        email?: string;
        phone?: string;
      } | null;

      const address = order.shippingAddress;

      const productNames = order.items.map((item) => item.name).join(" | ");

      const quantities = order.items.map((item) => item.quantity).join(" | ");

      const row = createCsvRow([
        order._id.toString(),
        order.trackingNumber,
        order.createdAt.toISOString(),
        customer?.name ?? address.fullName,
        customer?.email ?? "",
        address.phone || customer?.phone || "",
        address.address,
        address.city,
        address.state,
        address.pincode,
        productNames,
        quantities,
        order.subtotal,
        order.discount,
        order.shippingFee,
        order.total,
        order.paymentMethod,
        order.paymentStatus,
        order.orderStatus,
      ]);

      if (!res.write(row)) {
        await new Promise<void>((resolve, reject) => {
          res.once("drain", resolve);
          res.once("error", reject);
        });
      }
    }

    if (!res.destroyed) {
      res.end();
    }
  } catch (error) {
    if (res.headersSent) {
      res.destroy(error instanceof Error ? error : undefined);
      return;
    }

    next(error);
  } finally {
    await cursor?.close().catch(() => undefined);
  }
};
