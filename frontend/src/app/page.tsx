import { Logo } from "@/components/layout/Logo";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-brand-bg">
      <div className="max-w-xl w-full bg-white p-10 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center space-y-6">
        {/* Brand Logo Display */}
        <Logo size="lg" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 text-brand-cyan text-xs font-semibold tracking-wide">
          <span>✦</span> PRODUCTION ARCHITECTURE READY
        </div>

        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Full-stack monorepo verified with TypeScript, Tailwind CSS v4, Express
          REST APIs, and MongoDB persistence.
        </p>

        <div className="w-full pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>STATUS: HEALTHY</span>
          <span>PHASE 1 COMPLETE</span>
        </div>
      </div>
    </main>
  );
}
