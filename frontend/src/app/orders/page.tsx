"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Package,
  Truck,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

interface OrderItemSnapshot {
  product: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

interface OrderRecord {
  _id: string;
  trackingNumber: string;
  createdAt: string;
  orderStatus:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  items: OrderItemSnapshot[];
  shippingAddress: {
    fullName: string;
    city: string;
    state: string;
    pincode: string;
  };
}

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const { user, isLoading: isAuthLoading } = useAuth();

  const { data, isLoading } = useQuery<{
    orders: OrderRecord[];
    count: number;
  }>({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await api.get("/orders");
      return res.data;
    },
    enabled: !!user,
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return api.patch(`/orders/${orderId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  if (isAuthLoading || (user && isLoading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue dark:text-cyan-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-20 text-center">
        <Package className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
        <h1 className="mt-4 text-xl font-bold text-brand-charcoal dark:text-white">
          Sign In to View Orders
        </h1>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Your order history and live parcel shipments require an active
          authenticated session.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-brand-blue px-6 py-2.5 text-xs font-semibold text-white dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          Sign In
        </Link>
      </main>
    );
  }

  const orders = data?.orders || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border dark:border-emerald-800">
            <CheckCircle2 className="h-3 w-3" />
            Delivered
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border dark:border-cyan-800">
            <Truck className="h-3 w-3" />
            Shipped
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 dark:border dark:border-rose-800">
            <XCircle className="h-3 w-3" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 dark:border dark:border-amber-800">
            <Clock className="h-3 w-3" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
        <h1 className="text-xl font-extrabold tracking-tight text-brand-charcoal sm:text-3xl dark:text-white">
          My Order History
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Track packages, view immutable historical invoices, and manage active
          shipments.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="mt-8 sm:mt-12 rounded-2xl border border-dashed border-slate-200 bg-white p-8 sm:p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <Package className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h3 className="mt-4 text-sm sm:text-base font-bold text-brand-charcoal dark:text-white">
            You haven&apos;t placed any orders yet
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Discover curated gear in our catalog and place your first Cash on
            Delivery order.
          </p>
          <Link
            href="/products"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-blue px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <span>Browse Catalog</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
          {orders.map((order) => {
            const canCancel =
              order.orderStatus === "pending" ||
              order.orderStatus === "confirmed";

            return (
              <article
                key={order._id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Header strip: Valid dark:bg-slate-950/60 prevents light-gray fallback */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 p-3.5 sm:px-6 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3 sm:gap-6 text-xs">
                    <div>
                      <span className="text-[10px] sm:text-xs font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                        Placed
                      </span>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] sm:text-xs font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                        Tracking Code
                      </span>
                      <p className="font-mono font-bold text-brand-charcoal text-xs sm:text-sm dark:text-cyan-400">
                        {order.trackingNumber}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] sm:text-xs font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                        Total Amount
                      </span>
                      <p className="font-extrabold text-brand-charcoal text-xs sm:text-sm dark:text-white">
                        ₹{order.total.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div className="self-start sm:self-auto">
                    {getStatusBadge(order.orderStatus)}
                  </div>
                </div>

                {/* Items */}
                <div className="p-3.5 sm:p-6 space-y-3 sm:space-y-4">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                        <img
                          src={
                            item.image ||
                            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80"
                          }
                          alt={item.name}
                          className="h-11 w-11 sm:h-14 sm:w-14 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-100 dark:border-slate-800"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-brand-charcoal truncate text-xs sm:text-sm dark:text-slate-100">
                            {item.name}
                          </h4>
                          <p className="text-slate-400 text-[10px] sm:text-xs dark:text-slate-400 mt-0.5">
                            Qty: {item.quantity} × ₹
                            {item.price.toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                      <span className="font-extrabold text-brand-charcoal text-xs sm:text-sm shrink-0 dark:text-white">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}

                  {/* Footer Actions */}
                  <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:pt-4 dark:border-slate-800">
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                      Destination:{" "}
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {order.shippingAddress.city},{" "}
                        {order.shippingAddress.state} (
                        {order.shippingAddress.pincode})
                      </span>
                    </p>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {canCancel && (
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to cancel this order? Allocated inventory will be restocked.",
                              )
                            ) {
                              cancelOrderMutation.mutate(order._id);
                            }
                          }}
                          disabled={cancelOrderMutation.isPending}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 transition"
                        >
                          Cancel Order
                        </button>
                      )}

                      <Link
                        href={`/order-success/${order._id}`}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
                      >
                        View Receipt
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
