"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProductCard, ProductItem } from "@/components/ui/ProductCard";
import {
  Filter,
  Search,
  SlidersHorizontal,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  PackageOpen,
} from "lucide-react";

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
}

interface ProductResponse {
  success: boolean;
  count: number;
  totalProducts: number;
  totalPages: number;
  currentPage: number;
  products: ProductItem[];
}

function ProductCatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state extractions
  const categoryParam = searchParams.get("category") || "";
  const searchParam = searchParams.get("search") || "";
  const sortParam = searchParams.get("sort") || "newest";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";

  // Local filter states
  const [searchInput, setSearchInput] = useState(searchParam);
  const [minPrice, setMinPrice] = useState(minPriceParam);
  const [maxPrice, setMaxPrice] = useState(maxPriceParam);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  // 1. Fetch Categories for Filter Sidebar
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories");
      return res.data?.categories as CategoryItem[];
    },
  });

  // 2. Fetch Filtered Products
  const { data, isLoading, isPlaceholderData } = useQuery<ProductResponse>({
    queryKey: [
      "products",
      {
        category: categoryParam,
        search: searchParam,
        sort: sortParam,
        page: pageParam,
        minPrice: minPriceParam,
        maxPrice: maxPriceParam,
      },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categoryParam) params.append("category", categoryParam);
      if (searchParam) params.append("search", searchParam);
      if (sortParam) params.append("sort", sortParam);
      if (pageParam) params.append("page", pageParam.toString());
      if (minPriceParam) params.append("minPrice", minPriceParam);
      if (maxPriceParam) params.append("maxPrice", maxPriceParam);
      params.append("limit", "12");

      const res = await api.get(`/products?${params.toString()}`);
      return res.data;
    },
    placeholderData: (prev) => prev,
  });

  // URL Query Param Updater
  const updateQuery = (updates: Record<string, string | null>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === "") {
        current.delete(key);
      } else {
        current.set(key, val);
      }
    });

    // Reset page to 1 whenever filters or search change
    if (!updates.page && updates.page !== undefined) {
      current.set("page", "1");
    }

    router.push(`/products?${current.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery({ search: searchInput.trim() || null, page: "1" });
  };

  const handlePriceApply = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery({
      minPrice: minPrice.trim() || null,
      maxPrice: maxPrice.trim() || null,
      page: "1",
    });
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setMinPrice("");
    setMaxPrice("");
    router.push("/products");
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-charcoal sm:text-3xl">
            Product Catalog
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {data?.totalProducts !== undefined
              ? `Showing ${data.products.length} of ${data.totalProducts} verified products`
              : "Discover certified gear and essentials"}
          </p>
        </div>

        {/* Sort and Mobile Filter Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs md:hidden"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Sort By:
            </span>
            <select
              value={sortParam}
              onChange={(e) => updateQuery({ sort: e.target.value, page: "1" })}
              aria-label="Sort products"
              className="rounded-lg border border-slate-300 bg-white py-1.5 pl-3 pr-8 text-xs font-medium text-brand-charcoal outline-none focus:border-brand-blue"
            >
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-4">
        {/* Sidebar Filters */}
        <aside
          className={`${
            isMobileFilterOpen ? "block" : "hidden"
          } md:block space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs h-fit sticky top-20`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-brand-charcoal">
              <SlidersHorizontal className="h-4 w-4 text-brand-blue" />
              <span>Filters</span>
            </div>
            {(categoryParam ||
              searchParam ||
              minPriceParam ||
              maxPriceParam) && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Search Box inside Sidebar */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Keyword
            </label>
            <form onSubmit={handleSearchSubmit} className="mt-2 relative">
              <input
                type="text"
                placeholder="Title or description..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-brand-blue"
              />
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            </form>
          </div>

          {/* Categories Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Category
            </label>
            <div className="space-y-1">
              <button
                onClick={() => updateQuery({ category: null, page: "1" })}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition ${
                  !categoryParam
                    ? "bg-blue-50 font-bold text-brand-blue"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                All Categories
              </button>
              {categories?.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => updateQuery({ category: cat.slug, page: "1" })}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition ${
                    categoryParam === cat.slug
                      ? "bg-blue-50 font-bold text-brand-blue"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Price Range (₹)
            </label>
            <form onSubmit={handlePriceApply} className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-brand-blue"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-brand-blue"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-slate-900 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-blue"
              >
                Apply Range
              </button>
            </form>
          </div>
        </aside>

        {/* Product Results Grid */}
        <section className="md:col-span-3">
          {isLoading && !isPlaceholderData ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
              <span className="mt-3 text-xs text-slate-500">
                Fetching catalog items...
              </span>
            </div>
          ) : data && data.products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination Bar */}
              {data.totalPages > 1 && (
                <nav
                  aria-label="Pagination Navigation"
                  className="mt-12 flex items-center justify-center gap-2 border-t border-slate-200 pt-6"
                >
                  <button
                    disabled={data.currentPage <= 1}
                    onClick={() =>
                      updateQuery({ page: (data.currentPage - 1).toString() })
                    }
                    className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-1 px-3 text-xs font-semibold text-slate-600">
                    Page {data.currentPage} of {data.totalPages}
                  </div>

                  <button
                    disabled={data.currentPage >= data.totalPages}
                    onClick={() =>
                      updateQuery({ page: (data.currentPage + 1).toString() })
                    }
                    className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </nav>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-16 text-center">
              <PackageOpen className="h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-base font-bold text-brand-charcoal">
                No products match your criteria
              </h3>
              <p className="mt-1 max-w-sm text-xs text-slate-500">
                Try clearing selected filters, price constraints, or search
                keywords to view available stock.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-6 rounded-lg bg-brand-blue px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-600"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function ProductCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        </div>
      }
    >
      <ProductCatalogContent />
    </Suspense>
  );
}
