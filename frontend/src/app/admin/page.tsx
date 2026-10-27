"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Package,
  ShoppingBag,
  Users,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Loader2,
  ShieldAlert,
} from "lucide-react";

interface AdminStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

interface RecentOrder {
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

export default function AdminDashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();

  const { data, isLoading } = useQuery<{
    success: boolean;
    stats: AdminStats;
    recentOrders: RecentOrder[];
  }>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await api.get("/admin/stats");
      return res.data;
    },
    enabled: !!user && user.role === "admin",
  });

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue dark:text-cyan-400" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Access Denied
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          You must be logged in as an administrator to access this control
          center.
        </p>
      </div>
    );
  }

  const stats = data?.stats || {
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
  };

  const recentOrders = data?.recentOrders || [];

  return (
    <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Admin Control Center
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Real-time business analytics, inventory status, and order
            management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-600 transition dark:bg-blue-600"
          >
            Manage Orders
          </Link>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Revenue
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
            ₹{stats.totalRevenue.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
            Excludes cancelled orders
          </span>
        </div>

        {/* Total Orders */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Orders
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-brand-blue dark:bg-blue-950/60 dark:text-cyan-400">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats.totalOrders}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Lifetime fulfilled & pending
          </span>
        </div>

        {/* Active Products */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Catalog Products
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats.totalProducts}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Active storefront gear
          </span>
        </div>

        {/* Total Users */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Registered Customers
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats.totalUsers}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Customer accounts
          </span>
        </div>
      </div>

      {/* Inventory Alerts Grid */}
      {(stats.lowStockProducts > 0 || stats.outOfStockProducts > 0) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/40 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="text-xs text-amber-900 dark:text-amber-200 flex-1">
            <strong>Inventory Attention Required:</strong>{" "}
            {stats.lowStockProducts} products are running low on stock (&le; 5
            units) and {stats.outOfStockProducts} are completely sold out.
          </div>
        </div>
      )}

      {/* Recent Orders Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Recent Orders Snapshot
          </h2>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline dark:text-cyan-400"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No orders placed yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentOrders.map((ord) => (
              <div
                key={ord._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2 text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {ord.trackingNumber}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Customer: {ord.user?.name || "Guest"} ({ord.user?.email})
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                      ord.orderStatus === "delivered"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                        : ord.orderStatus === "cancelled"
                          ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                          : "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-cyan-400"
                    }`}
                  >
                    {ord.orderStatus}
                  </span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    ₹{ord.total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
