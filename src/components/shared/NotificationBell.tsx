"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { NotificationsApi, type AppNotification } from "@/lib/notifications/api";

const POLL_INTERVAL_MS = 45_000;

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Self-contained notification bell — reads token/account from useAuth() itself (same pattern
 *  every portal header already follows), so each header just renders <NotificationBell /> with
 *  no props. Polls on an interval rather than a websocket (no such infra exists in this
 *  codebase). Renders nothing while signed out. */
export default function NotificationBell() {
  const { token, isLoggedIn } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    function load() {
      NotificationsApi.list(token as string).then((result) => {
        if (!cancelled && result.ok) {
          setNotifications(result.data.notifications);
          setUnreadCount(result.data.unreadCount);
        }
      });
    }
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!isLoggedIn || !token) return null;

  async function handleClickNotification(n: AppNotification) {
    setOpen(false);
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
      if (token) await NotificationsApi.markRead(token, n.id);
    }
    if (n.linkHref) router.push(n.linkHref);
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    if (token) await NotificationsApi.markAllRead(token);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900 transition-colors"
      >
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-50 mb-1">
            <span className="text-sm font-bold text-slate-900">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs font-semibold text-[#219b31] hover:underline">
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClickNotification(n)}
                className={`block w-full text-left px-4 py-2.5 transition-colors hover:bg-slate-50 ${n.read ? "" : "bg-[#2ec440]/5"}`}
              >
                <div className="flex items-start gap-2">
                  {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2ec440]" />}
                  <div className={`min-w-0 ${n.read ? "pl-3.5" : ""}`}>
                    <p className="text-sm font-bold text-slate-900 truncate">{n.title}</p>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{n.body}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
