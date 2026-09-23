"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  MapPin,
  Phone,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  ShoppingBag,
} from "lucide-react";

interface ShippingAddressState {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [form, setForm] = useState<ShippingAddressState>({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  // Pre-fill user information if already available in context
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: user.name || "",
        phone: user.phone || "",
        address: user.address?.street || "",
        city: user.address?.city || "",
        state: user.address?.state || "",
        pincode: user.address?.pincode || "",
      }));
    }
  }, [user]);

  // Auth Guard
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login?redirect=/checkout");
    }
  }, [user, isAuthLoading, router]);

  // 1. Fetch Cart to Verify Items Before Ordering
  const { data: cartData, isLoading: isCartLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const res = await api.get("/cart");
      return res.data?.cart;
    },
    enabled: !!user,
  });

  // 2. Place Order Mutation
  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/orders", {
        shippingAddress: form,
        paymentMethod: "COD",
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      const orderId = data.order._id;
      router.push(`/order-success/${orderId}`);
    },
    onError: (err: any) => {
      setValidationError(
        err.response?.data?.message ||
          err.message ||
          "Failed to place order. Please check your stock and try again.",
      );
    },
  });

  if (isAuthLoading || (user && isCartLoading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const items = cartData?.items || [];
  const subtotal = cartData?.subtotal || 0;
  const shippingFee = subtotal >= 1000 || subtotal === 0 ? 0 : 99;
  const total = subtotal + shippingFee;

  // Empty cart direct access guard with unified EmptyState
  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 text-center">
        <EmptyState
          icon={ShoppingBag}
          title="Cannot Checkout With an Empty Bag"
          description="You must add items to your cart before proceeding to checkout."
          actionLabel="Return to Catalog"
          actionHref="/products"
        />
      </main>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (form.fullName.trim().length < 2) {
      setValidationError("Full name must be at least 2 characters long.");
      return;
    }
    if (form.phone.trim().length < 10) {
      setValidationError("Phone number must be at least 10 digits.");
      return;
    }
    if (form.address.trim().length < 5) {
      setValidationError("Street address must be at least 5 characters long.");
      return;
    }
    if (!form.city.trim() || !form.state.trim() || !form.pincode.trim()) {
      setValidationError("Please complete all delivery address fields.");
      return;
    }

    placeOrderMutation.mutate();
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand-charcoal sm:text-3xl">
          Secure Checkout
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Provide your verified delivery address and confirm your Cash on
          Delivery order.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-3">
        {/* Left 2 Cols: Shipping Information Form */}
        <section className="lg:col-span-2">
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {validationError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Address Details Block */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <MapPin className="h-4 w-4 text-brand-blue" />
                <h2 className="text-sm font-bold text-brand-charcoal uppercase tracking-wider">
                  1. Shipping Information
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Full Name *
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="fullName"
                      type="text"
                      required
                      name="fullName"
                      value={form.fullName}
                      onChange={handleInputChange}
                      placeholder="Receiver's name"
                      className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs outline-none focus:border-brand-blue"
                    />
                    <UserIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Mobile Phone Number *
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="phone"
                      type="tel"
                      required
                      name="phone"
                      value={form.phone}
                      onChange={handleInputChange}
                      placeholder="+91 9876543210"
                      className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs outline-none focus:border-brand-blue"
                    />
                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Flat, House No., Building, Street Address *
                </label>
                <input
                  id="address"
                  type="text"
                  required
                  name="address"
                  value={form.address}
                  onChange={handleInputChange}
                  placeholder="e.g. Flat 402, Nova Heights, MG Road"
                  className="mt-1 w-full rounded-lg border border-slate-300 py-2 px-3 text-xs outline-none focus:border-brand-blue"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="city"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    City *
                  </label>
                  <input
                    id="city"
                    type="text"
                    required
                    name="city"
                    value={form.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Mumbai"
                    className="mt-1 w-full rounded-lg border border-slate-300 py-2 px-3 text-xs outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label
                    htmlFor="state"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    State *
                  </label>
                  <input
                    id="state"
                    type="text"
                    required
                    name="state"
                    value={form.state}
                    onChange={handleInputChange}
                    placeholder="e.g. Maharashtra"
                    className="mt-1 w-full rounded-lg border border-slate-300 py-2 px-3 text-xs outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pincode"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Pincode / Postal Code *
                  </label>
                  <input
                    id="pincode"
                    type="text"
                    required
                    name="pincode"
                    value={form.pincode}
                    onChange={handleInputChange}
                    placeholder="e.g. 400001"
                    className="mt-1 w-full rounded-lg border border-slate-300 py-2 px-3 text-xs outline-none focus:border-brand-blue"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Block */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <CreditCard className="h-4 w-4 text-brand-blue" />
                <h2 className="text-sm font-bold text-brand-charcoal uppercase tracking-wider">
                  2. Payment Method
                </h2>
              </div>

              <div className="flex items-center justify-between rounded-xl border-2 border-brand-blue bg-blue-50/40 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue text-white">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-brand-charcoal">
                      Cash on Delivery (COD)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Pay with cash or UPI scanner upon parcel arrival at your
                      doorstep.
                    </p>
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-brand-blue" />
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={placeOrderMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue py-3.5 px-6 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-600 focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 disabled:opacity-60"
            >
              {placeOrderMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Validating Stock & Placing Order...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Place Order (₹{total.toLocaleString("en-IN")})</span>
                </>
              )}
            </button>
          </form>
        </section>

        {/* Right Col: Order Snapshot */}
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-brand-charcoal uppercase tracking-wider">
              Order Items ({cartData?.totalItems || 0})
            </h2>
          </div>

          {/* Items Preview */}
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {items.map((item: any) => (
              <div
                key={item.product?._id}
                className="flex items-center gap-3 text-xs"
              >
                <img
                  src={item.product?.images?.[0] || ""}
                  alt={item.product?.name}
                  className="h-12 w-12 rounded-lg object-cover bg-slate-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-brand-charcoal truncate">
                    {item.product?.name}
                  </h4>
                  <p className="text-slate-400">Qty: {item.quantity}</p>
                </div>
                <span className="font-bold text-brand-charcoal">
                  ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-800">
                ₹{subtotal.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee</span>
              <span className="font-semibold text-slate-800">
                {shippingFee === 0 ? (
                  <span className="text-emerald-600 font-bold">FREE</span>
                ) : (
                  `₹${shippingFee}`
                )}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3 text-sm font-extrabold text-brand-charcoal">
              <span>Grand Total</span>
              <span className="text-base text-brand-blue">
                ₹{total.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 space-y-1.5 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <ShieldCheck className="h-4 w-4 text-cyan-accent" />
              <span>Zero-Trust Price Guarantee</span>
            </div>
            <p>
              Your order prices and inventory allocations are calculated and
              locked directly on the database.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
