import Link from "next/link";
import { LucideIcon, PackageOpen } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-6 sm:p-12 text-center shadow-2xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
      </div>

      <h3 className="mt-3.5 sm:mt-4 text-sm sm:text-lg font-bold text-slate-900 dark:text-white">
        {title}
      </h3>

      <p className="mt-1 sm:mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        {description}
      </p>

      {actionLabel && (
        <div className="mt-5 sm:mt-6">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center rounded-xl bg-brand-blue px-4 py-2 sm:px-5 sm:py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-600 active:scale-[0.98] dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center rounded-xl bg-brand-blue px-4 py-2 sm:px-5 sm:py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-600 active:scale-[0.98] dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
