"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Package,
  ShoppingBag,
  Users,
  ArrowUpRight,
  AlertTriangle,
  Plus,
  Loader2,
} from "lucide-react";

interface DashboardStatsResponse {
  success: boolean;
  stats: {
    totalProducts: number;
    totalOrders: number;
    totalUsers: number;
    totalRevenue: number;
    lowStockProducts: number;
    outOfStockProducts: number;
  };
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery<DashboardStatsResponse>({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const res = await api.get("/admin/stats");
      return res.data;
    },
    staleTime: 30 * 1000,
  });

  const stats = data?.stats;
  const totalProducts = stats?.totalProducts || 0;
  const totalCustomers = stats?.totalUsers || 0;
  const lowStockCount = stats?.lowStockProducts || 0;
  const outOfStockCount = stats?.outOfStockProducts || 0;

  return (
    <main className="space-y-6 sm:space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 pb-4 sm:pb-6 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-brand-charcoal sm:text-3xl dark:text-white">
            Executive Dashboard
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Real-time telemetry, warehouse inventory health, and management
            shortcuts.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Link
            href="/admin/products/new"
            className="flex items-center gap-1.5 rounded-xl bg-brand-blue px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-600 transition dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Product</span>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue dark:text-cyan-400" />
        </div>
      ) : (
        <>
          {/* KPI Metric Cards Grid */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
            {/* Total Active Inventory */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  Total Catalog Items
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-brand-blue dark:bg-blue-950/60 dark:text-cyan-400">
                  <Package className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-brand-charcoal dark:text-white">
                  {totalProducts}
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Live in Store
                </span>
              </div>
            </div>

            {/* Registered Customers */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  Total Customers
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-brand-charcoal dark:text-white">
                  {totalCustomers}
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                  Accounts
                </span>
              </div>
            </div>

            {/* Low Stock Alerts */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  Low Stock Items
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-brand-charcoal dark:text-white">
                  {lowStockCount}
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  ≤ 5 units left
                </span>
              </div>
            </div>

            {/* Out of Stock Alerts */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  Out of Stock
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-brand-charcoal dark:text-white">
                  {outOfStockCount}
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                  Action Required
                </span>
              </div>
            </div>
          </section>

          {/* Quick Management Shortcuts */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xs sm:text-sm font-bold text-brand-charcoal uppercase tracking-wider border-b border-slate-100 pb-3 dark:border-slate-800 dark:text-white">
              Operational Management Shortcuts
            </h2>

            <div className="mt-4 sm:mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              <Link
                href="/admin/products"
                className="group flex flex-col justify-between rounded-xl border border-slate-200 p-3.5 sm:p-4 transition hover:border-brand-blue hover:shadow-xs dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-cyan-500"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Package className="h-5 w-5 text-brand-blue dark:text-cyan-400" />
                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-brand-blue transition dark:text-slate-500 dark:group-hover:text-cyan-400" />
                  </div>
                  <h3 className="mt-2.5 sm:mt-3 text-xs sm:text-sm font-bold text-brand-charcoal dark:text-white">
                    Product Management
                  </h3>
                  <p className="mt-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                    Edit pricing, upload product images, adjust warehouse
                    inventory levels.
                  </p>
                </div>
                <span className="mt-3 sm:mt-4 text-[11px] font-bold text-brand-blue dark:text-cyan-400">
                  Manage Catalog →
                </span>
              </Link>

              <Link
                href="/admin/orders"
                className="group flex flex-col justify-between rounded-xl border border-slate-200 p-3.5 sm:p-4 transition hover:border-brand-blue hover:shadow-xs dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-indigo-400"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <ShoppingBag className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition dark:text-slate-500 dark:group-hover:text-indigo-400" />
                  </div>
                  <h3 className="mt-2.5 sm:mt-3 text-xs sm:text-sm font-bold text-brand-charcoal dark:text-white">
                    Order Processing
                  </h3>
                  <p className="mt-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                    Update fulfillment status (Confirmed, Shipped, Delivered)
                    and dispatch tracking codes.
                  </p>
                </div>
                <span className="mt-3 sm:mt-4 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                  Process Orders →
                </span>
              </Link>

              <Link
                href="/admin/users"
                className="group flex flex-col justify-between rounded-xl border border-slate-200 p-3.5 sm:p-4 transition hover:border-brand-blue hover:shadow-xs dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-cyan-400"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Users className="h-5 w-5 text-cyan-accent dark:text-cyan-400" />
                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-cyan-accent transition dark:text-slate-500 dark:group-hover:text-cyan-400" />
                  </div>
                  <h3 className="mt-2.5 sm:mt-3 text-xs sm:text-sm font-bold text-brand-charcoal dark:text-white">
                    Customer Directory
                  </h3>
                  <p className="mt-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                    Inspect registered user accounts, phone numbers, and address
                    integrity.
                  </p>
                </div>
                <span className="mt-3 sm:mt-4 text-[11px] font-bold text-cyan-600 dark:text-cyan-400">
                  View Directory →
                </span>
              </Link>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
