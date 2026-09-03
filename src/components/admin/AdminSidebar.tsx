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
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.iconPath} />
            </svg>
            <span className="truncate">{item.label}</span>
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
    <aside className="hidden lg:flex flex-col flex-shrink-0 border-r border-slate-100 bg-white sticky top-[65px] h-[calc(100vh-65px)] w-64">
      <div className="flex-grow overflow-y-auto py-4">
        <AdminNavLinks adminRole={adminRole} />
      </div>
    </aside>
  );
}
