export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-brand-bg">
      <div className="max-w-2xl text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-indigo text-brand-cyan text-sm font-medium">
          <span>✦</span> NeoCart Nova Engine v1.0
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-charcoal tracking-tight">
          Next-Gen Commerce Experience
        </h1>
        <p className="text-slate-600 text-lg">
          Decoupled Next.js architecture with Express REST APIs, Mongoose
          persistence, and strict HttpOnly cookie sessions.
        </p>
      </div>
    </main>
  );
}
