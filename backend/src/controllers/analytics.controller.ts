import { Request, Response, NextFunction } from "express";
import { Order } from "../models/order.model.js";

type AnalyticsRange = "7d" | "30d" | "90d" | "all";

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

const getDateRange = (range: AnalyticsRange) => {
  const endDate = new Date();

  if (range === "all") {
    return {
      startDate: null,
      endDate,
    };
  }

  const days = Number.parseInt(range, 10);
  const startDate = new Date(endDate);
  startDate.setUTCDate(startDate.getUTCDate() - days);

  return {
    startDate,
    endDate,
  };
};

export const getAdminAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const requestedRange =
      typeof req.query.range === "string" ? req.query.range : "30d";

    const validRanges: AnalyticsRange[] = ["7d", "30d", "90d", "all"];

    if (!validRanges.includes(requestedRange as AnalyticsRange)) {
      res.status(400).json({
        success: false,
        message: "Invalid analytics range. Use 7d, 30d, 90d, or all.",
      });
      return;
    }

    const range = requestedRange as AnalyticsRange;
    const { startDate, endDate } = getDateRange(range);

    const dateFilter: Record<string, unknown> = {};

    if (startDate) {
      dateFilter.$gte = startDate;
    }

    dateFilter.$lte = endDate;

    const orderFilter: Record<string, unknown> = startDate
      ? { createdAt: dateFilter }
      : { createdAt: { $lte: endDate } };

    const salesFilter = {
      ...orderFilter,
      orderStatus: { $ne: "cancelled" },
    };

    const trendFormat =
      range === "7d" || range === "30d" ? "%Y-%m-%d" : "%Y-%m";

    const [
      statusResults,
      salesResults,
      trendResults,
      topProducts,
      categoryPerformance,
    ] = await Promise.all([
      // Order counts grouped by status.
      Order.aggregate([
        { $match: orderFilter },
        {
          $group: {
            _id: "$orderStatus",
            count: { $sum: 1 },
          },
        },
      ]),

      // Revenue excludes cancelled orders.
      Order.aggregate([
        { $match: salesFilter },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$total" },
            totalSalesOrders: { $sum: 1 },
            paidRevenue: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$total", 0],
              },
            },
            paidOrders: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0],
              },
            },
          },
        },
      ]),

      // Revenue trend grouped by day or month.
      Order.aggregate([
        { $match: salesFilter },
        {
          $group: {
            _id: {
              $dateToString: {
                format: trendFormat,
                date: "$createdAt",
                timezone: "UTC",
              },
            },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Top products use historical order item snapshots.
      Order.aggregate([
        { $match: salesFilter },
        { $unwind: "$items" },
        {
          $group: {
            _id: {
              product: "$items.product",
              name: "$items.name",
              image: "$items.image",
            },
            quantitySold: { $sum: "$items.quantity" },
            revenue: {
              $sum: {
                $multiply: ["$items.price", "$items.quantity"],
              },
            },
          },
        },
        { $sort: { quantitySold: -1, revenue: -1 } },
        { $limit: 5 },
        {
          $project: {
            _id: 0,
            productId: "$_id.product",
            name: "$_id.name",
            image: "$_id.image",
            quantitySold: 1,
            revenue: 1,
          },
        },
      ]),

      // Category performance uses the current category of each product.
      Order.aggregate([
        { $match: salesFilter },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.product",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        {
          $unwind: {
            path: "$productInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "productInfo.category",
            foreignField: "_id",
            as: "categoryInfo",
          },
        },
        {
          $unwind: {
            path: "$categoryInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "$categoryInfo._id",
            categoryName: {
              $first: {
                $ifNull: ["$categoryInfo.name", "Uncategorized"],
              },
            },
            quantitySold: {
              $sum: "$items.quantity",
            },
            revenue: {
              $sum: {
                $multiply: ["$items.price", "$items.quantity"],
              },
            },
          },
        },
        { $sort: { revenue: -1 } },
        {
          $project: {
            _id: 0,
            categoryId: "$_id",
            categoryName: 1,
            quantitySold: 1,
            revenue: 1,
          },
        },
      ]),
    ]);

    const statusCounts: Record<string, number> = {};

    for (const status of ORDER_STATUSES) {
      statusCounts[status] = 0;
    }

    for (const result of statusResults) {
      if (result._id in statusCounts) {
        statusCounts[result._id] = result.count;
      }
    }

    const sales = salesResults[0] || {
      totalRevenue: 0,
      totalSalesOrders: 0,
      paidRevenue: 0,
      paidOrders: 0,
    };

    const totalRevenue = sales.totalRevenue || 0;
    const totalSalesOrders = sales.totalSalesOrders || 0;

    res.status(200).json({
      success: true,
      range,
      dateRange: {
        startDate: startDate?.toISOString() || null,
        endDate: endDate.toISOString(),
        timezone: "UTC",
      },
      summary: {
        totalOrders: Object.values(statusCounts).reduce(
          (total, count) => total + count,
          0,
        ),
        totalSalesOrders,
        totalRevenue,
        averageOrderValue:
          totalSalesOrders > 0 ? totalRevenue / totalSalesOrders : 0,
        paidRevenue: sales.paidRevenue || 0,
        paidOrders: sales.paidOrders || 0,
      },
      orderStatus: statusCounts,
      revenueTrend: trendResults,
      topProducts,
      categoryPerformance,
    });
  } catch (error) {
    next(error);
  }
};
