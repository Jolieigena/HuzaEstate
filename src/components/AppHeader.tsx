"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth-context";
import { useMyProfilePhoto } from "@/lib/profilePhoto";
import NotificationBell from "@/components/shared/NotificationBell";
import { useDismiss } from "@/lib/useDismiss";
import AccountMenuPanel from "@/components/shared/AccountMenuPanel";

interface AppHeaderProps {
  onOpenMobileSidebar: () => void;
}

/**
 * Slim authenticated app header shown instead of the public marketing Navbar
 * once a user is logged in — no Buy/Rent/Sell/Build/Renovate/Professionals/Blog
 * links, no Sign Up button. Account navigation (Saved Homes, Build Projects,
 * etc.) lives in the global Sidebar; this header just has the logo, the
 * mobile menu toggle, and the account menu.
 */
const ROLE_LABELS: Record<string, string> = {
  administrator: "Administrator",
  professional: "Professional",
  supplier: "Supplier",
  seller_manager: "Owner",
  organization_admin: "Org Admin",
  customer: "Customer",
};

export default function AppHeader({ onOpenMobileSidebar }: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useDismiss(menuOpen, () => setMenuOpen(false));
  const { account, activeRole } = useAuth();
  const photoUrl = useMyProfilePhoto();

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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
        <Link href="/" aria-label="Go to HuzaEstate home" className="block">
          <Logo className="h-8 w-auto" />
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-slate-200 pl-1.5 pr-3 py-1.5 hover:border-[#2ec440] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2ec440]"
          title="Account menu"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-xs font-bold text-white">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              (account?.name ?? "U").slice(0, 1)
            )}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-xs font-bold text-slate-900">{account?.name ?? "Account"}</span>
            <span className="block text-[11px] text-slate-500">{ROLE_LABELS[activeRole] ?? "Account"}</span>
          </span>
        </button>

        {menuOpen && (
          <div role="menu" className="absolute right-0 mt-2 max-h-[80vh] w-60 overflow-y-auto rounded-2xl border border-slate-100 bg-white py-2 shadow-xl">
            <AccountMenuPanel onNavigate={() => setMenuOpen(false)} />
          </div>
        )}
        </div>
      </div>
    </header>
  );
}
