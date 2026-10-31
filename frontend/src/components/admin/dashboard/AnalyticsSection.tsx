import { BarChart3, DollarSign, ShoppingCart, Wallet } from "lucide-react";
import type { AnalyticsData, AnalyticsRange } from "./types";
import MetricCard from "./MetricCard";
import RevenueChart from "./RevenueChart";
import OrderStatusBreakdown from "./OrderStatusBreakdown";
import TopProducts from "./TopProducts";
import CategoryPerformance from "./CategoryPerformance";
import { formatCurrency } from "./utils";

interface AnalyticsSectionProps {
  analytics: AnalyticsData;
  range: AnalyticsRange;
  onRangeChange: (range: AnalyticsRange) => void;
}

const ranges: { label: string; value: AnalyticsRange }[] = [
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "90 Days", value: "90d" },
  { label: "All Time", value: "all" },
];

export default function AnalyticsSection({
  analytics,
  range,
  onRangeChange,
}: AnalyticsSectionProps) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="text-violet-400" size={21} />
            <h2 className="text-xl font-bold text-white">Business Analytics</h2>
          </div>
          <p className="mt-1 text-sm text-gray-400">
            Sales and order performance for the selected period
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {ranges.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onRangeChange(item.value)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                range === item.value
                  ? "bg-violet-500 text-white"
                  : "border border-white/10 bg-white/3 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Period Revenue"
          value={formatCurrency(analytics.summary.totalRevenue)}
          description="Non-cancelled orders"
          icon={<DollarSign size={20} />}
          iconClassName="bg-emerald-500/10 text-emerald-400"
        />

        <MetricCard
          label="Average Order Value"
          value={formatCurrency(analytics.summary.averageOrderValue)}
          description="Per non-cancelled order"
          icon={<ShoppingCart size={20} />}
          iconClassName="bg-blue-500/10 text-blue-400"
        />

        <MetricCard
          label="Paid Revenue"
          value={formatCurrency(analytics.summary.paidRevenue)}
          description={`${analytics.summary.paidOrders} paid orders`}
          icon={<Wallet size={20} />}
          iconClassName="bg-violet-500/10 text-violet-400"
        />

        <MetricCard
          label="Sales Orders"
          value={analytics.summary.totalSalesOrders}
          description="Excludes cancelled orders"
          icon={<ShoppingCart size={20} />}
          iconClassName="bg-amber-500/10 text-amber-400"
        />
      </div>

      <RevenueChart data={analytics.revenueTrend} range={range} />

      <div className="grid gap-5 xl:grid-cols-2">
        <OrderStatusBreakdown orderStatus={analytics.orderStatus} />
        <TopProducts products={analytics.topProducts} />
      </div>

      <CategoryPerformance categories={analytics.categoryPerformance} />
    </section>
  );
}
