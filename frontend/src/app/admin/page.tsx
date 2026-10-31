"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ShieldAlert, RefreshCw } from "lucide-react";

import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

import type {
  AdminStats,
  AnalyticsData,
  AnalyticsRange,
  RecentOrder,
} from "@/components/admin/dashboard/types";

import DashboardStats from "@/components/admin/dashboard/DashboardStats";
import InventoryAlerts from "@/components/admin/dashboard/InventoryAlerts";
import AnalyticsSection from "@/components/admin/dashboard/AnalyticsSection";
import RecentOrders from "@/components/admin/dashboard/RecentOrders";

function DashboardError({
  title,
  onRetry,
}: {
  title: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/20">
      <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-rose-500" />

      <p className="text-sm font-bold text-rose-800 dark:text-rose-300">
        {title}
      </p>

      <p className="mt-1 text-xs text-rose-700 dark:text-rose-400">
        Something went wrong while fetching dashboard data.
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </button>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [range, setRange] = useState<AnalyticsRange>("30d");

  const isAdmin = !!user && user.role === "admin";

  const {
    data,
    isLoading: isStatsLoading,
    isError: isStatsError,
    refetch: refetchStats,
  } = useQuery<{
    success: boolean;
    stats: AdminStats;
    recentOrders: RecentOrder[];
  }>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await api.get("/admin/stats");
      return res.data;
    },
    enabled: isAdmin,
  });

  const {
    data: analytics,
    isLoading: isAnalyticsLoading,
    isError: isAnalyticsError,
    refetch: refetchAnalytics,
  } = useQuery<AnalyticsData>({
    queryKey: ["admin-analytics", range],
    queryFn: async () => {
      const res = await api.get("/admin/analytics", {
        params: { range },
      });

      return res.data;
    },
    enabled: isAdmin,
  });

  if (isAuthLoading || (isAdmin && isStatsLoading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue dark:text-cyan-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-rose-500" />

        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Access Denied
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          You must be logged in as an administrator to access this control
          center.
        </p>
      </div>
    );
  }

  const stats = data?.stats;
  const recentOrders = data?.recentOrders ?? [];

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Dashboard Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Admin Control Center
          </h1>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Business analytics, inventory status, and order management.
          </p>
        </div>

        <Link
          href="/admin/orders"
          className="rounded-xl bg-brand-blue px-4 py-2 text-center text-xs font-bold text-white shadow-md transition hover:bg-blue-600 dark:bg-blue-600"
        >
          Manage Orders
        </Link>
      </div>

      {/* Dashboard Statistics */}
      {isStatsError ? (
        <DashboardError
          title="Unable to load dashboard statistics"
          onRetry={() => void refetchStats()}
        />
      ) : stats ? (
        <>
          <DashboardStats stats={stats} />

          {(stats.lowStockProducts > 0 || stats.outOfStockProducts > 0) && (
            <InventoryAlerts
              lowStockProducts={stats.lowStockProducts}
              outOfStockProducts={stats.outOfStockProducts}
            />
          )}
        </>
      ) : null}

      {/* Business Analytics */}
      {isAnalyticsError ? (
        <section className="space-y-5">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Business Analytics
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Sales performance and order insights.
            </p>
          </div>

          <DashboardError
            title="Unable to load analytics"
            onRetry={() => void refetchAnalytics()}
          />
        </section>
      ) : isAnalyticsLoading ? (
        <section className="space-y-5">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Business Analytics
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Sales performance and order insights.
            </p>
          </div>

          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <Loader2 className="h-7 w-7 animate-spin text-brand-blue dark:text-cyan-400" />
          </div>
        </section>
      ) : analytics ? (
        <AnalyticsSection
          analytics={analytics}
          range={range}
          onRangeChange={setRange}
        />
      ) : null}

      {/* Recent Orders */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Recent Orders Snapshot
          </h2>

          <Link
            href="/admin/orders"
            className="text-xs font-semibold text-brand-blue hover:underline dark:text-cyan-400"
          >
            View All →
          </Link>
        </div>

        {isStatsError ? (
          <p className="py-6 text-center text-xs text-slate-400">
            Recent orders are unavailable because dashboard data could not be
            loaded.
          </p>
        ) : (
          <RecentOrders orders={recentOrders} />
        )}
      </section>
    </main>
  );
}
