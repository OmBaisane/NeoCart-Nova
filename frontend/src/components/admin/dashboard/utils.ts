import type { AnalyticsRange } from "./types";

export const formatCurrency = (value: number) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

export const formatDateLabel = (value: string, range: AnalyticsRange) => {
  if (range === "all" || range === "90d") {
    const [year, month] = value.split("-");

    return new Date(
      Date.UTC(Number(year), Number(month) - 1, 1),
    ).toLocaleDateString("en-IN", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    });
  }

  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
};

export const statusStyles: Record<string, string> = {
  pending:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  confirmed: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  processing:
    "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400",
  shipped:
    "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400",
  delivered:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  cancelled: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400",
};
