"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth-context";
import { AdminApi } from "@/lib/admin/api";
import NotificationBell from "@/components/shared/NotificationBell";

interface OrgAdminHeaderProps {
  onOpenMobileSidebar: () => void;
}

/** Self-contained header for the Organisation Admin Portal — mirrors AdminHeader.tsx, badged
 *  "Org Admin" instead of "Admin" so it's visually distinct from the platform admin portal.
 *  Also names the actual organisation (fetched once, not per-page) — nothing here told the
 *  signed-in admin *which* organisation they were managing otherwise. */
export default function OrgAdminHeader({ onOpenMobileSidebar }: OrgAdminHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { logout, account, token } = useAuth();
  const [orgName, setOrgName] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !account?.organizationId) return;
    let cancelled = false;
    AdminApi.getOrganization(token, account.organizationId).then((result) => {
      if (!cancelled && result.ok) setOrgName(result.data.name);
    });
    return () => {
      cancelled = true;
    };
  }, [token, account?.organizationId]);

  return (
    <header className="w-full bg-white border-b border-slate-100 py-4 px-6 sm:px-10 flex items-center justify-between sticky top-0 z-40 bg-white/95 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open menu"
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link href="/" aria-label="Go to HuzaEstate home" className="flex items-center gap-2.5">
          <Logo className="h-8 w-auto" />
          <span className="hidden sm:inline rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">Org Admin</span>
        </Link>
        {orgName && (
          <span className="hidden md:inline-flex items-center rounded-full border border-[#2ec440]/25 bg-[#2ec440]/10 px-3 py-1 text-xs font-bold text-[#219b31]">
            {orgName}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-slate-200 pl-1.5 pr-3 py-1.5 hover:border-[#2ec440] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2ec440]"
            title="Account menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{(account?.name ?? "O").slice(0, 1)}</span>
            <span className="hidden text-left sm:block">
              <span className="block text-xs font-bold text-slate-900">{account?.name ?? "Staff"}</span>
              <span className="block text-[11px] text-slate-500">{orgName ?? "Organisation Admin"}</span>
            </span>
          </button>

          {menuOpen && (
            <div role="menu" className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2">
              <div className="px-4 py-2 border-b border-slate-50 mb-1">
                <div className="text-sm font-bold text-slate-900">{account?.name ?? "HuzaEstate staff"}</div>
                <div className="text-xs text-slate-500">{orgName ? `Organisation Admin · ${orgName}` : "Organisation Admin"}</div>
              </div>
              <Link href="/" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                Return to main site
              </Link>
              <Link href="/change-password" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                Change password
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-semibold transition-colors mt-1 border-t border-slate-50 pt-3"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
