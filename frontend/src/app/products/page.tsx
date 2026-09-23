"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProductCard, ProductItem } from "@/components/ui/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/Skeletons";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Layers,
} from "lucide-react";

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
}

export default function ProductsCatalogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "";
  const initialSort = searchParams.get("sort") || "newest";
  const initialMinPrice = searchParams.get("minPrice") || "";
  const initialMaxPrice = searchParams.get("maxPrice") || "";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [keyword, setKeyword] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState(initialSort);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [page, setPage] = useState(initialPage);

  useEffect(() => {
    setKeyword(searchParams.get("search") || "");
    setSelectedCategory(searchParams.get("category") || "");
    setSortBy(searchParams.get("sort") || "newest");
    setMinPrice(searchParams.get("minPrice") || "");
    setMaxPrice(searchParams.get("maxPrice") || "");
    setPage(parseInt(searchParams.get("page") || "1", 10));
  }, [searchParams]);

  const updateFilters = (overrides: Record<string, string | number | null>) => {
    const current = new URLSearchParams(searchParams.toString());

    const updated = {
      search: keyword,
      category: selectedCategory,
      sort: sortBy,
      minPrice,
      maxPrice,
      page,
      ...overrides,
    };

    Object.entries(updated).forEach(([key, val]) => {
      if (val === null || val === "" || val === undefined) {
        current.delete(key);
      } else {
        current.set(key, String(val));
      }
    });

    router.push(`/products?${current.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: keyword, page: 1 });
  };

  const handleReset = () => {
    setKeyword("");
    setSelectedCategory("");
    setSortBy("newest");
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
    router.push("/products");
  };

  const { data: categoriesData } = useQuery<CategoryItem[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories");
      return res.data?.categories || [];
    },
  });

  const { data: productsData, isLoading } = useQuery({
    queryKey: [
      "products-catalog",
      searchParams.get("search"),
      searchParams.get("category"),
      searchParams.get("sort"),
      searchParams.get("minPrice"),
      searchParams.get("maxPrice"),
      searchParams.get("page"),
    ],
    queryFn: async () => {
      const query = new URLSearchParams(searchParams.toString());
      query.set("limit", "12");
      const res = await api.get(`/products?${query.toString()}`);
      return res.data;
    },
  });

  const products: ProductItem[] = productsData?.products || [];
  const totalPages = productsData?.totalPages || 1;
  const totalProducts = productsData?.totalProducts || 0;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Verified Catalog
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Search authenticated inventory with real-time stock allocation.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex-1 max-w-md"
        >
          <input
            type="text"
            placeholder="Search catalog by title, brand, features..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        </form>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600">
            Sort by:
          </label>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              updateFilters({ sort: e.target.value, page: 1 });
            }}
            className="rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-600"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Customer Rated</option>
          </select>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-4">
        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" />
                Categories
              </span>
              {selectedCategory && (
                <button
                  onClick={() => {
                    setSelectedCategory("");
                    updateFilters({ category: null, page: 1 });
                  }}
                  className="text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="mt-3 space-y-1">
              <button
                onClick={() => {
                  setSelectedCategory("");
                  updateFilters({ category: null, page: 1 });
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  !selectedCategory
                    ? "bg-blue-50 text-blue-600 font-bold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>All Collections</span>
              </button>

              {categoriesData?.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => {
                    setSelectedCategory(cat.slug);
                    updateFilters({ category: cat.slug, page: 1 });
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                    selectedCategory === cat.slug
                      ? "bg-blue-50 text-blue-600 font-bold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <span className="block border-b border-slate-100 pb-3 text-xs font-bold uppercase tracking-wider text-slate-700">
              Price Range (₹)
            </span>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs outline-none focus:border-blue-600"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs outline-none focus:border-blue-600"
              />
            </div>
            <button
              onClick={() => updateFilters({ minPrice, maxPrice, page: 1 })}
              className="mt-3 w-full rounded-lg bg-slate-900 py-2 text-xs font-bold text-white transition hover:bg-blue-600"
            >
              Apply Filter
            </button>
          </div>

          <button
            onClick={handleReset}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
            <span>Reset All Filters</span>
          </button>
        </aside>

        <section className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong>{products.length}</strong> of{" "}
              <strong>{totalProducts}</strong> products
            </span>
          </div>

          {isLoading ? (
            <ProductGridSkeleton count={8} />
          ) : products.length === 0 ? (
            <EmptyState
              title="No products matched your criteria"
              description="Try adjusting your keyword, resetting the category filters, or relaxing price bounds."
              actionLabel="Reset All Filters"
              onAction={handleReset}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {!isLoading && totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => updateFilters({ page: page - 1 })}
                className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Prev</span>
              </button>
              <span className="text-xs font-semibold text-slate-700">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => updateFilters({ page: page + 1 })}
                className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
