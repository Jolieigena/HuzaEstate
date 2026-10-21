"use client";

import { useState } from "react";
import Link from "next/link";

export interface BottomNavItem {
  key: string;
  label: string;
  /** One path of a 24x24 outline icon, drawn with a 2px stroke. */
  iconPath: string;
  active?: boolean;
  badge?: number;
  /** A page to open (client-side navigation), or onSelect for switching something on the current page. */
  href?: string;
  onSelect?: () => void;
  /** The centre action of the bar (such as "Post"): drawn as a filled button instead of a tab. */
  primary?: boolean;
}

const MORE_ICON = "M5 12h.01M12 12h.01M19 12h.01";

function Icon({ path, strong }: { path: string; strong?: boolean }) {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strong ? 3 : 2} d={path} />
    </svg>
  );
}

function Tab({ item, onDone }: { item: BottomNavItem; onDone?: () => void }) {
  const body = item.primary ? (
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg">
      <Icon path={item.iconPath} />
    </span>
  ) : (
    <>
      <span className="relative">
        <Icon path={item.iconPath} />
        {item.badge ? (
          <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">{item.badge > 99 ? "99+" : item.badge}</span>
        ) : null}
      </span>
      <span className="text-[11px] font-semibold leading-none">{item.label}</span>
    </>
  );
  const className = `flex h-full w-full flex-col items-center justify-center gap-1 ${item.primary ? "" : item.active ? "text-[#2ec440]" : "text-slate-500"}`;
  return item.href ? (
    <Link href={item.href} aria-label={item.label} aria-current={item.active ? "page" : undefined} className={className} onClick={onDone}>
      {body}
    </Link>
  ) : (
    <button
      type="button"
      aria-label={item.label}
      aria-current={item.active ? "page" : undefined}
      className={className}
      onClick={() => {
        item.onSelect?.();
        onDone?.();
      }}
    >
      {body}
    </button>
  );
}

/** The bottom navigation bar of the mobile app: up to five places that are always one tap away, with an optional "More" tab that
 *  opens the rest in a sheet. It is fixed to the bottom of the screen; the page it sits on needs room for it (see BOTTOM_NAV_SPACE). */
export default function BottomNav({ label, items, more = [] }: { label: string; items: BottomNavItem[]; more?: BottomNavItem[] }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = more.some((item) => item.active);
  const slots = items.length + (more.length ? 1 : 0);

  return (
    <>
      <nav aria-label={label} className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-sm">
        <ul className="grid h-16" style={{ gridTemplateColumns: `repeat(${slots}, minmax(0, 1fr))` }}>
          {items.map((item) => (
            <li key={item.key} className="h-full">
              <Tab item={item} />
            </li>
          ))}
          {more.length > 0 && (
            <li className="h-full">
              <Tab item={{ key: "more", label: "More", iconPath: MORE_ICON, active: moreActive || moreOpen, onSelect: () => setMoreOpen(true) }} />
            </li>
          )}
        </ul>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/50" aria-hidden="true" onClick={() => setMoreOpen(false)} />
          <div role="dialog" aria-modal="true" aria-label="More" className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white px-4 pb-6 pt-3 shadow-2xl">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200" aria-hidden="true" />
            <ul className="flex flex-col">
              {more.map((item) => {
                const row = `flex w-full items-center gap-4 rounded-2xl px-3 py-3.5 text-left text-base font-semibold ${item.active ? "bg-[#2ec440]/10 text-[#2ec440]" : "text-slate-800"}`;
                const content = (
                  <>
                    <Icon path={item.iconPath} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{item.badge}</span> : null}
                  </>
                );
                return (
                  <li key={item.key}>
                    {item.href ? (
                      <Link href={item.href} className={row} onClick={() => setMoreOpen(false)}>
                        {content}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className={row}
                        onClick={() => {
                          item.onSelect?.();
                          setMoreOpen(false);
                        }}
                      >
                        {content}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

/** Bottom padding that keeps a page's last content clear of the bar (the bar is 4rem tall). */
export const BOTTOM_NAV_SPACE = "pb-20";
