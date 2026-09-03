"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import type { AdminRole } from "@/lib/admin/types";
import { AdminNavLinks } from "./AdminSidebar";

interface AdminMobileDrawerProps {
  adminRole: AdminRole;
  open: boolean;
  onClose: () => void;
}

/** Off-canvas admin nav for small screens, mirroring MobileSidebarDrawer's
 * behavior (backdrop click, Escape, scroll lock, close on route change). */
export default function AdminMobileDrawer({ adminRole, open, onClose }: AdminMobileDrawerProps) {
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (open) onClose();
  }

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/60" aria-hidden="true" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Administration navigation" className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl flex flex-col animate-[fadeIn_0.15s_ease-out]">
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Logo className="h-7 w-auto" />
            <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Admin</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Close menu" className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-grow overflow-y-auto py-4">
          <AdminNavLinks adminRole={adminRole} />
        </div>
      </div>
    </div>
  );
}
