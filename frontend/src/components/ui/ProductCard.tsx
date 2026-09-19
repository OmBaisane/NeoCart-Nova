"use client";

import React from "react";
import Link from "next/link";
import { Star, ShoppingCart } from "lucide-react";

export interface ProductItem {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number;
  images: string[];
  category?: {
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
  const hasDiscount =
    product.discountPrice !== undefined &&
    product.discountPrice > 0 &&
    product.discountPrice < product.price;

  const currentPrice = hasDiscount ? product.discountPrice! : product.price;
  const isOutOfStock = product.stock <= 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
      {/* Product Image Container */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square w-full overflow-hidden bg-slate-100"
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
          <span className="absolute top-3 right-3 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
            Out of Stock
          </span>
        ) : product.stock <= 5 ? (
          <span className="absolute top-3 right-3 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-xs">
            Only {product.stock} left
          </span>
        ) : null}
      </Link>

      {/* Product Details */}
      <div className="flex flex-1 flex-col p-4">
        {/* Category Name */}
        {product.category && (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {product.category.name}
          </span>
        )}

        {/* Title */}
        <h3 className="mt-1 line-clamp-1 text-sm font-bold text-brand-charcoal transition-colors group-hover:text-brand-blue">
          <Link href={`/products/${product.slug}`}>{product.name}</Link>
        </h3>

        {/* Rating Row */}
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <div className="flex items-center text-amber-500">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="ml-1 font-semibold text-slate-700">
              {product.rating > 0 ? product.rating.toFixed(1) : "New"}
            </span>
          </div>
          <span className="text-slate-300">•</span>
          <span>
            {product.reviewCount}{" "}
            {product.reviewCount === 1 ? "review" : "reviews"}
          </span>
        </div>

        {/* Price & Action Row */}
        <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex flex-col">
            <span className="text-base font-extrabold text-brand-charcoal">
              ₹{currentPrice.toLocaleString("en-IN")}
            </span>
            {hasDiscount && (
              <span className="text-xs text-slate-400 line-through">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          <Link
            href={`/products/${product.slug}`}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-blue"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>View</span>
          </Link>
        </div>
      </div>
    </article>
  );
};
