"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, RotateCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected client exceptions
    console.error("Unhandled Application Exception:", error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 shadow-inner dark:bg-rose-950/40 dark:text-rose-400">
        <AlertOctagon className="h-8 w-8" />
      </div>

      <h1 className="mt-6 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
        Something went wrong
      </h1>

      <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-500 sm:text-sm dark:text-slate-400">
        An unexpected application error occurred. We have isolated the fault to
        preserve your session.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 rounded-xl bg-brand-blue px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-600 active:scale-[0.98] dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Try Again</span>
        </button>

        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Home className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          <span>Return Home</span>
        </Link>
      </div>
    </main>
  );
}
