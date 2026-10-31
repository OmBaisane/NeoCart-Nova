"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Package, Download } from "lucide-react";

interface AdminOrder {
  _id: string;
  trackingNumber: string;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  user: {
    name: string;
    email: string;
    phone?: string;
  };
  items: Array<{
    product: {
      name: string;
      images: string[];
    };
    quantity: number;
    price: number;
  }>;
}

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const { data, isLoading } = useQuery<{
    success: boolean;
    orders: AdminOrder[];
  }>({
    queryKey: ["admin-orders", statusFilter],
    queryFn: async () => {
      const res = await api.get(`/admin/orders?status=${statusFilter}`);
      return res.data;
    },
    enabled: !!user && user.role === "admin",
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      nextStatus,
    }: {
      orderId: string;
      nextStatus: string;
    }) => {
      const res = await api.patch(`/admin/orders/${orderId}/status`, {
        orderStatus: nextStatus,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });

  const handleExport = async () => {
    setExportError("");

    if (fromDate && toDate && fromDate > toDate) {
      setExportError("Start date cannot be after end date.");
      return;
    }

    try {
      setIsExporting(true);

      const response = await api.get("/admin/orders/export", {
        params: {
          status: statusFilter,
          from: fromDate || undefined,
          to: toDate || undefined,
        },
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8;",
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = `orders-export-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch {
      setExportError(
        "Unable to export orders. Please check your connection and try again.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue dark:text-cyan-400" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  const orders = data?.orders || [];

  return (
    <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Order Lifecycle Management
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Process orders, update fulfillment status, and trigger automatic
            inventory restocking.
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1">
              <label
                htmlFor="order-status-filter"
                className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400"
              >
                Order Status
              </label>
              <select
                id="order-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:w-auto"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="export-from-date"
                className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400"
              >
                From Date
              </label>
              <input
                id="export-from-date"
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:w-auto"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="export-to-date"
                className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400"
              >
                To Date
              </label>
              <input
                id="export-to-date"
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:w-auto"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isExporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Export includes all matching orders, not just the orders currently
          displayed. Date filters are interpreted in UTC. Leave dates empty to
          export all dates.
        </p>

        {exportError && (
          <p
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
          >
            {exportError}
          </p>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <Package className="mx-auto mb-2 h-10 w-10 text-slate-300" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            No orders found.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord._id}
              className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 sm:p-6"
            >
              <div className="flex flex-col justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {ord.trackingNumber}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {ord.orderStatus}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    Customer: {ord.user?.name} ({ord.user?.email}) • Placed on{" "}
                    {new Date(ord.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    ₹{ord.total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-2">
                <div className="space-y-1 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    Delivery Address:
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    {ord.shippingAddress.fullName} • {ord.shippingAddress.phone}
                    <br />
                    {ord.shippingAddress.address}, {ord.shippingAddress.city},{" "}
                    {ord.shippingAddress.state} - {ord.shippingAddress.pincode}
                  </p>
                </div>

                <div className="space-y-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    Items ({ord.items.length}):
                  </p>
                  <div className="max-h-24 space-y-1 overflow-y-auto">
                    {ord.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between text-slate-600 dark:text-slate-400"
                      >
                        <span className="truncate pr-2">
                          {item.product?.name || "Item"} x {item.quantity}
                        </span>
                        <span>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
                {ord.orderStatus === "pending" && (
                  <button
                    type="button"
                    disabled={updateStatusMutation.isPending}
                    onClick={() =>
                      updateStatusMutation.mutate({
                        orderId: ord._id,
                        nextStatus: "confirmed",
                      })
                    }
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-500 disabled:opacity-50"
                  >
                    Confirm Order
                  </button>
                )}

                {(ord.orderStatus === "pending" ||
                  ord.orderStatus === "confirmed") && (
                  <button
                    type="button"
                    disabled={updateStatusMutation.isPending}
                    onClick={() =>
                      updateStatusMutation.mutate({
                        orderId: ord._id,
                        nextStatus: "processing",
                      })
                    }
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition disabled:opacity-50"
                  >
                    Mark Processing
                  </button>
                )}

                {(ord.orderStatus === "confirmed" ||
                  ord.orderStatus === "processing") && (
                  <button
                    type="button"
                    disabled={updateStatusMutation.isPending}
                    onClick={() =>
                      updateStatusMutation.mutate({
                        orderId: ord._id,
                        nextStatus: "shipped",
                      })
                    }
                    className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white transition disabled:opacity-50"
                  >
                    Mark Shipped
                  </button>
                )}

                {ord.orderStatus === "shipped" && (
                  <button
                    type="button"
                    disabled={updateStatusMutation.isPending}
                    onClick={() =>
                      updateStatusMutation.mutate({
                        orderId: ord._id,
                        nextStatus: "delivered",
                      })
                    }
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition disabled:opacity-50"
                  >
                    Mark Delivered
                  </button>
                )}

                {["pending", "confirmed", "processing"].includes(
                  ord.orderStatus,
                ) && (
                  <button
                    type="button"
                    disabled={updateStatusMutation.isPending}
                    onClick={() =>
                      updateStatusMutation.mutate({
                        orderId: ord._id,
                        nextStatus: "cancelled",
                      })
                    }
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white transition disabled:opacity-50"
                  >
                    Cancel & Restock
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
