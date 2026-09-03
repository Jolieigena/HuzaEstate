"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { SidebarLinks } from "./Sidebar";

interface MobileSidebarDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Off-canvas variant of the global app sidebar for small screens, opened via
 * the hamburger button in AppHeader. Always shows full labels (the icon-rail
 * collapse is a desktop space-saving affordance only).
 */
export default function MobileSidebarDrawer({ open, onClose }: MobileSidebarDrawerProps) {
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);

  // Close on route change — adjusted during render rather than in an effect.
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
      <div role="dialog" aria-modal="true" aria-label="Account navigation" className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl flex flex-col animate-[fadeIn_0.15s_ease-out]">
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
          <Logo className="h-7 w-auto" />
          <button type="button" onClick={onClose} aria-label="Close menu" className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-grow overflow-y-auto py-4">
          <Suspense fallback={null}>
            <SidebarLinks collapsed={false} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
