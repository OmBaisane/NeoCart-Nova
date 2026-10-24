"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProductCard, ProductItem } from "@/components/ui/ProductCard";
import { Clock } from "lucide-react";

export function RecentlyViewedSection() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("neocart_recent_viewed");
      if (stored) {
        setIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load recently viewed IDs", e);
    }
  }, []);

  const { data, isLoading } = useQuery<{
    success: boolean;
    products: ProductItem[];
  }>({
    queryKey: ["recently-viewed", ids],
    queryFn: async () => {
      if (ids.length === 0) return { success: true, products: [] };
      const promises = ids.map((id) =>
        api.get(`/products/${id}`).catch(() => null),
      );
      const results = await Promise.all(promises);
      const products = results.map((r) => r?.data?.product).filter(Boolean);
      return { success: true, products };
    },
    enabled: ids.length > 0,
  });

  const products = data?.products || [];

  if (isLoading || products.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 w-full mt-12">
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800 mb-6">
        <Clock className="h-5 w-5 text-brand-blue dark:text-cyan-400" />
        <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white">
          Recently Viewed Products
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 sm:gap-6">
        {products.slice(0, 4).map((prod) => (
          <ProductCard key={prod._id} product={prod} />
        ))}
      </div>
    </section>
  );
}
