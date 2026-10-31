import { AlertTriangle, PackageX } from "lucide-react";

interface InventoryAlertsProps {
  lowStockProducts: number;
  outOfStockProducts: number;
}

export default function InventoryAlerts({
  lowStockProducts,
  outOfStockProducts,
}: InventoryAlertsProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2">
      <div className="flex items-center gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
        <div className="rounded-xl bg-amber-500/10 p-3 text-amber-400">
          <AlertTriangle size={21} />
        </div>
        <div>
          <p className="text-sm text-gray-400">Low Stock Products</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {lowStockProducts}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
        <div className="rounded-xl bg-red-500/10 p-3 text-red-400">
          <PackageX size={21} />
        </div>
        <div>
          <p className="text-sm text-gray-400">Out of Stock Products</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {outOfStockProducts}
          </p>
        </div>
      </div>
    </section>
  );
}
