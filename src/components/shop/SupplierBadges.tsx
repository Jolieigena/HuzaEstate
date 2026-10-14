import type { Rating } from "@/lib/furniture/api";

/** The tick shown beside a supplier the platform has checked. */
export function VerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <span title="Verified supplier" className={`inline-flex shrink-0 items-center gap-1 rounded-full bg-[#2ec440]/10 px-2 py-0.5 text-[11px] font-bold text-[#219b31] ${className}`}>
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      Verified
    </span>
  );
}

function Star({ filled, className }: { filled: boolean; className: string }) {
  return (
    <svg className={`${className} ${filled ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

/** Five stars filled to a whole rating, for choosing or showing one review. */
export function StarRow({ value, className = "h-4 w-4" }: { value: number; className?: string }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} filled={n <= Math.round(value)} className={className} />
      ))}
    </span>
  );
}

/** A supplier's average rating with how many reviews it comes from. Nothing until the first review. */
export function RatingSummary({ rating, className = "" }: { rating?: Rating; className?: string }) {
  if (!rating || rating.count === 0) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 ${className}`}>
      <Star filled className="h-4 w-4" />
      {rating.average.toFixed(1)}
      <span className="font-medium text-slate-400">({rating.count})</span>
    </span>
  );
}
