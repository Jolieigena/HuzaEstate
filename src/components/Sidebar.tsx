"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { SIDEBAR_NAV_ITEMS } from "./SidebarNavItems";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function SidebarLinks({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  return (
    <nav aria-label="Account navigation" className="flex flex-col gap-1 px-2">
      {SIDEBAR_NAV_ITEMS.map((item) => {
        const active = item.isActive(pathname, tab);
        return (
          <Link
            key={item.key}
            href={item.href}
            title={collapsed ? item.label : undefined}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl font-semibold transition-all ${collapsed ? "justify-center" : ""} ${
              active ? "bg-[#2ec440]/10 text-[#2ec440]" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.iconPath} />
            </svg>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Persistent, collapsible app sidebar shown on every page once logged in
 * (see AuthenticatedShell). Collapses to a narrow icon rail rather than
 * disappearing entirely, so account navigation is always reachable.
 */
export default function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <aside
      className={`hidden lg:flex flex-col flex-shrink-0 border-r border-slate-100 bg-white sticky top-[65px] h-[calc(100vh-65px)] transition-all duration-200 ${
        collapsed ? "w-[72px]" : "w-64"
      }`}
    >
      <div className="flex-grow overflow-y-auto py-4">
        <Suspense fallback={null}>
          <SidebarLinks collapsed={collapsed} />
        </Suspense>
      </div>

      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={`flex items-center gap-2 px-4 py-3.5 border-t border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <svg className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
        {!collapsed && <span className="text-sm font-semibold">Collapse</span>}
      </button>
    </aside>
  );
}

export { SidebarLinks };
