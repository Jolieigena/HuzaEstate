"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth-context";
import { useAdminNotifications } from "@/lib/admin/hooks";
import { ADMIN_ROLE_LABELS } from "@/lib/admin/permissions";
import { AdminService } from "@/lib/admin/service";
import type { AdminRole } from "@/lib/admin/types";
import { formatDate } from "./ui";

interface AdminHeaderProps {
  adminRole: AdminRole;
  onOpenMobileSidebar: () => void;
}

function NotificationBell({ accountId }: { accountId: string }) {
  const [open, setOpen] = useState(false);
  const notifications = useAdminNotifications(accountId);
  const unread = notifications.filter((item) => !item.read).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white border border-slate-100 rounded-2xl shadow-xl py-2">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-50">
            <span className="text-sm font-black text-slate-900">Notifications</span>
            {unread > 0 && (
              <button type="button" onClick={() => AdminService.markAllNotificationsRead(accountId)} className="text-xs font-bold text-[#219b31] hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length ? (
              notifications.slice(0, 8).map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => {
                    setOpen(false);
                    AdminService.markNotificationRead(accountId, item.id);
                  }}
                  className={`block px-4 py-3 text-sm transition-colors hover:bg-slate-50 ${item.read ? "" : "bg-[#2ec440]/5"}`}
                >
                  <p className="font-bold text-slate-900">{item.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{formatDate(item.createdAt)}</p>
                </Link>
              ))
            ) : (
              <p className="px-4 py-6 text-center text-sm text-slate-400">No notifications yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Self-contained header for the Administration Portal — deliberately not
 * the customer-facing AppHeader (that hardcodes "Browse Properties" /
 * "Professional Portal" links that don't apply to internal staff). */
export default function AdminHeader({ adminRole, onOpenMobileSidebar }: AdminHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { logout, account } = useAuth();

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
        <Link href="/admin" aria-label="Go to the administration overview" className="flex items-center gap-2.5">
          <Logo className="h-8 w-auto" />
          <span className="hidden sm:inline rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">Admin</span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {account && <NotificationBell accountId={account.id} />}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-slate-200 pl-1.5 pr-3 py-1.5 hover:border-[#2ec440] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2ec440]"
            title="Account menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{(account?.name ?? "A").slice(0, 1)}</span>
            <span className="hidden text-left sm:block">
              <span className="block text-xs font-bold text-slate-900">{account?.name ?? "Staff"}</span>
              <span className="block text-[11px] text-slate-500">{ADMIN_ROLE_LABELS[adminRole]}</span>
            </span>
          </button>

          {menuOpen && (
            <div role="menu" className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2">
              <div className="px-4 py-2 border-b border-slate-50 mb-1">
                <div className="text-sm font-bold text-slate-900">{account?.name ?? "HuzaEstate staff"}</div>
                <div className="text-xs text-slate-500">{ADMIN_ROLE_LABELS[adminRole]}</div>
              </div>
              <Link href="/admin/settings" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                Settings
              </Link>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                Return to main site
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
