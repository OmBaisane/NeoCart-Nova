"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProductItem } from "@/components/ui/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Scale, Trash2, Loader2, Star, ArrowRight, X } from "lucide-react";

const STORAGE_KEY = "neocart_compare";
const MAX_COMPARE_PRODUCTS = 4;

export default function ComparePage() {
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [storageLoaded, setStorageLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed: unknown = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          const validIds = parsed.filter(
            (id): id is string => typeof id === "string" && id.length > 0,
          );

          const uniqueIds = [...new Set(validIds)].slice(
            0,
            MAX_COMPARE_PRODUCTS,
          );

          setCompareIds(uniqueIds);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueIds));
        }
      }
    } catch (error) {
      console.error("Failed to load comparison list:", error);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setStorageLoaded(true);
    }
  }, []);

  const { data: products = [], isLoading } = useQuery<ProductItem[]>({
    queryKey: ["compare-products", compareIds],

    queryFn: async () => {
      const results = await Promise.all(
        compareIds.map(async (id) => {
          try {
            const response = await api.get(`/products/by-id/${id}`);
            return response.data?.product as ProductItem | undefined;
          } catch {
            return undefined;
          }
        }),
      );

      return results.filter((product): product is ProductItem =>
        Boolean(product?._id),
      );
    },

    enabled: storageLoaded && compareIds.length > 0,
    retry: 1,
  });

  const handleRemove = (id: string) => {
    const updated = compareIds.filter((item) => item !== id);

    setCompareIds(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleClear = () => {
    setCompareIds([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const formatPrice = (price: number) => `₹${price.toLocaleString("en-IN")}`;

  const getEffectivePrice = (product: ProductItem) =>
    product.discountPrice !== undefined &&
    product.discountPrice > 0 &&
    product.discountPrice < product.price
      ? product.discountPrice
      : product.price;

  if (!storageLoaded || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue dark:text-cyan-400" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Product Comparison ({products.length}/{MAX_COMPARE_PRODUCTS})
          </h1>

          <p className="mt-1 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
            Compare product specifications side-by-side and find the right
            choice.
          </p>
        </div>

        {products.length > 0 && (
          <button
            onClick={handleClear}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 sm:self-auto dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
          >
            <Trash2 className="h-4 w-4" />
            Clear Comparison
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={Scale}
            title="No products selected for comparison"
            description="Add products to your comparison list from product pages. You can compare up to 4 products."
            actionLabel="Browse Catalog"
            actionHref="/products"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {products.length < MAX_COMPARE_PRODUCTS && (
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue hover:underline dark:text-cyan-400"
            >
              Add another product
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full min-w-160 text-left text-xs text-slate-700 dark:text-slate-300">
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <th className="w-36 bg-slate-50 p-4 font-bold dark:bg-slate-800/60">
                    Product
                  </th>

                  {products.map((product) => (
                    <td key={product._id} className="min-w-48 p-4 align-top">
                      <div className="relative mx-auto mb-3 aspect-square w-32 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-400">
                            No image
                          </div>
                        )}

                        <button
                          onClick={() => handleRemove(product._id)}
                          aria-label={`Remove ${product.name} from comparison`}
                          className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-rose-600 shadow-sm transition hover:bg-rose-50 dark:bg-slate-900/90"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <Link
                        href={`/products/${product.slug}`}
                        className="block text-center font-bold text-slate-900 hover:underline dark:text-white"
                      >
                        {product.name}
                      </Link>

                      <Link
                        href={`/products/${product.slug}`}
                        className="mt-2 flex items-center justify-center gap-1 text-xs font-semibold text-brand-blue hover:underline dark:text-cyan-400"
                      >
                        View Product
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  ))}
                </tr>

                <tr>
                  <th className="bg-slate-50 p-4 font-bold dark:bg-slate-800/60">
                    Price
                  </th>

                  {products.map((product) => {
                    const effectivePrice = getEffectivePrice(product);
                    const hasDiscount = effectivePrice < product.price;

                    return (
                      <td key={product._id} className="p-4">
                        <div className="text-sm font-extrabold text-brand-blue dark:text-cyan-400">
                          {formatPrice(effectivePrice)}
                        </div>

                        {hasDiscount && (
                          <div className="mt-1 text-xs text-slate-500">
                            <span className="line-through">
                              {formatPrice(product.price)}
                            </span>
                            <span className="ml-2 font-semibold text-emerald-600 dark:text-emerald-400">
                              {Math.round(
                                ((product.price - effectivePrice) /
                                  product.price) *
                                  100,
                              )}
                              % OFF
                            </span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <th className="bg-slate-50 p-4 font-bold dark:bg-slate-800/60">
                    Category
                  </th>

                  {products.map((product) => (
                    <td key={product._id} className="p-4 font-medium">
                      {product.category?.name || "General"}
                    </td>
                  ))}
                </tr>

                <tr>
                  <th className="bg-slate-50 p-4 font-bold dark:bg-slate-800/60">
                    Rating
                  </th>

                  {products.map((product) => (
                    <td key={product._id} className="p-4">
                      <div className="flex items-center gap-1 font-bold text-amber-500">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span>
                          {product.rating > 0
                            ? product.rating.toFixed(1)
                            : "New"}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {product.reviewCount} reviews
                      </p>
                    </td>
                  ))}
                </tr>

                <tr>
                  <th className="bg-slate-50 p-4 font-bold dark:bg-slate-800/60">
                    Availability
                  </th>

                  {products.map((product) => (
                    <td key={product._id} className="p-4">
                      {product.stock > 0 ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          In Stock ({product.stock})
                        </span>
                      ) : (
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          Sold Out
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                <tr>
                  <th className="bg-slate-50 p-4 font-bold dark:bg-slate-800/60">
                    Description
                  </th>

                  {products.map((product) => (
                    <td
                      key={product._id}
                      className="max-w-xs p-4 leading-relaxed"
                    >
                      <p className="line-clamp-5">
                        {product.description || "No description available"}
                      </p>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
