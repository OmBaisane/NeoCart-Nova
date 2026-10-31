import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon: ReactNode;
  iconClassName?: string;
}

export default function MetricCard({
  label,
  value,
  description,
  icon,
  iconClassName = "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-cyan-400",
}: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {label}
        </span>

        <div
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${iconClassName}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
        {value}
      </p>

      {description && (
        <span className="mt-1 block text-[10px] text-slate-400">
          {description}
        </span>
      )}
    </div>
  );
}
