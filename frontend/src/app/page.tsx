"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProductCard, ProductItem } from "@/components/ui/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/Skeletons";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Layers,
  Loader2,
} from "lucide-react";

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

export default function HomePage() {
  // 1. Fetch live categories
  const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories");
      return res.data?.categories as CategoryItem[];
    },
  });

  // 2. Fetch featured products
  const { data: featuredData, isLoading: isFeaturedLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const res = await api.get("/products?featured=true&limit=8");
      return res.data?.products as ProductItem[];
    },
  });

  return (
    <main className="flex flex-col gap-10 sm:gap-16 pb-12 sm:pb-20">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-brand-indigo px-4 py-16 sm:py-24 text-white sm:px-6 lg:px-8 border-b border-slate-800/80">
        <div className="absolute -top-16 -left-20 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-blue-600/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 right-0 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-2xl space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/90 px-3 py-1 sm:px-3.5 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-cyan-400 shadow-inner">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span>Next-Gen Full-Stack E-Commerce</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl sm:leading-tight">
              Curated gear,{" "}
              <span className="bg-linear-to-r from-blue-500 via-cyan-400 to-cyan-300 bg-clip-text text-transparent drop-shadow-sm">
                verified delivery.
              </span>
            </h1>

            <p className="text-xs sm:text-base leading-relaxed text-slate-300 font-normal max-w-xl">
              Engineered with zero-trust server validation, live inventory
              tracking, and authenticated Cash on Delivery checkouts.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2 sm:pt-4">
              <Link
                href="/products"
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-500 active:scale-[0.98]"
              >
                <span>Browse Catalog</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/products?sort=newest"
                className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/90 px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white"
              >
                New Arrivals
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Value Propositions Bar */}
      <section className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          <div className="flex items-center gap-3.5 sm:gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Truck className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                Cash on Delivery
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Pay safely at your doorstep
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 sm:gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
              <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                Verified Inventory
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Real-time stock synchronization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 sm:gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <RotateCcw className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                Order Tracking
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Unique snapshot tracking IDs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 sm:gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                Verified Reviews
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-500">
                1 review per customer guard
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Category Discovery Section */}
      <section className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 sm:pb-4">
          <div>
            <h2 className="text-base sm:text-2xl font-bold tracking-tight text-slate-900">
              Explore Collections
            </h2>
            <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-slate-500">
              Browse products categorized by essentials and premium gear.
            </p>
          </div>
          <Link
            href="/products"
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
          >
            <span>All Categories</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isCategoriesLoading ? (
          <div className="flex justify-center py-8 sm:py-10">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : categoriesData && categoriesData.length > 0 ? (
          <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3">
            {categoriesData.map((cat) => (
              <Link
                key={cat._id}
                href={`/products?category=${cat.slug}`}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-blue-600 hover:text-blue-600 hover:shadow-sm"
              >
                <Layers className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-4 sm:mt-6 rounded-xl border border-dashed border-slate-200 p-6 sm:p-8 text-center text-xs text-slate-400">
            No categories available yet.
          </div>
        )}
      </section>

      {/* 4. Featured Products Grid */}
      <section className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 sm:pb-4">
          <div>
            <h2 className="text-base sm:text-2xl font-bold tracking-tight text-slate-900">
              Featured Products
            </h2>
            <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-slate-500">
              Hand-picked collections with live inventory guarantee.
            </p>
          </div>
          <Link
            href="/products?featured=true"
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isFeaturedLoading ? (
          <div className="mt-6 sm:mt-8">
            <ProductGridSkeleton count={4} />
          </div>
        ) : featuredData && featuredData.length > 0 ? (
          <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-6">
            {featuredData.map((prod) => (
              <ProductCard key={prod._id} product={prod} />
            ))}
          </div>
        ) : (
          <div className="mt-6 sm:mt-8 rounded-2xl border border-dashed border-slate-200 bg-white p-8 sm:p-12 text-center">
            <Layers className="mx-auto h-8 w-8 text-slate-300" />
            <h3 className="mt-3 text-sm font-bold text-slate-900">
              No featured products yet
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Add products to see them here.
            </p>
            <div className="mt-4 sm:mt-5">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-500"
              >
                Browse All Products
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
