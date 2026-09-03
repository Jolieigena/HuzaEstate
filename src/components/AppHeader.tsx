"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth-context";
import { useProfessionalProfile } from "@/lib/professional/hooks";

interface AppHeaderProps {
  onOpenMobileSidebar: () => void;
}

/**
 * Slim authenticated app header shown instead of the public marketing Navbar
 * once a user is logged in — no Buy/Rent/Sell/Build/Renovate/Mortgages/Blog
 * links, no Sign Up button. Account navigation (Saved Homes, Build Projects,
 * etc.) lives in the global Sidebar; this header just has the logo, the
 * mobile menu toggle, and the account menu.
 */
export default function AppHeader({ onOpenMobileSidebar }: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { logout, account } = useAuth();
  const professionalProfile = useProfessionalProfile(account?.id);

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
        <Link href="/dashboard" aria-label="Go to your dashboard" className="block">
          <Logo className="h-8 w-auto" />
        </Link>
      </div>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="block relative rounded-full border border-slate-200 hover:ring-2 hover:ring-[#2ec440] hover:border-[#2ec440] transition-all w-10 h-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2ec440]"
          title="Account menu"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <Image src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop" alt="User Profile" fill sizes="40px" className="object-cover rounded-full" />
          </div>
        </button>

        {menuOpen && (
          <div role="menu" className="absolute right-0 mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-xl py-2">
            <div className="px-4 py-2 border-b border-slate-50 mb-1">
              <div className="text-sm font-bold text-slate-900">{account?.name ?? "HuzaEstate account"}</div>
              <div className="text-xs text-slate-500">{account?.email ?? "Prototype account"}</div>
            </div>
            <Link href="/properties" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
              Browse Properties
            </Link>
            <Link href={professionalProfile ? "/professional" : "/professionals/apply"} onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
              {professionalProfile ? "Professional Portal" : "Become a Professional"}
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
    </header>
  );
}
