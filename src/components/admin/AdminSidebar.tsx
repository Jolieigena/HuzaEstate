"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasPermission } from "@/lib/admin/permissions";
import type { AdminRole } from "@/lib/admin/types";
import { ADMIN_NAV_ITEMS } from "./adminNavItems";

export function AdminNavLinks({ adminRole }: { adminRole: AdminRole }) {
  const pathname = usePathname();
  const items = ADMIN_NAV_ITEMS.filter((item) => !item.permission || hasPermission(adminRole, item.permission));

  return (
    <nav aria-label="Administration navigation" className="flex flex-col gap-1 px-3">
      {items.map((item) => {
        const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              active 
                ? "bg-[#2ec440] text-slate-900 shadow-sm" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <svg 
              className={`w-5 h-5 flex-shrink-0 transition-colors ${active ? "text-slate-900" : "text-slate-500 group-hover:text-slate-300"}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.iconPath} />
            </svg>
            <span className="truncate tracking-wide">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Desktop administration sidebar. Deliberately not collapsible (unlike the
 * customer Sidebar) — the admin nav list is longer and permission-filtered
 * per role, so a fixed-width rail keeps every visible label legible. */
export default function AdminSidebar({ adminRole }: { adminRole: AdminRole }) {
  return (
    <aside className="hidden lg:flex flex-col flex-shrink-0 border-r border-slate-800 bg-slate-950 sticky top-[65px] h-[calc(100vh-65px)] w-64 shadow-xl z-10">
      <div className="flex-grow overflow-y-auto py-6 custom-scrollbar">
        <p className="px-6 mb-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Platform Management</p>
        <AdminNavLinks adminRole={adminRole} />
      </div>
    </aside>
  );
}
