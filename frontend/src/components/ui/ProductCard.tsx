"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, ShoppingCart, Heart, Loader2 } from "lucide-react";
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

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const hasDiscount =
    product.discountPrice !== undefined &&
    product.discountPrice > 0 &&
    product.discountPrice < product.price;

  const currentPrice = hasDiscount ? product.discountPrice! : product.price;
  const isOutOfStock = product.stock <= 0;

  // Global Wishlist Query for the Card
  const { data: wishlistData } = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const res = await api.get("/wishlist");
      return res.data;
    },
    enabled: !!user,
    staleTime: 1000 * 60, // 1 minute
  });

  const isInWishlist = wishlistData?.products?.some(
    (p: { _id: string }) => p._id === product._id,
  );

  const toggleWishlistMutation = useMutation({
    mutationFn: async () => {
      if (isInWishlist) {
        return api.delete(`/wishlist/${product._id}`);
      } else {
        return api.post("/wishlist", { productId: product._id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push("/login?redirect=/products");
      return;
    }
    toggleWishlistMutation.mutate();
  };

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:shadow-slate-950/60">
      {/* Wishlist Button - Placed at Top Right */}
      <button
        type="button"
        onClick={handleWishlistClick}
        disabled={toggleWishlistMutation.isPending}
        className={`absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all shadow-sm ${
          isInWishlist
            ? "bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/40"
            : "bg-white/70 text-slate-400 hover:bg-white hover:text-rose-500 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-rose-400"
        }`}
        aria-label="Toggle Wishlist"
      >
        {toggleWishlistMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart className={`h-4 w-4 ${isInWishlist ? "fill-current" : ""}`} />
        )}
      </button>

      {/* Product Image Container */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-800/60"
      >
        <img
          src={
            product.images[0] ||
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80"
          }
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />

        {/* Discount Badge */}
        {hasDiscount && (
          <span className="absolute top-3 left-3 rounded-full bg-rose-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
            SAVE ₹{product.price - product.discountPrice!}
          </span>
        )}

        {/* Stock Status Pill */}
        {isOutOfStock ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs dark:bg-slate-950/80 shadow-sm">
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
        {/* Category Name */}
        {product.category && (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {product.category.name}
          </span>
        )}

        {/* Title */}
        <h3 className="mt-1 line-clamp-1 text-sm font-bold text-brand-charcoal transition-colors group-hover:text-brand-blue dark:text-white dark:group-hover:text-cyan-400">
          <Link href={`/products/${product.slug}`}>{product.name}</Link>
        </h3>

        {/* Rating Row */}
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

        {/* Price & Action Row */}
        <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
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
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-blue dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-cyan-600"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>View</span>
          </Link>
        </div>
      </div>
    </article>
  );
};
