"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Loader2,
} from "lucide-react";

interface CartItemPopulated {
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    discountPrice?: number;
    images: string[];
    stock: number;
    isActive: boolean;
  };
  quantity: number;
  price: number;
}

interface CartResponse {
  _id: string;
  user: string;
  items: CartItemPopulated[];
  totalItems: number;
  subtotal: number;
}

export default function CartPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();

  // 1. Fetch Cart Data with Zero StaleTime & Instant Mount Sync
  const {
    data: cartData,
    isLoading: isCartLoading,
    isFetching,
  } = useQuery<{
    cart: CartResponse;
  }>({
    queryKey: ["cart"],
    queryFn: async () => {
      const res = await api.get("/cart");
      return res.data;
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: "always",
  });

  // 2. Update Item Quantity Mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => {
      return api.patch(`/cart/items/${productId}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  // 3. Remove Item Mutation
  const removeItemMutation = useMutation({
    mutationFn: async (productId: string) => {
      return api.delete(`/cart/items/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  // Initial loading state jab user check ho raha ho ya cart pehli baar fetch ho rahi ho
  if (isAuthLoading || (user && isCartLoading && !cartData)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  // Not Logged In State
  if (!user) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 text-center">
        <EmptyState
          icon={ShoppingBag}
          title="Your Cart is Waiting"
          description="Sign in to view your saved items, synchronize inventory, and proceed to checkout."
          actionLabel="Sign In"
          actionHref="/login"
        />
      </main>
    );
  }

  const cart = cartData?.cart;
  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const shippingFee = subtotal >= 1000 || subtotal === 0 ? 0 : 99;
  const grandTotal = subtotal + shippingFee;

  // Empty Cart State (Only when NOT fetching and genuinely 0 items)
  if (!isFetching && items.length === 0) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 text-center">
        <EmptyState
          icon={ShoppingBag}
          title="Your Shopping Cart is Empty"
          description="Looks like you haven't added any items to your bag yet."
          actionLabel="Explore Catalog"
          actionHref="/products"
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-extrabold tracking-tight text-brand-charcoal sm:text-3xl">
          Shopping Cart ({cart?.totalItems || 0} items)
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Items are reserved based on live warehouse inventory.
        </p>
      </div>

      <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-12">
        {/* Left: Cart Items List */}
        <section className="lg:col-span-2 space-y-3 sm:space-y-4">
          {items.map((item) => {
            const product = item.product;
            if (!product) return null;

            return (
              <article
                key={product._id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  {/* Product Thumbnail */}
                  <Link
                    href={`/products/${product.slug}`}
                    className="relative aspect-square h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100"
                  >
                    <img
                      src={
                        product.images?.[0] ||
                        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80"
                      }
                      alt={product.name}
                      className="h-full w-full object-cover object-center"
                    />
                  </Link>

                  {/* Title & Unit Price */}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-sm font-bold text-brand-charcoal hover:text-brand-blue truncate">
                      <Link href={`/products/${product.slug}`}>
                        {product.name}
                      </Link>
                    </h3>
                    <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs font-semibold text-slate-400">
                      Unit Price: ₹{item.price.toLocaleString("en-IN")}
                    </p>
                    <div className="mt-1 sm:hidden">
                      <span className="text-xs font-extrabold text-brand-charcoal">
                        Subtotal: ₹
                        {(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions & Quantity row */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 sm:border-0 sm:pt-0 sm:justify-end sm:gap-6">
                  {/* Quantity Selector */}
                  <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50">
                    <button
                      onClick={() =>
                        updateQuantityMutation.mutate({
                          productId: product._id,
                          quantity: item.quantity - 1,
                        })
                      }
                      disabled={
                        updateQuantityMutation.isPending || item.quantity <= 1
                      }
                      className="p-1.5 text-slate-600 hover:bg-slate-200 disabled:opacity-30 rounded-l-lg"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 sm:w-10 text-center text-xs font-bold text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantityMutation.mutate({
                          productId: product._id,
                          quantity: item.quantity + 1,
                        })
                      }
                      disabled={
                        updateQuantityMutation.isPending ||
                        item.quantity >= product.stock
                      }
                      className="p-1.5 text-slate-600 hover:bg-slate-200 disabled:opacity-30 rounded-r-lg"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Subtotal for Item (Desktop) & Remove Action */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="hidden sm:inline-block text-sm font-extrabold text-brand-charcoal">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </span>
                    <button
                      onClick={() => removeItemMutation.mutate(product._id)}
                      disabled={removeItemMutation.isPending}
                      className="rounded-lg p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {/* Right: Order Summary */}
        <section className="h-fit rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
          <h2 className="text-sm sm:text-base font-bold text-brand-charcoal">
            Order Summary
          </h2>

          <div className="mt-4 space-y-3 text-xs border-b border-slate-100 pb-4">
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

            {shippingFee > 0 && (
              <p className="text-[11px] text-brand-blue bg-blue-50 p-2 rounded-lg">
                Add items worth ₹{(1000 - subtotal).toLocaleString("en-IN")}{" "}
                more to unlock FREE delivery!
              </p>
            )}
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-xs sm:text-sm font-bold text-brand-charcoal">
              Grand Total
            </span>
            <span className="text-lg sm:text-xl font-black text-brand-charcoal">
              ₹{grandTotal.toLocaleString("en-IN")}
            </span>
          </div>

          <button
            onClick={() => router.push("/checkout")}
            className="mt-5 sm:mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue py-3 px-4 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-600 focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="mt-5 sm:mt-6 space-y-2 text-[10px] sm:text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan-accent shrink-0" />
              <span>Prices verified directly against database</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-brand-blue shrink-0" />
              <span>Eligible for Cash on Delivery</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
