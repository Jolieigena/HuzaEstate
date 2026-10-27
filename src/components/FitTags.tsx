"use client";

import { useLayoutEffect, useRef, useState } from "react";

const GAP = 6; // gap-1.5
const PLUS_WIDTH = 38; // room kept for the "+N" tag

const chip = "shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[12px] font-semibold text-slate-600";

/** One line of tags: as many as fit, then "+N" for the ones left out. The tags are measured in an invisible copy, so a tag is never
 *  cut in half, and the count updates when the card changes width. */
export default function FitTags({ tags }: { tags: string[] }) {
  const box = useRef<HTMLDivElement>(null);
  const measure = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(tags.length);
  const key = tags.join("|");

  useLayoutEffect(() => {
    const el = box.current;
    const copy = measure.current;
    if (!el || !copy) return;
    const compute = () => {
      const widths = Array.from(copy.children).map((child) => (child as HTMLElement).offsetWidth);
      const room = el.clientWidth;
      const all = widths.reduce((sum, w, i) => sum + w + (i ? GAP : 0), 0);
      if (all <= room) {
        setVisible(widths.length);
        return;
      }
      let used = 0;
      let count = 0;
      for (let i = 0; i < widths.length; i++) {
        const next = used + (i ? GAP : 0) + widths[i];
        if (next + GAP + PLUS_WIDTH > room) break;
        used = next;
        count = i + 1;
      }
      setVisible(count);
    };
    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <div ref={box} className="relative flex h-5 min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
      {tags.slice(0, visible).map((tag) => (
        <span key={tag} className={chip}>{tag}</span>
      ))}
      {visible < tags.length && <span className={`${chip} text-slate-500`}>+{tags.length - visible}</span>}
      <div ref={measure} aria-hidden="true" className="pointer-events-none invisible absolute left-0 top-0 flex gap-1.5 whitespace-nowrap">
        {tags.map((tag) => (
          <span key={tag} className={chip}>{tag}</span>
        ))}
      </div>
    </div>
  );
}
