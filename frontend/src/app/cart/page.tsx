"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Loader2,
  AlertCircle,
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

  // 1. Fetch Cart Data
  const {
    data: cartData,
    isLoading: isCartLoading,
    isError,
  } = useQuery<{ cart: CartResponse }>({
    queryKey: ["cart"],
    queryFn: async () => {
      const res = await api.get("/cart");
      return res.data;
    },
    enabled: !!user,
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

  if (isAuthLoading || (user && isCartLoading)) {
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
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
          <ShoppingBag className="mx-auto h-12 w-12 text-slate-300" />
          <h1 className="mt-4 text-xl font-bold text-brand-charcoal">
            Your Cart is Waiting
          </h1>
          <p className="mt-2 text-xs text-slate-500">
            Sign in to view your saved items, synchronize inventory, and proceed
            to checkout.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-brand-blue px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-600"
            >
              Sign In
            </Link>
            <Link
              href="/products"
              className="rounded-lg border border-slate-300 px-6 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Browse Catalog
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const cart = cartData?.cart;
  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const shippingFee = subtotal >= 1000 || subtotal === 0 ? 0 : 99;
  const grandTotal = subtotal + shippingFee;

  // Empty Cart State
  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 text-center">
        <div className="mx-auto max-w-md rounded-2xl border border-dashed border-slate-200 bg-white p-12">
          <ShoppingBag className="mx-auto h-12 w-12 text-slate-300" />
          <h1 className="mt-4 text-xl font-bold text-brand-charcoal">
            Your Shopping Cart is Empty
          </h1>
          <p className="mt-2 text-xs text-slate-500">
            Looks like you haven&apos;t added any items to your bag yet.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-blue px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-600"
          >
            <span>Explore Catalog</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand-charcoal sm:text-3xl">
          Shopping Cart ({cart?.totalItems || 0} items)
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Items are reserved based on live warehouse inventory.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-3">
        {/* Left: Cart Items List */}
        <section className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const product = item.product;
            if (!product) return null;

            return (
              <article
                key={product._id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center"
              >
                {/* Product Thumbnail */}
                <Link
                  href={`/products/${product.slug}`}
                  className="relative aspect-square h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100"
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

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-brand-charcoal hover:text-brand-blue">
                      <Link href={`/products/${product.slug}`}>
                        {product.name}
                      </Link>
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      Unit Price: ₹{item.price.toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
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
                      <span className="w-10 text-center text-xs font-bold text-slate-800">
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

                    {/* Subtotal for Item & Remove Action */}
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-extrabold text-brand-charcoal">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                      <button
                        onClick={() => removeItemMutation.mutate(product._id)}
                        disabled={removeItemMutation.isPending}
                        className="text-slate-400 transition hover:text-rose-600 p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {/* Right: Order Summary */}
        <section className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-base font-bold text-brand-charcoal">
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
            <span className="text-sm font-bold text-brand-charcoal">
              Grand Total
            </span>
            <span className="text-xl font-black text-brand-charcoal">
              ₹{grandTotal.toLocaleString("en-IN")}
            </span>
          </div>

          <button
            onClick={() => router.push("/checkout")}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue py-3 px-4 text-sm font-bold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-600 focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="mt-6 space-y-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan-accent" />
              <span>Prices verified directly against database</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-brand-blue" />
              <span>Eligible for Cash on Delivery</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
