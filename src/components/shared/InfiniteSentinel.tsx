"use client";

import { useEffect, useRef } from "react";

/**
 * Put it at the end of a list that grows as you scroll. When it comes near the screen, `onVisible` loads the next batch; while the batch loads
 * the reader sees a quiet "Loading…". When there is nothing more, it takes no room.
 */
export default function InfiniteSentinel({ onVisible, hasMore, loading }: { onVisible: () => void; hasMore: boolean; loading: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!hasMore || !el) return;
    // A new observer notices at once when the end is still on screen, so a short first batch keeps loading until the screen is full.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onVisible();
      },
      { rootMargin: "700px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, onVisible]);

  if (!hasMore && !loading) return null;
  return (
    <div ref={ref} className="py-8 text-center text-sm font-semibold text-slate-400" role="status" aria-live="polite">
      {loading ? "Loading…" : " "}
    </div>
  );
}
