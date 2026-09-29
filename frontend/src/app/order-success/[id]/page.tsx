"use client";

import React, { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  CheckCircle2,
  Package,
  Truck,
  ArrowRight,
  MapPin,
  Clock,
  Loader2,
  AlertCircle,
  Copy,
} from "lucide-react";

interface OrderDetail {
  _id: string;
  trackingNumber: string;
  createdAt: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  items: Array<{
    name: string;
    image: string;
    price: number;
    quantity: number;
  }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
}

export default function OrderSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const [copied, setCopied] = React.useState(false);

  const {
    data: order,
    isLoading,
    isFetching,
    isError,
  } = useQuery<OrderDetail>({
    queryKey: ["order", id],
    queryFn: async () => {
      const res = await api.get(`/orders/${id}`);
      return res.data?.order;
    },
    staleTime: 0,
    refetchOnMount: "always",
    enabled: !!user,
  });

  const copyTracking = () => {
    if (order?.trackingNumber) {
      navigator.clipboard.writeText(order.trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading || (isFetching && !order)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-20 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-rose-500" />
        <h1 className="mt-4 text-xl font-bold text-brand-charcoal">
          Order Summary Unavailable
        </h1>
        <p className="mt-2 text-xs text-slate-500">
          Could not retrieve order details. Please check your order history.
        </p>
        <Link
          href="/orders"
          className="mt-6 inline-block rounded-lg bg-brand-blue px-6 py-2.5 text-xs font-semibold text-white"
        >
          View My Orders
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-3 sm:px-6 lg:px-8 py-6 sm:py-12">
      {/* Success Celebration Card */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-xs sm:p-12">
        <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10" />
        </div>

        <span className="mt-3 sm:mt-4 inline-block rounded-full bg-blue-50 px-3 py-1 text-[11px] sm:text-xs font-bold text-brand-blue uppercase tracking-wider">
          Order Confirmed
        </span>

        <h1 className="mt-2.5 sm:mt-3 text-xl font-black tracking-tight text-brand-charcoal sm:text-4xl">
          Thank you for your order!
        </h1>
        <p className="mt-1.5 sm:mt-2 text-xs text-slate-500 sm:text-sm">
          We have received your order and our dispatch team has locked your
          items for packaging.
        </p>

        {/* Tracking Pill */}
        <div className="mx-auto mt-5 sm:mt-6 flex flex-wrap max-w-md items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 sm:px-4 text-xs">
          <div className="flex items-center gap-2 truncate">
            <Package className="h-4 w-4 shrink-0 text-brand-blue" />
            <span className="font-semibold text-slate-600">Tracking:</span>
            <span className="font-mono font-bold text-brand-charcoal text-[11px] sm:text-xs">
              {order.trackingNumber}
            </span>
          </div>
          <button
            onClick={copyTracking}
            className="flex items-center gap-1 font-semibold text-brand-blue hover:underline shrink-0"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>
        </div>

        {/* COD Reminder */}
        <div className="mx-auto mt-3.5 sm:mt-4 max-w-md rounded-xl bg-amber-50/80 p-3 text-left text-xs text-amber-800 flex items-start sm:items-center gap-2">
          <Truck className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-amber-600 mt-0.5 sm:mt-0" />
          <span className="text-[11px] sm:text-xs leading-tight">
            Payment Method: <strong>Cash on Delivery (COD)</strong>. Please keep
            ₹{order.total.toLocaleString("en-IN")} ready upon arrival.
          </span>
        </div>

        {/* CTAs */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/orders"
            className="flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 py-2.5 sm:py-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-600"
          >
            <span>Track in My Orders</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/products"
            className="flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-2.5 sm:py-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Continue Shopping
          </Link>
        </div>
      </section>

      {/* Order Details & Summary Grid */}
      <section className="mt-6 sm:mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        {/* Shipping Address */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin className="h-4 w-4 text-brand-blue shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
              Delivery Address
            </h3>
          </div>
          <div className="mt-3 text-xs leading-relaxed text-slate-600 space-y-1">
            <p className="font-bold text-brand-charcoal">
              {order.shippingAddress.fullName}
            </p>
            <p>{order.shippingAddress.address}</p>
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state} —{" "}
              {order.shippingAddress.pincode}
            </p>
            <p className="text-slate-400">
              Phone: {order.shippingAddress.phone}
            </p>
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="h-4 w-4 text-brand-blue shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
              Order Receipt
            </h3>
          </div>
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-800">
                ₹{order.subtotal.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee</span>
              <span className="font-semibold text-slate-800">
                {order.shippingFee === 0 ? "FREE" : `₹${order.shippingFee}`}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 text-xs sm:text-sm font-extrabold text-brand-charcoal">
              <span>Total Payable</span>
              <span className="text-brand-blue">
                ₹{order.total.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Ordered Items List */}
      <section className="mt-4 sm:mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-charcoal border-b border-slate-100 pb-3">
          Purchased Items ({order.items.length})
        </h3>
        <div className="mt-3 sm:mt-4 divide-y divide-slate-100">
          {order.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 py-3 text-xs"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <img
                  src={item.image || ""}
                  alt={item.name}
                  className="h-11 w-11 sm:h-12 sm:w-12 rounded-lg object-cover bg-slate-100 shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="font-bold text-brand-charcoal truncate text-[11px] sm:text-xs">
                    {item.name}
                  </h4>
                  <p className="text-slate-400 text-[10px] sm:text-[11px]">
                    Qty: {item.quantity} × ₹{item.price.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
              <span className="font-extrabold text-brand-charcoal text-xs shrink-0">
                ₹{(item.price * item.quantity).toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
