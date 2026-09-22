"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Package,
  Calendar,
  Truck,
  AlertTriangle,
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: isAuthLoading } = useAuth();

  // 1. Fetch Customer Orders
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

  // 2. Cancel Order Mutation (Restocks inventory server-side)
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
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  // Auth Guard
  if (!user) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-20 text-center">
        <Package className="mx-auto h-12 w-12 text-slate-300" />
        <h1 className="mt-4 text-xl font-bold text-brand-charcoal">
          Sign In to View Orders
        </h1>
        <p className="mt-2 text-xs text-slate-500">
          Your order history and live parcel shipments require an active
          authenticated session.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-brand-blue px-6 py-2.5 text-xs font-semibold text-white"
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
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
            <CheckCircle2 className="h-3 w-3" />
            Delivered
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-0.5 text-[11px] font-bold text-cyan-700">
            <Truck className="h-3 w-3" />
            Shipped
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
            <XCircle className="h-3 w-3" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
            <Clock className="h-3 w-3" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand-charcoal sm:text-3xl">
          My Order History
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Track packages, view immutable historical invoices, and manage active
          shipments.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-base font-bold text-brand-charcoal">
            You haven&apos;t placed any orders yet
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Discover curated gear in our catalog and place your first Cash on
            Delivery order.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-blue px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-600"
          >
            <span>Browse Catalog</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {orders.map((order) => {
            const canCancel =
              order.orderStatus === "pending" ||
              order.orderStatus === "confirmed";

            return (
              <article
                key={order._id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs"
              >
                {/* Header info strip */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/70 p-4 sm:px-6">
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">Order Placed:</span>
                      <p className="font-semibold text-slate-700">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Tracking Code:</span>
                      <p className="font-mono font-bold text-brand-charcoal">
                        {order.trackingNumber}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Total:</span>
                      <p className="font-extrabold text-brand-charcoal">
                        ₹{order.total.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div>{getStatusBadge(order.orderStatus)}</div>
                </div>

                {/* Items in this order */}
                <div className="p-4 sm:p-6 space-y-4">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            item.image ||
                            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80"
                          }
                          alt={item.name}
                          className="h-14 w-14 rounded-xl object-cover bg-slate-100 shrink-0"
                        />
                        <div>
                          <h4 className="font-bold text-brand-charcoal">
                            {item.name}
                          </h4>
                          <p className="text-slate-400">
                            Qty: {item.quantity} × ₹
                            {item.price.toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                      <span className="font-extrabold text-brand-charcoal">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}

                  {/* Actions Footer */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <p className="text-[11px] text-slate-500">
                      Destination: {order.shippingAddress.city},{" "}
                      {order.shippingAddress.state} (
                      {order.shippingAddress.pincode})
                    </p>

                    <div className="flex items-center gap-2">
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
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                        >
                          Cancel Order
                        </button>
                      )}

                      <Link
                        href={`/order-success/${order._id}`}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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
