"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "./adminNavItems";

export function AdminNavLinks() {
  const pathname = usePathname();
  const items = ADMIN_NAV_ITEMS;

  return (
    <nav aria-label="Administration navigation" className="flex flex-col gap-1 px-2">
      {items.map((item) => {
        const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl font-semibold transition-all ${active ? "bg-[#2ec440]/10 text-[#2ec440]" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.iconPath} />
            </svg>
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Desktop administration sidebar — same rail as the seller and professional sidebars; only the
 *  menu items differ, and they are filtered by the administrator's role. */
export default function AdminSidebar() {
  return (
    <aside className="hidden lg:flex flex-col shrink-0 border-r border-slate-100 bg-white sticky top-[65px] h-[calc(100vh-65px)] w-64">
      <div className="grow overflow-y-auto py-4">
        <AdminNavLinks />
      </div>
    </aside>
  );
}
