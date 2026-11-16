"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { fetchMyProfessionalInquiries } from "@/lib/professional/api";
import { PROFESSIONAL_NAV_ITEMS } from "./professionalNavItems";
import { CUSTOM_LINK_ICON, useMenu } from "@/lib/menus/menus";

export function ProfessionalNavLinks() {
  const pathname = usePathname();
  const { token, isAuthReady } = useAuth();
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (!isAuthReady || !token) return;
    let cancelled = false;
    fetchMyProfessionalInquiries(token).then((list) => {
      if (!cancelled) setUnread(list.filter((i) => !i.read).length);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, pathname]);
  const items = useMenu("professional", PROFESSIONAL_NAV_ITEMS, { custom: (e) => ({ key: e.key, label: e.label, href: e.href ?? "/", iconPath: CUSTOM_LINK_ICON }) });

  return (
    <nav aria-label="Professional navigation" className="flex flex-col gap-1 px-2">
      {items.map((item) => {
        const active = item.href === "/professional" ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
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
            {item.key === "inquiries" && unread > 0 && (
              <span aria-label={`${unread} unread`} className="ml-auto rounded-full bg-[#2ec440] px-2 py-0.5 text-[11px] font-bold text-white">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/** Desktop professional-workspace sidebar — mirrors OrgAdminSidebar.tsx exactly. */
export default function ProfessionalSidebar() {
  return (
    <aside className="hidden lg:flex flex-col shrink-0 border-r border-slate-100 bg-white sticky top-[65px] h-[calc(100vh-65px)] w-64">
      <div className="grow overflow-y-auto py-4">
        <ProfessionalNavLinks />
      </div>
    </aside>
  );
}
