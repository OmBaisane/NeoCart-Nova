"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProductCard, ProductItem } from "@/components/ui/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/Skeletons";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  Layers,
  Check,
} from "lucide-react";

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
}

interface FacetsResponse {
  success: boolean;
  categoryCounts: Array<{ _id: string; count: number }>;
  stats: {
    minPrice: number;
    maxPrice: number;
    totalInStock: number;
  };
}

interface ProductsResponse {
  success: boolean;
  count: number;
  totalProducts: number;
  totalPages: number;
  currentPage: number;
  products: ProductItem[];
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") || "all";
  const currentSearch = searchParams.get("search") || "";
  const currentSort = searchParams.get("sort") || "newest";
  const currentInStock = searchParams.get("inStock") === "true";
  const currentPage = Math.max(
    1,
    parseInt(searchParams.get("page") || "1", 10) || 1,
  );

  const currentMinPrice = searchParams.get("minPrice") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [draftMinPrice, setDraftMinPrice] = useState(currentMinPrice);
  const [draftMaxPrice, setDraftMaxPrice] = useState(currentMaxPrice);

  useEffect(() => {
    setDraftMinPrice(currentMinPrice);
    setDraftMaxPrice(currentMaxPrice);
  }, [currentMinPrice, currentMaxPrice]);

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    if (!("page" in updates)) {
      params.delete("page");
    }

    const query = params.toString();
    router.push(query ? `/products?${query}` : "/products");
  };

  const draftMin =
    draftMinPrice.trim() === "" ? undefined : Number(draftMinPrice);
  const draftMax =
    draftMaxPrice.trim() === "" ? undefined : Number(draftMaxPrice);

  const invalidDraftPrice =
    (draftMin !== undefined && (!Number.isFinite(draftMin) || draftMin < 0)) ||
    (draftMax !== undefined && (!Number.isFinite(draftMax) || draftMax < 0)) ||
    (draftMin !== undefined && draftMax !== undefined && draftMin > draftMax);

  const hasDraftPriceFilter =
    draftMinPrice.trim() !== "" || draftMaxPrice.trim() !== "";

  const hasActivePriceFilter = currentMinPrice !== "" || currentMaxPrice !== "";

  const applyPriceFilter = () => {
    if (invalidDraftPrice) return;

    updateFilters({
      minPrice: draftMinPrice.trim() || null,
      maxPrice: draftMaxPrice.trim() || null,
    });
  };

  const clearPriceFilter = () => {
    setDraftMinPrice("");
    setDraftMaxPrice("");
    updateFilters({
      minPrice: null,
      maxPrice: null,
    });
  };

  // 1. Fetch Categories
  const { data: categoriesData } = useQuery<{
    success: boolean;
    categories: CategoryItem[];
  }>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories");
      return res.data;
    },
  });

  // 2. Fetch Dynamic Catalog Facets
  const { data: facetsData } = useQuery<FacetsResponse>({
    queryKey: ["catalog-facets"],
    queryFn: async () => {
      const res = await api.get("/products/facets");
      return res.data;
    },
    staleTime: 1000 * 60 * 2,
  });

  const categoryCountMap = useMemo(() => {
    const map = new Map<string, number>();

    facetsData?.categoryCounts?.forEach((item) => {
      map.set(item._id, item.count);
    });

    return map;
  }, [facetsData]);

  // 3. Fetch Filtered Products Catalog
  const { data, isLoading } = useQuery<ProductsResponse>({
    queryKey: [
      "products",
      currentPage,
      currentCategory,
      currentSearch,
      currentSort,
      currentInStock,
      currentMinPrice,
      currentMaxPrice,
    ],
    queryFn: async () => {
      const res = await api.get("/products", {
        params: {
          page: currentPage,
          limit: 12,
          category: currentCategory !== "all" ? currentCategory : undefined,
          search: currentSearch || undefined,
          sort: currentSort,
          inStock: currentInStock ? "true" : undefined,
          minPrice: currentMinPrice || undefined,
          maxPrice: currentMaxPrice || undefined,
        },
      });

      return res.data;
    },
  });

  const products = data?.products || [];
  const totalPages = data?.totalPages || 1;
  const totalProducts = data?.totalProducts || 0;
  const categories = categoriesData?.categories || [];

  const priceFilterContent = (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Price Range
        </span>

        {hasActivePriceFilter && (
          <button
            type="button"
            onClick={clearPriceFilter}
            className="text-[10px] font-semibold text-blue-600 hover:underline dark:text-cyan-400"
          >
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            Minimum (₹)
          </span>
          <input
            type="number"
            min="0"
            step="1"
            value={draftMinPrice}
            onChange={(e) => setDraftMinPrice(e.target.value)}
            placeholder={
              facetsData
                ? Math.floor(facetsData.stats.minPrice).toString()
                : "Min"
            }
            className="w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-cyan-500"
          />
        </label>

        <label className="space-y-1">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            Maximum (₹)
          </span>
          <input
            type="number"
            min="0"
            step="1"
            value={draftMaxPrice}
            onChange={(e) => setDraftMaxPrice(e.target.value)}
            placeholder={
              facetsData
                ? Math.ceil(facetsData.stats.maxPrice).toString()
                : "Max"
            }
            className="w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-cyan-500"
          />
        </label>
      </div>

      {invalidDraftPrice && (
        <p className="text-[10px] font-medium text-rose-500">
          Enter valid non-negative prices. Minimum cannot exceed maximum.
        </p>
      )}

      <button
        type="button"
        disabled={invalidDraftPrice || !hasDraftPriceFilter}
        onClick={applyPriceFilter}
        className="w-full rounded-lg bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-blue-600 dark:hover:bg-cyan-600"
      >
        Apply Price Filter
      </button>

      {facetsData && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500">
          Available catalog prices: ₹
          {facetsData.stats.minPrice.toLocaleString("en-IN")} – ₹
          {facetsData.stats.maxPrice.toLocaleString("en-IN")}
        </p>
      )}
    </div>
  );

  return (
    <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Header Bar */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Product Catalog
          </h1>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {currentSearch ? (
              <span>
                Search results for &quot;
                <span className="font-bold text-slate-800 dark:text-white">
                  {currentSearch}
                </span>
                &quot; ({totalProducts} found)
              </span>
            ) : (
              <span>Explore verified gear with real-time stock sync.</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 md:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
          </button>

          <select
            value={currentSort}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="newest" className="dark:bg-slate-900">
              Newest Arrivals
            </option>
            <option value="price-asc" className="dark:bg-slate-900">
              Price: Low to High
            </option>
            <option value="price-desc" className="dark:bg-slate-900">
              Price: High to Low
            </option>
            <option value="name-asc" className="dark:bg-slate-900">
              Alphabetical (A-Z)
            </option>
          </select>
        </div>
      </div>

      {/* Main Catalog Layout */}
      <div className="mt-6 grid grid-cols-1 gap-8 sm:mt-8 md:grid-cols-4">
        {/* Desktop Sidebar */}
        <aside className="hidden space-y-6 md:block">
          {currentSearch && (
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="truncate text-slate-600 dark:text-slate-300">
                Search: <strong>{currentSearch}</strong>
              </span>
              <button
                type="button"
                onClick={() => updateFilters({ search: null })}
                className="rounded-md p-1 hover:bg-slate-200 dark:hover:bg-slate-800"
                aria-label="Clear Search"
              >
                <X className="h-3.5 w-3.5 text-slate-500" />
              </button>
            </div>
          )}

          {/* In Stock Toggle */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <label className="flex cursor-pointer items-center justify-between">
              <div>
                <span className="block text-xs font-bold text-slate-900 dark:text-white">
                  In Stock Only
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  Hide sold out items
                </span>
              </div>
              <input
                type="checkbox"
                checked={currentInStock}
                onChange={(e) =>
                  updateFilters({ inStock: e.target.checked ? "true" : null })
                }
                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
          </div>

          {priceFilterContent}

          {/* Categories */}
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Layers className="h-3.5 w-3.5" />
                <span>Categories</span>
              </span>

              {currentCategory !== "all" && (
                <button
                  type="button"
                  onClick={() => updateFilters({ category: "all" })}
                  className="text-[10px] font-semibold text-blue-600 hover:underline dark:text-cyan-400"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => updateFilters({ category: "all" })}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  currentCategory === "all"
                    ? "bg-slate-900 text-white shadow-xs dark:bg-blue-600"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <span>All Categories</span>
                <span className="text-[10px] opacity-75">{totalProducts}</span>
              </button>

              {categories.map((cat) => {
                const count = categoryCountMap.get(cat._id) || 0;
                const isSelected = currentCategory === cat.slug;

                return (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => updateFilters({ category: cat.slug })}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      isSelected
                        ? "bg-slate-900 text-white shadow-xs dark:bg-blue-600"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span className="text-[10px] opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Mobile Filter Drawer */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setMobileFilterOpen(false)}
            />

            <div className="relative ml-auto flex w-full max-w-xs flex-col justify-between overflow-y-auto bg-white p-5 shadow-2xl dark:bg-slate-900">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Catalog Filters
                  </h3>
                  <button
                    type="button"
                    onClick={() => setMobileFilterOpen(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Close filters"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile In Stock */}
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                    In Stock Only
                  </span>
                  <input
                    type="checkbox"
                    checked={currentInStock}
                    onChange={(e) =>
                      updateFilters({
                        inStock: e.target.checked ? "true" : null,
                      })
                    }
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
                  />
                </label>

                {priceFilterContent}

                {/* Mobile Categories */}
                <div className="space-y-1">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Categories
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      updateFilters({ category: "all" });
                      setMobileFilterOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold ${
                      currentCategory === "all"
                        ? "bg-slate-900 text-white dark:bg-blue-600"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <span>All</span>
                    {currentCategory === "all" && (
                      <Check className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => {
                        updateFilters({ category: cat.slug });
                        setMobileFilterOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold ${
                        currentCategory === cat.slug
                          ? "bg-slate-900 text-white dark:bg-blue-600"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <span>{cat.name}</span>
                      {currentCategory === cat.slug && (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-500"
              >
                Close Filters
              </button>
            </div>
          </div>
        )}

        {/* Product Grid & Pagination */}
        <div className="space-y-6 md:col-span-3">
          {isLoading ? (
            <ProductGridSkeleton count={8} />
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-2xs sm:p-12 dark:border-slate-800 dark:bg-slate-900">
              <EmptyState
                title="No matching products found"
                description="Try clearing your filters or search keywords to browse our full catalog."
                actionLabel="Reset All Filters"
                onAction={() => {
                  setDraftMinPrice("");
                  setDraftMaxPrice("");
                  router.push("/products");
                }}
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 pt-6 dark:border-slate-800">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Page {currentPage} of {totalPages} ({totalProducts} items)
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() =>
                        updateFilters({
                          page: Math.max(1, currentPage - 1).toString(),
                        })
                      }
                      className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      <span>Prev</span>
                    </button>

                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() =>
                        updateFilters({
                          page: Math.min(
                            totalPages,
                            currentPage + 1,
                          ).toString(),
                        })
                      }
                      className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <span>Next</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
          <ProductGridSkeleton count={8} />
        </main>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
