import { DollarSign, Package, ShoppingBag, Users } from "lucide-react";
import type { AdminStats } from "./types";
import { formatCurrency } from "./utils";
import MetricCard from "./MetricCard";

interface DashboardStatsProps {
  stats: AdminStats;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Total Revenue"
        value={formatCurrency(stats.totalRevenue)}
        icon={<DollarSign size={20} />}
        iconClassName="bg-emerald-500/10 text-emerald-400"
      />

      <MetricCard
        label="Total Orders"
        value={stats.totalOrders}
        icon={<ShoppingBag size={20} />}
        iconClassName="bg-blue-500/10 text-blue-400"
      />

      <MetricCard
        label="Total Products"
        value={stats.totalProducts}
        icon={<Package size={20} />}
        iconClassName="bg-violet-500/10 text-violet-400"
      />

      <MetricCard
        label="Total Users"
        value={stats.totalUsers}
        icon={<Users size={20} />}
        iconClassName="bg-amber-500/10 text-amber-400"
      />
    </section>
  );
}
