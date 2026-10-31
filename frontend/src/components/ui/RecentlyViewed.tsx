"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProductCard, ProductItem } from "@/components/ui/ProductCard";
import { Clock } from "lucide-react";

const STORAGE_KEY = "neocart_recent_viewed";
const MAX_RECENT_PRODUCTS = 8;

export function RecentlyViewedSection() {
  const [ids, setIds] = useState<string[]>([]);
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
            MAX_RECENT_PRODUCTS,
          );

          setIds(uniqueIds);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueIds));
        }
      }
    } catch (error) {
      console.error("Failed to load recently viewed products:", error);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setStorageLoaded(true);
    }
  }, []);

  const { data: products = [], isLoading } = useQuery<ProductItem[]>({
    queryKey: ["recently-viewed", ids],

    queryFn: async () => {
      const results = await Promise.all(
        ids.map(async (id) => {
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

    enabled: storageLoaded && ids.length > 0,
    retry: 1,
  });

  if (!storageLoaded || isLoading || products.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto mt-12 w-full max-w-7xl px-3 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        <Clock className="h-5 w-5 text-brand-blue dark:text-cyan-400" />

        <h2 className="text-base font-bold text-slate-900 dark:text-white sm:text-xl">
          Recently Viewed Products
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-4">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}
