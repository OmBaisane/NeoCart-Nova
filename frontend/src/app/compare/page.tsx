"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProductItem } from "@/components/ui/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Scale, Trash2, ArrowRight, Loader2, Star } from "lucide-react";

export default function ComparePage() {
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("neocart_compare_list");
      if (stored) {
        setCompareIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load comparison list:", e);
    }
  }, []);

  const { data, isLoading } = useQuery<{
    success: boolean;
    products: ProductItem[];
  }>({
    queryKey: ["compare-products", compareIds],
    queryFn: async () => {
      if (compareIds.length === 0) return { success: true, products: [] };
      const promises = compareIds.map((id) =>
        api.get(`/products/${id}`).catch(() => null),
      );
      const results = await Promise.all(promises);
      const products = results.map((res) => res?.data?.product).filter(Boolean);
      return { success: true, products };
    },
    enabled: compareIds.length > 0,
  });

  const products = data?.products || [];

  const handleRemove = (id: string) => {
    const updated = compareIds.filter((item) => item !== id);
    setCompareIds(updated);
    localStorage.setItem("neocart_compare_list", JSON.stringify(updated));
  };

  const handleClear = () => {
    setCompareIds([]);
    localStorage.removeItem("neocart_compare_list");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue dark:text-cyan-400" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Product Comparison ({products.length}/3)
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Compare specifications side-by-side for products within the same
            category.
          </p>
        </div>

        {products.length > 0 && (
          <button
            onClick={handleClear}
            className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 transition"
          >
            Clear Comparison
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={Scale}
            title="No products selected for comparison"
            description="You can compare up to 3 products from the same category by clicking 'Compare' on product pages."
            actionLabel="Browse Catalog"
            actionHref="/products"
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr>
                <td className="p-4 font-bold bg-slate-50 dark:bg-slate-800/60 w-36">
                  Product
                </td>
                {products.map((p) => (
                  <td key={p._id} className="p-4 min-w-55 align-top">
                    <div className="relative aspect-square w-32 mx-auto overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 mb-3">
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                      <button
                        onClick={() => handleRemove(p._id)}
                        className="absolute top-2 right-2 rounded-full bg-white/90 p-1 text-rose-600 shadow-sm dark:bg-slate-900/90"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Link
                      href={`/products/${p.slug}`}
                      className="font-bold text-slate-900 dark:text-white hover:underline block text-center line-clamp-2"
                    >
                      {p.name}
                    </Link>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-bold bg-slate-50 dark:bg-slate-800/60">
                  Price
                </td>
                {products.map((p) => (
                  <td
                    key={p._id}
                    className="p-4 font-extrabold text-brand-blue dark:text-cyan-400 text-sm"
                  >
                    ₹{(p.discountPrice || p.price).toLocaleString("en-IN")}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-bold bg-slate-50 dark:bg-slate-800/60">
                  Category
                </td>
                {products.map((p: any) => (
                  <td key={p._id} className="p-4 font-medium">
                    {p.category?.name || "General"}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-bold bg-slate-50 dark:bg-slate-800/60">
                  Availability
                </td>
                {products.map((p) => (
                  <td key={p._id} className="p-4">
                    {p.stock > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        In Stock ({p.stock})
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 font-bold">
                        Sold Out
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-bold bg-slate-50 dark:bg-slate-800/60">
                  Rating
                </td>
                {products.map((p) => (
                  <td
                    key={p._id}
                    className="p-4 flex items-center gap-1 text-amber-500 font-bold"
                  >
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span>{p.rating > 0 ? p.rating.toFixed(1) : "New"}</span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
