export interface AdminStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

export interface RecentOrder {
  _id: string;
  trackingNumber: string;
  total: number;
  orderStatus: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

export type AnalyticsRange = "7d" | "30d" | "90d" | "all";

export interface RevenueTrend {
  _id: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  productId?: string;
  name: string;
  image?: string;
  quantitySold: number;
  revenue: number;
}

export interface CategoryPerformance {
  categoryId?: string;
  categoryName: string;
  quantitySold: number;
  revenue: number;
}

export interface AnalyticsData {
  success: boolean;
  range: AnalyticsRange;
  dateRange: {
    startDate: string | null;
    endDate: string;
    timezone: string;
  };
  summary: {
    totalOrders: number;
    totalSalesOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    paidRevenue: number;
    paidOrders: number;
  };
  orderStatus: Record<string, number>;
  revenueTrend: RevenueTrend[];
  topProducts: TopProduct[];
  categoryPerformance: CategoryPerformance[];
}

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;
