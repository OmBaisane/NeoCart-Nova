export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs animate-pulse">
      {/* Thumbnail */}
      <div className="aspect-square w-full rounded-xl bg-slate-200" />

      {/* Content */}
      <div className="mt-4 flex flex-1 flex-col justify-between space-y-3">
        <div className="space-y-2">
          <div className="h-3 w-1/3 rounded-full bg-slate-200" />
          <div className="h-4 w-5/6 rounded-full bg-slate-200" />
          <div className="h-4 w-2/3 rounded-full bg-slate-200" />
        </div>

        <div className="pt-2">
          <div className="flex items-baseline gap-2">
            <div className="h-5 w-20 rounded-md bg-slate-200" />
            <div className="h-3.5 w-12 rounded-md bg-slate-100" />
          </div>
          <div className="mt-3 h-8 w-full rounded-xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="w-full divide-y divide-slate-100 animate-pulse">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center justify-between p-4 gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className={`h-4 rounded-md bg-slate-200 ${
                c === 0 ? "w-1/4" : c === cols - 1 ? "w-16" : "w-1/6"
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
