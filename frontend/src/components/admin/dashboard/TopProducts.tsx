import { Package } from "lucide-react";
import type { TopProduct } from "./types";
import { formatCurrency } from "./utils";

interface TopProductsProps {
  products: TopProduct[];
}

export default function TopProducts({ products }: TopProductsProps) {
  const maxRevenue = Math.max(...products.map((product) => product.revenue), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Top Selling Products
          </h3>

          <p className="mt-1 text-[10px] text-slate-400">
            Ranked by quantity sold
          </p>
        </div>

        <Package className="h-5 w-5 text-purple-500" />
      </div>

      {!products.length ? (
        <p className="py-8 text-center text-xs text-slate-400">
          No product sales found for this period.
        </p>
      ) : (
        <div className="space-y-4">
          {products.map((product, index) => (
            <div
              key={`${product.productId || product.name}-${index}`}
              className="flex items-center gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-extrabold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {index + 1}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                  {product.name}
                </p>

                <p className="mt-0.5 text-[10px] text-slate-400">
                  {product.quantitySold} units sold
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(product.revenue)}
                </p>

                <div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-purple-500"
                    style={{
                      width: `${(product.revenue / maxRevenue) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
