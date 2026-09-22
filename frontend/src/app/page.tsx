"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProductCard, ProductItem } from "@/components/ui/ProductCard";
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
    <div className="flex flex-col gap-16 pb-20">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-brand-dark px-4 py-20 text-white sm:px-6 lg:px-8">
        {/* Background glow effects */}
        <div className="absolute top-1/4 -left-20 h-72 w-72 rounded-full bg-brand-blue/30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-accent/20 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/80 px-3.5 py-1 text-xs font-semibold text-cyan-accent">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Next-Gen Full-Stack E-Commerce</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl sm:leading-tight">
              Curated gear,{" "}
              <span className="bg-linear-to-r from-brand-blue to-cyan-accent bg-clip-text text-transparent">
                verified delivery.
              </span>
            </h1>

            <p className="text-sm leading-relaxed text-slate-400 sm:text-base">
              Engineered with zero-trust server validation, live inventory
              tracking, and authenticated Cash on Delivery checkouts.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                href="/products"
                className="flex items-center gap-2 rounded-xl bg-brand-blue px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-600"
              >
                <span>Browse Catalog</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/products?sort=newest"
                className="rounded-xl border border-slate-700 bg-slate-800/60 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-700"
              >
                New Arrivals
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Value Propositions Bar */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand-blue">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-charcoal">
                Cash on Delivery
              </h4>
              <p className="text-xs text-slate-500">
                Pay safely at your doorstep
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-accent">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-charcoal">
                Verified Inventory
              </h4>
              <p className="text-xs text-slate-500">
                Real-time stock synchronization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <RotateCcw className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-charcoal">
                Order Tracking
              </h4>
              <p className="text-xs text-slate-500">
                Unique snapshot tracking IDs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-charcoal">
                Verified Reviews
              </h4>
              <p className="text-xs text-slate-500">
                1 review per customer guard
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Category Discovery Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-brand-charcoal sm:text-2xl">
              Explore Collections
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Browse products categorized by essentials and premium gear.
            </p>
          </div>
          <Link
            href="/products"
            className="flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline"
          >
            <span>All Categories</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isCategoriesLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
          </div>
        ) : categoriesData && categoriesData.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {categoriesData.map((cat) => (
              <Link
                key={cat._id}
                href={`/products?category=${cat.slug}`}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-brand-blue hover:text-brand-blue hover:shadow-sm"
              >
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
            No categories available yet. You can create them via the Admin
            Portal.
          </div>
        )}
      </section>

      {/* 4. Featured Products Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-brand-charcoal sm:text-2xl">
              Featured Products
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Hand-picked collections with live inventory guarantee.
            </p>
          </div>
          <Link
            href="/products?featured=true"
            className="flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isFeaturedLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
          </div>
        ) : featuredData && featuredData.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {featuredData.map((prod) => (
              <ProductCard key={prod._id} product={prod} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <Layers className="mx-auto h-8 w-8 text-slate-300" />
            <h3 className="mt-3 text-sm font-bold text-brand-charcoal">
              No featured products yet
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Once products are added and marked as featured in the catalog,
              they will appear here automatically.
            </p>
            <div className="mt-5">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-600"
              >
                Browse All Products
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
