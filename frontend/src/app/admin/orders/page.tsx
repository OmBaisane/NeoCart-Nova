"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Package } from "lucide-react";

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
    <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Order Lifecycle Management
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Process orders, update fulfillment status, and trigger automatic
            inventory restocking.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
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

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <Package className="mx-auto h-10 w-10 text-slate-300 mb-2" />
          <p className="text-xs font-semibold text-slate-500">
            No orders found.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord._id}
              className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xs space-y-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {ord.trackingNumber}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase">
                      {ord.orderStatus}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
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

              {/* Shipping address & items summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50 space-y-1">
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

                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50 space-y-2">
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    Items ({ord.items.length}):
                  </p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
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

              {/* Action Buttons for Next State Transitions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {ord.orderStatus === "pending" && (
                  <button
                    type="button"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        orderId: ord._id,
                        nextStatus: "confirmed",
                      })
                    }
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition"
                  >
                    Confirm Order
                  </button>
                )}

                {(ord.orderStatus === "pending" ||
                  ord.orderStatus === "confirmed") && (
                  <button
                    type="button"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        orderId: ord._id,
                        nextStatus: "processing",
                      })
                    }
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 transition"
                  >
                    Mark Processing
                  </button>
                )}

                {(ord.orderStatus === "confirmed" ||
                  ord.orderStatus === "processing") && (
                  <button
                    type="button"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        orderId: ord._id,
                        nextStatus: "shipped",
                      })
                    }
                    className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-500 transition"
                  >
                    Mark Shipped
                  </button>
                )}

                {ord.orderStatus === "shipped" && (
                  <button
                    type="button"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        orderId: ord._id,
                        nextStatus: "delivered",
                      })
                    }
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition"
                  >
                    Mark Delivered
                  </button>
                )}

                {["pending", "confirmed", "processing"].includes(
                  ord.orderStatus,
                ) && (
                  <button
                    type="button"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        orderId: ord._id,
                        nextStatus: "cancelled",
                      })
                    }
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition"
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
