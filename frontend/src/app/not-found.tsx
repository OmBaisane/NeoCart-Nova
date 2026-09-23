import React from "react";
import Link from "next/link";
import { Compass, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-brand-blue shadow-inner">
        <Compass className="h-8 w-8" />
      </div>

      <span className="mt-4 font-mono text-xs font-bold uppercase tracking-widest text-brand-blue">
        Error 404
      </span>

      <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
        Page Not Found
      </h1>

      <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-500 sm:text-sm">
        The destination you are looking for does not exist or has been relocated
        to another route.
      </p>

      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-6 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-600 active:scale-[0.98]"
        >
          <span>Back to Catalog</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
