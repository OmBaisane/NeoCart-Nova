import { ORDER_STATUSES } from "./types";
import { statusStyles } from "./utils";

interface OrderStatusBreakdownProps {
  orderStatus: Record<string, number>;
}

export default function OrderStatusBreakdown({
  orderStatus,
}: OrderStatusBreakdownProps) {
  const totalOrders = Object.values(orderStatus).reduce(
    (sum, count) => sum + count,
    0,
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
        Order Status
      </h3>

      <p className="mt-1 text-[10px] text-slate-400">
        {totalOrders} total orders in selected period
      </p>

      <div className="mt-5 space-y-4">
        {ORDER_STATUSES.map((status) => {
          const count = orderStatus[status] || 0;
          const percentage = totalOrders > 0 ? (count / totalOrders) * 100 : 0;

          return (
            <div key={status}>
              <div className="mb-1.5 flex items-center justify-between">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${statusStyles[status]}`}
                >
                  {status}
                </span>

                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {count}
                </span>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
