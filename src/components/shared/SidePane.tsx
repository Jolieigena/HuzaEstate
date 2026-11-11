"use client";

import { ReactNode, useEffect, useId } from "react";

/**
 * A pane docked on the right, not a dialog: the design stays in view and can be scrolled and looked at while the person works in the
 * pane. On a phone it is a sheet at the bottom. While it is open the page makes room for it (see globals.css) instead of being covered.
 */
export default function SidePane({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    document.documentElement.dataset.sidePanel = "open";
    return () => {
      delete document.documentElement.dataset.sidePanel;
    };
  }, [open]);

  if (!open) return null;

  return (
    <aside
      role="complementary"
      aria-labelledby={titleId}
      className="fixed inset-x-0 bottom-0 z-40 flex max-h-[75vh] flex-col rounded-t-2xl border border-slate-200 bg-white shadow-2xl lg:inset-x-auto lg:bottom-0 lg:right-0 lg:top-20 lg:max-h-none lg:w-[380px] lg:rounded-none lg:border-y-0 lg:border-r-0 lg:shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 id={titleId} className="text-lg font-black text-slate-900">
          {title}
        </h2>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
    </aside>
  );
}
