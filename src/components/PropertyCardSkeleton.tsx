/** A property card's shape in grey, shown while listings are still loading so the page does not jump or say "no results". */
export default function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm" aria-hidden="true">
      <div className="h-52 animate-pulse bg-slate-100" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}

/** A grid of placeholders, with the loading state announced once for screen readers. */
export function PropertyGridSkeleton({ count = 6, className }: { count?: number; className: string }) {
  return (
    <div className={className} role="status" aria-label="Loading listings">
      {Array.from({ length: count }, (_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}
