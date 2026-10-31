import { Layers3 } from "lucide-react";
import type { CategoryPerformance as CategoryPerformanceType } from "./types";
import { formatCurrency } from "./utils";

interface CategoryPerformanceProps {
  categories: CategoryPerformanceType[];
}

export default function CategoryPerformance({
  categories,
}: CategoryPerformanceProps) {
  const maxRevenue = Math.max(...categories.map((item) => item.revenue), 0);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/3 p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl bg-violet-500/10 p-2 text-violet-400">
          <Layers3 size={19} />
        </div>
        <div>
          <h3 className="font-semibold text-white">Category Performance</h3>
          <p className="text-sm text-gray-400">
            Sales distribution by category
          </p>
        </div>
      </div>

      {categories.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">
          No category sales available for this period.
        </p>
      ) : (
        <div className="space-y-5">
          {categories.map((category) => (
            <div key={category.categoryId ?? category.categoryName}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {category.categoryName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {category.quantitySold} items sold
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium text-gray-200">
                  {formatCurrency(category.revenue)}
                </p>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all"
                  style={{
                    width: `${
                      maxRevenue > 0 ? (category.revenue / maxRevenue) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
