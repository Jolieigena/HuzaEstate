"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import RequireAuth from "@/components/shared/RequireAuth";
import NotificationBell from "@/components/shared/NotificationBell";
import { useAuth } from "@/lib/auth-context";
import { roleHome } from "@/lib/navigation";

const NAV_ITEMS = [
  { href: "/supplier", label: "Requests", iconPath: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
  { href: "/supplier/products", label: "Products", iconPath: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { href: "/supplier/orders", label: "Orders", iconPath: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" },
  { href: "/supplier/quotes", label: "My quotes", iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { href: "/supplier/profile", label: "Company profile", iconPath: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
];

/** The furniture supplier portal's own chrome: header, a sidebar on desktop and a tab row on phones. A
 *  supplier is sent to their company profile first, until it has been saved. */
export default function SupplierShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { account, isAuthReady, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const isSupplier = account?.roles.includes("supplier") ?? false;
  const incomplete = account?.profileCompleted === false;

  useEffect(() => {
    if (!isAuthReady || !account) return;
    if (!isSupplier) router.replace(roleHome(account.roles[0] ?? "customer"));
    else if (incomplete && pathname !== "/supplier/profile") router.replace("/supplier/profile");
  }, [account, isAuthReady, isSupplier, incomplete, pathname, router]);

  if (!isSupplier) {
    return (
      <RequireAuth>
        <div className="min-h-[60vh] flex items-center justify-center text-sm font-semibold text-slate-500">Redirecting…</div>
      </RequireAuth>
    );
  }

  const isActive = (href: string) => (href === "/supplier" ? pathname === href : pathname === href || pathname.startsWith(href + "/"));

  return (
    <RequireAuth>
      <div className="min-h-full bg-slate-50">
        <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur-sm sm:px-10">
          <Link href="/" aria-label="Go to HuzaEstate home" className="flex items-center gap-2.5">
            <Logo className="h-8 w-auto" />
            <span className="hidden rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white sm:inline">Supplier</span>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-slate-200 py-1.5 pl-1.5 pr-3 transition-colors hover:border-[#2ec440] focus:outline-none focus:ring-2 focus:ring-[#2ec440]"
                title="Account menu"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{(account?.name ?? "S").slice(0, 1)}</span>
                <span className="hidden text-left sm:block">
                  <span className="block text-xs font-bold text-slate-900">{account?.name ?? "Supplier"}</span>
                  <span className="block text-[11px] text-slate-500">Furniture supplier</span>
                </span>
              </button>
              {menuOpen && (
                <div role="menu" className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-100 bg-white py-2 shadow-xl">
                  <Link href="/" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900">
                    Return to main site
                  </Link>
                  <Link href="/change-password" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900">
                    Change password
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="mt-1 w-full border-t border-slate-50 px-4 py-2 pt-3 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex min-h-[calc(100vh-65px)]">
          <aside className="sticky top-[65px] hidden h-[calc(100vh-65px)] w-64 shrink-0 flex-col border-r border-slate-100 bg-white lg:flex">
            <nav aria-label="Supplier navigation" className="flex grow flex-col gap-1 overflow-y-auto px-2 py-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 font-semibold transition-all ${isActive(item.href) ? "bg-[#2ec440]/10 text-[#2ec440]" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                >
                  <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.iconPath} />
                  </svg>
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>
          <main className="min-w-0 flex-grow">
            <nav aria-label="Supplier navigation" className="flex gap-2 overflow-x-auto border-b border-slate-100 bg-white px-4 py-3 lg:hidden">
              {NAV_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${isActive(item.href) ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>
                  {item.label}
                </Link>
              ))}
            </nav>
            {children}
          </main>
        </div>
      </div>
    </RequireAuth>
  );
}
