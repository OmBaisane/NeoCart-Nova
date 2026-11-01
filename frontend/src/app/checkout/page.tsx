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
  AlertTriangle,
  Loader2,
  Lock,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

interface ShippingAddressState {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface StockIssue {
  productId: string;
  name: string;
  issueType:
    | "OUT_OF_STOCK"
    | "INSUFFICIENT_STOCK"
    | "INACTIVE"
    | "PRICE_CHANGED";
  message: string;
  availableStock: number;
  requestedQuantity: number;
}

interface CartItem {
  product?: {
    _id: string;
    name: string;
    images?: string[];
    stock?: number;
  };
  quantity: number;
  price: number;
}

interface CartData {
  items: CartItem[];
  subtotal: number;
  totalItems: number;
}

interface ValidationData {
  success: boolean;
  isValid: boolean;
  issues: StockIssue[];
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

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace("/login?redirect=/checkout");
    }
  }, [user, isAuthLoading, router]);

  // 1. Fetch Cart
  const {
    data: cartData,
    isLoading: isCartLoading,
    isFetching: isCartFetching,
    isError: isCartError,
    refetch: refetchCart,
  } = useQuery<CartData>({
    queryKey: ["cart"],
    queryFn: async () => {
      const res = await api.get("/cart");
      return res.data?.cart;
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: "always",
  });

  // 2. Live Stock Validation
  const {
    data: validationData,
    isLoading: isValidating,
    isFetching: isValidationFetching,
    isError: isValidationError,
    isSuccess: isValidationSuccess,
    refetch: recheckStock,
  } = useQuery<ValidationData>({
    queryKey: ["cart-validation"],
    queryFn: async () => {
      const res = await api.get("/cart/validate");

      if (!res.data || typeof res.data.success !== "boolean") {
        throw new Error("Unable to verify cart inventory.");
      }

      return res.data;
    },
    enabled: !!user && !!cartData && cartData.items?.length > 0,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const stockIssues = validationData?.issues || [];
  const hasStockErrors =
    stockIssues.length > 0 || validationData?.isValid === false;

  const isValidationReady =
    isValidationSuccess &&
    validationData?.success === true &&
    validationData?.isValid === true &&
    !hasStockErrors;

  const isValidationUnavailable =
    isValidationError ||
    (isValidationSuccess && validationData?.success !== true);

  // 3. Place Order
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
      queryClient.invalidateQueries({ queryKey: ["cart-validation"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });

      const orderId = data?.order?._id;

      if (!orderId) {
        setValidationError(
          "Your order may have been placed, but the confirmation could not be loaded. Please check your orders.",
        );
        return;
      }

      router.replace(`/order-success/${orderId}`);
    },

    onError: (err: {
      response?: { data?: { message?: string } };
      message?: string;
    }) => {
      setValidationError(
        err.response?.data?.message ||
          err.message ||
          "Failed to place order. Please review your cart and try again.",
      );

      void recheckStock();
    },
  });

  if (isAuthLoading || (user && isCartLoading && !cartData)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue dark:text-cyan-400" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (isCartError) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/30">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-600 dark:text-rose-400" />
          <h2 className="mt-3 text-sm font-bold text-rose-900 dark:text-rose-200">
            Unable to Load Your Cart
          </h2>
          <p className="mt-2 text-xs text-rose-700 dark:text-rose-300">
            Something went wrong while retrieving your cart. Please try again.
          </p>
          <button
            type="button"
            onClick={() => void refetchCart()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-600"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      </main>
    );
  }

  const items = cartData?.items || [];
  const subtotal = cartData?.subtotal || 0;
  const shippingFee = subtotal >= 1000 || subtotal === 0 ? 0 : 99;
  const total = subtotal + shippingFee;

  if (!isCartFetching && items.length === 0) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
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

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setValidationError(null);

    if (isCartFetching) {
      setValidationError("Please wait while your cart is being updated.");
      return;
    }

    if (isValidationUnavailable) {
      setValidationError(
        "We couldn't verify product availability. Please retry the inventory check before placing your order.",
      );
      return;
    }

    if (!isValidationReady || isValidationFetching) {
      setValidationError(
        "Please wait until live inventory verification is complete.",
      );
      return;
    }

    if (hasStockErrors) {
      setValidationError(
        "Please resolve inventory issues before placing your order.",
      );
      return;
    }

    if (form.fullName.trim().length < 2) {
      setValidationError("Full name must be at least 2 characters long.");
      return;
    }

    if (form.phone.replace(/\D/g, "").length < 10) {
      setValidationError("Please enter a valid phone number.");
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

  const isOrderDisabled =
    placeOrderMutation.isPending ||
    isCartFetching ||
    isValidating ||
    isValidationFetching ||
    !isValidationReady ||
    hasStockErrors ||
    isValidationUnavailable;

  return (
    <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
        <h1 className="text-xl font-extrabold tracking-tight text-brand-charcoal sm:text-3xl dark:text-white">
          Secure Checkout
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Provide your delivery address and confirm your Cash on Delivery order.
        </p>
      </div>

      {/* Inventory Issues */}
      {hasStockErrors && (
        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/40">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />

            <div className="flex-1 space-y-1.5">
              <h3 className="text-xs font-bold text-amber-900 sm:text-sm dark:text-amber-200">
                Inventory Availability Changed
              </h3>

              <p className="text-xs text-amber-800 dark:text-amber-300">
                Some items in your cart have sold out or have limited quantities
                remaining:
              </p>

              {stockIssues.length > 0 && (
                <ul className="list-disc space-y-1 pl-4 text-xs text-amber-800 dark:text-amber-300">
                  {stockIssues.map((issue) => (
                    <li key={issue.productId}>
                      <strong>{issue.name}:</strong> {issue.message}
                    </li>
                  ))}
                </ul>
              )}

              <div className="pt-2">
                <Link
                  href="/cart"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-700"
                >
                  <span>Update Cart Items</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Validation Failure */}
      {isValidationUnavailable && !hasStockErrors && (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-rose-900/50 dark:bg-rose-950/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <div>
              <h3 className="text-xs font-bold text-rose-800 dark:text-rose-300">
                Inventory Verification Failed
              </h3>
              <p className="mt-1 text-xs text-rose-700 dark:text-rose-400">
                We couldn&apos;t verify your cart. Your order is temporarily
                disabled until inventory can be checked.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void recheckStock()}
            disabled={isValidationFetching}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isValidationFetching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Retry Verification
          </button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 sm:mt-8 lg:grid-cols-3 lg:gap-12">
        {/* Left: Shipping Form */}
        <section className="lg:col-span-2">
          <form onSubmit={handleFormSubmit} className="space-y-4 sm:space-y-6">
            {validationError && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 sm:p-4 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Shipping Information */}
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <MapPin className="h-4 w-4 text-brand-blue dark:text-cyan-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-brand-charcoal sm:text-sm dark:text-white">
                  1. Shipping Information
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Full Name *
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="fullName"
                      type="text"
                      required
                      name="fullName"
                      autoComplete="name"
                      value={form.fullName}
                      onChange={handleInputChange}
                      placeholder="Receiver's name"
                      className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs outline-none focus:border-brand-blue dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-cyan-500"
                    />
                    <UserIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Mobile Phone Number *
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="phone"
                      type="tel"
                      required
                      name="phone"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={handleInputChange}
                      placeholder="+91 9876543210"
                      className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs outline-none focus:border-brand-blue dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-cyan-500"
                    />
                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Flat, House No., Building, Street Address *
                </label>
                <input
                  id="address"
                  type="text"
                  required
                  name="address"
                  autoComplete="street-address"
                  value={form.address}
                  onChange={handleInputChange}
                  placeholder="e.g. Flat 402, Nova Heights, MG Road"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand-blue dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3 sm:gap-4">
                <div>
                  <label
                    htmlFor="city"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    City *
                  </label>
                  <input
                    id="city"
                    type="text"
                    required
                    name="city"
                    autoComplete="address-level2"
                    value={form.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Mumbai"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand-blue dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="state"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    State *
                  </label>
                  <input
                    id="state"
                    type="text"
                    required
                    name="state"
                    autoComplete="address-level1"
                    value={form.state}
                    onChange={handleInputChange}
                    placeholder="e.g. Maharashtra"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand-blue dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pincode"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Pincode / Postal Code *
                  </label>
                  <input
                    id="pincode"
                    type="text"
                    required
                    name="pincode"
                    autoComplete="postal-code"
                    value={form.pincode}
                    onChange={handleInputChange}
                    placeholder="e.g. 400001"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand-blue dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <CreditCard className="h-4 w-4 text-brand-blue dark:text-cyan-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-brand-charcoal sm:text-sm dark:text-white">
                  2. Payment Method
                </h2>
              </div>

              <div className="flex items-start justify-between gap-3 rounded-xl border-2 border-brand-blue bg-blue-50/40 p-3.5 sm:items-center sm:p-4 dark:border-cyan-500 dark:bg-cyan-950/20">
                <div className="flex items-start gap-3 sm:items-center">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-blue text-white sm:mt-0 sm:h-10 sm:w-10 dark:bg-cyan-600">
                    <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-brand-charcoal sm:text-sm dark:text-white">
                      Cash on Delivery (COD)
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-tight text-slate-500 sm:text-xs dark:text-slate-400">
                      Pay with cash or UPI scanner upon parcel arrival at your
                      doorstep.
                    </p>
                  </div>
                </div>
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue sm:mt-0 dark:text-cyan-400" />
              </div>
            </div>

            {/* Place Order */}
            <button
              type="submit"
              disabled={isOrderDisabled}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-600 focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:text-sm dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {placeOrderMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Placing Order...</span>
                </>
              ) : isValidating || isValidationFetching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying Live Inventory...</span>
                </>
              ) : isValidationUnavailable ? (
                <span>Inventory Verification Unavailable</span>
              ) : hasStockErrors ? (
                <span>Resolve Stock Issues to Checkout</span>
              ) : !isValidationReady ? (
                <span>Waiting for Inventory Verification...</span>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Place Order (₹{total.toLocaleString("en-IN")})</span>
                </>
              )}
            </button>
          </form>
        </section>

        {/* Right: Order Snapshot */}
        <aside className="h-fit space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs sm:space-y-6 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-charcoal sm:text-sm dark:text-white">
              Order Items ({cartData?.totalItems || 0})
            </h2>

            {(isValidating || isValidationFetching) && (
              <span className="animate-pulse text-[10px] font-medium text-cyan-600 dark:text-cyan-400">
                Syncing stock...
              </span>
            )}
          </div>

          {/* Items Preview */}
          <div className="max-h-56 space-y-3 overflow-y-auto pr-1 sm:max-h-60">
            {items.map((item) => {
              const itemIssue = stockIssues.find(
                (issue) => issue.productId === item.product?._id,
              );

              return (
                <div
                  key={item.product?._id}
                  className={`flex items-center gap-3 rounded-xl p-2 text-xs transition ${
                    itemIssue
                      ? "border border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/30"
                      : ""
                  }`}
                >
                  <img
                    src={item.product?.images?.[0] || ""}
                    alt={item.product?.name || "Product"}
                    className="h-11 w-11 shrink-0 rounded-lg bg-slate-100 object-cover sm:h-12 sm:w-12 dark:bg-slate-800"
                  />

                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-[11px] font-bold text-brand-charcoal sm:text-xs dark:text-white">
                      {item.product?.name}
                    </h4>

                    <p className="text-[10px] text-slate-400 sm:text-[11px] dark:text-slate-500">
                      Qty: {item.quantity}
                    </p>

                    {itemIssue && (
                      <span className="block truncate text-[10px] font-bold text-rose-600 dark:text-rose-400">
                        {itemIssue.message}
                      </span>
                    )}
                  </div>

                  <span className="shrink-0 text-xs font-bold text-brand-charcoal dark:text-white">
                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Price Summary */}
          <div className="space-y-2 border-t border-slate-100 pt-3.5 text-xs dark:border-slate-800">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                ₹{subtotal.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Delivery Fee</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {shippingFee === 0 ? (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    FREE
                  </span>
                ) : (
                  `₹${shippingFee}`
                )}
              </span>
            </div>

            <div className="flex justify-between border-t border-slate-100 pt-3 text-xs font-extrabold text-brand-charcoal sm:text-sm dark:border-slate-800 dark:text-white">
              <span>Grand Total</span>
              <span className="text-sm text-brand-blue sm:text-base dark:text-cyan-400">
                ₹{total.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Security Information */}
          <div className="space-y-1 rounded-xl border border-slate-100 bg-slate-50 p-3 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
              <ShieldCheck className="h-4 w-4 shrink-0 text-cyan-accent dark:text-cyan-400" />
              <span>Live Inventory Verification</span>
            </div>

            <p className="text-[10px] leading-tight sm:text-[11px]">
              Product availability is checked before checkout. Final stock
              allocation and order validation must also be enforced by the
              server when the order is created.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
