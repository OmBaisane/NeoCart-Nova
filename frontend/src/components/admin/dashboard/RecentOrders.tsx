import { ShoppingBag } from "lucide-react";
import type { RecentOrder } from "./types";
import { formatCurrency, statusStyles } from "./utils";

interface RecentOrdersProps {
  orders: RecentOrder[];
}

export default function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/3 p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl bg-blue-500/10 p-2 text-blue-400">
          <ShoppingBag size={19} />
        </div>
        <div>
          <h3 className="font-semibold text-white">Recent Orders</h3>
          <p className="text-sm text-gray-400">Latest customer orders</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">
          No recent orders found.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-162.5 text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-gray-400">
                <th className="pb-3 pr-4 font-medium">Order</th>
                <th className="pb-3 pr-4 font-medium">Customer</th>
                <th className="pb-3 pr-4 font-medium">Date</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 text-right font-medium">Total</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => {
                const statusClass =
                  statusStyles[order.orderStatus] ??
                  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";

                return (
                  <tr
                    key={order._id}
                    className="border-b border-white/5 last:border-0"
                  >
                    <td className="py-4 pr-4">
                      <p className="font-medium text-white">
                        #{order.trackingNumber}
                      </p>
                    </td>

                    <td className="py-4 pr-4">
                      <p className="text-gray-200">
                        {order.user?.name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.user?.email ?? ""}
                      </p>
                    </td>

                    <td className="py-4 pr-4 text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-4 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClass}`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>

                    <td className="py-4 text-right font-medium text-white">
                      {formatCurrency(order.total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
