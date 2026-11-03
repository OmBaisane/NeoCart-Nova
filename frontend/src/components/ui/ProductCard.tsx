"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Star,
  ShoppingCart,
  Heart,
  Loader2,
  GitCompareArrows,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export interface ProductItem {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number;
  images: string[];
  category?: {
    _id?: string;
    name: string;
    slug: string;
  };
  stock: number;
  rating: number;
  reviewCount: number;
}

interface ProductCardProps {
  product: ProductItem;
}

const COMPARE_STORAGE_KEY = "neocart_compare";
const COMPARE_UPDATED_EVENT = "neocart:compare-updated";
const MAX_COMPARE_PRODUCTS = 4;

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [isInCompare, setIsInCompare] = useState(false);
  const [compareLimitReached, setCompareLimitReached] = useState(false);

  const hasDiscount =
    product.discountPrice !== undefined &&
    product.discountPrice !== null &&
    product.discountPrice > 0 &&
    product.discountPrice < product.price;

  const currentPrice = hasDiscount ? product.discountPrice! : product.price;
  const isOutOfStock = product.stock <= 0;

  const getCompareProducts = (): string[] => {
    try {
      const stored = localStorage.getItem(COMPARE_STORAGE_KEY);
      const parsed: unknown = stored ? JSON.parse(stored) : [];

      if (!Array.isArray(parsed)) return [];

      return [
        ...new Set(
          parsed.filter(
            (id): id is string =>
              typeof id === "string" && id.trim().length > 0,
          ),
        ),
      ].slice(0, MAX_COMPARE_PRODUCTS);
    } catch {
      return [];
    }
  };

  const updateCompareState = () => {
    const ids = getCompareProducts();

    setIsInCompare(ids.includes(product._id));
    setCompareLimitReached(
      !ids.includes(product._id) && ids.length >= MAX_COMPARE_PRODUCTS,
    );
  };

  useEffect(() => {
    updateCompareState();

    window.addEventListener("storage", updateCompareState);
    window.addEventListener(COMPARE_UPDATED_EVENT, updateCompareState);

    return () => {
      window.removeEventListener("storage", updateCompareState);
      window.removeEventListener(COMPARE_UPDATED_EVENT, updateCompareState);
    };
  }, [product._id]);

  const handleCompareClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const ids = getCompareProducts();

    if (ids.includes(product._id)) {
      updateCompareState();
      return;
    }

    if (ids.length >= MAX_COMPARE_PRODUCTS) {
      setCompareLimitReached(true);
      return;
    }

    const updatedIds = [...ids, product._id];

    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(updatedIds));

    setIsInCompare(true);
    setCompareLimitReached(false);

    window.dispatchEvent(new Event(COMPARE_UPDATED_EVENT));
  };

  // Wishlist
  const { data: wishlistData, isLoading: wishlistLoading } = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const res = await api.get("/wishlist");
      return res.data;
    },
    enabled: !!user,
    staleTime: 1000 * 60,
  });

  const isInWishlist = Boolean(
    wishlistData?.products?.some(
      (item: { _id: string }) => item._id === product._id,
    ),
  );

  const toggleWishlistMutation = useMutation({
    mutationFn: async () => {
      if (isInWishlist) {
        return api.delete(`/wishlist/${product._id}`);
      }

      return api.post("/wishlist", { productId: product._id });
    },
    onSuccess: (response) => {
      queryClient.setQueryData(["wishlist"], response.data);
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  const handleWishlistClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push(
        `/login?redirect=${encodeURIComponent(`/products/${product.slug}`)}`,
      );
      return;
    }

    if (!toggleWishlistMutation.isPending) {
      toggleWishlistMutation.mutate();
    }
  };

  // Add to Cart
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/cart/items", {
        productId: product._id,
        quantity: 1,
      });

      return response.data;
    },
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(["cart"], updatedCart);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push(
        `/login?redirect=${encodeURIComponent(`/products/${product.slug}`)}`,
      );
      return;
    }

    if (isOutOfStock || addToCartMutation.isPending) return;

    addToCartMutation.mutate();
  };

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:shadow-slate-950/60">
      {/* Wishlist Button */}
      <button
        type="button"
        onClick={handleWishlistClick}
        disabled={
          authLoading ||
          (!!user && (wishlistLoading || toggleWishlistMutation.isPending))
        }
        className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-sm backdrop-blur-md transition-all ${
          isInWishlist
            ? "bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/40"
            : "bg-white/70 text-slate-400 hover:bg-white hover:text-rose-500 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-rose-400"
        }`}
        aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={isInWishlist}
      >
        {toggleWishlistMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart className={`h-4 w-4 ${isInWishlist ? "fill-current" : ""}`} />
        )}
      </button>

      {/* Product Image */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-800/60"
      >
        <img
          src={
            product.images?.[0] ||
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80"
          }
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />

        {hasDiscount && (
          <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
            SAVE ₹{(product.price - currentPrice).toLocaleString("en-IN")}
          </span>
        )}

        {isOutOfStock ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm backdrop-blur-xs dark:bg-slate-950/80">
            Out of Stock
          </span>
        ) : product.stock <= 5 ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
            Only {product.stock} left
          </span>
        ) : null}
      </Link>

      {/* Product Details */}
      <div className="flex flex-1 flex-col p-4">
        {product.category && (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {product.category.name}
          </span>
        )}

        <h3 className="mt-1 line-clamp-1 text-sm font-bold text-brand-charcoal transition-colors group-hover:text-brand-blue dark:text-white dark:group-hover:text-cyan-400">
          <Link href={`/products/${product.slug}`}>{product.name}</Link>
        </h3>

        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center text-amber-500">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="ml-1 font-semibold text-slate-700 dark:text-slate-300">
              {product.rating > 0 ? product.rating.toFixed(1) : "New"}
            </span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span>
            {product.reviewCount}{" "}
            {product.reviewCount === 1 ? "review" : "reviews"}
          </span>
        </div>

        {/* Price */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="flex flex-col">
            <span className="text-base font-extrabold text-brand-charcoal dark:text-white">
              ₹{currentPrice.toLocaleString("en-IN")}
            </span>

            {hasDiscount && (
              <span className="text-xs text-slate-400 line-through dark:text-slate-500">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          <Link
            href={`/products/${product.slug}`}
            className="text-xs font-semibold text-brand-blue transition hover:underline dark:text-cyan-400"
          >
            View Details
          </Link>
        </div>

        {/* Add to Cart */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock || authLoading || addToCartMutation.isPending}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-blue disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-cyan-600"
        >
          {addToCartMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : addToCartMutation.isSuccess ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <ShoppingCart className="h-4 w-4" />
          )}

          {isOutOfStock
            ? "Out of Stock"
            : addToCartMutation.isPending
              ? "Adding to Cart..."
              : addToCartMutation.isSuccess
                ? "Added to Cart"
                : "Add to Cart"}
        </button>

        {addToCartMutation.isError && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Unable to add this product to your cart. Please try again.
          </p>
        )}

        {/* Compare */}
        <button
          type="button"
          onClick={handleCompareClick}
          disabled={isInCompare || compareLimitReached}
          className={`mt-2 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition ${
            isInCompare
              ? "cursor-default border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
              : compareLimitReached
                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-500"
                : "border-slate-200 bg-white text-slate-600 hover:border-brand-blue hover:text-brand-blue dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-500 dark:hover:text-cyan-400"
          }`}
          aria-label={
            isInCompare ? "Already added to comparison" : "Add to comparison"
          }
          aria-pressed={isInCompare}
          title={
            compareLimitReached
              ? "You can compare up to 4 products. Remove one to add another."
              : undefined
          }
        >
          <GitCompareArrows className="h-4 w-4" />
          <span>
            {isInCompare
              ? "Added to Compare"
              : compareLimitReached
                ? "Compare Limit Reached"
                : "Add to Compare"}
          </span>
        </button>
      </div>
    </article>
  );
};
