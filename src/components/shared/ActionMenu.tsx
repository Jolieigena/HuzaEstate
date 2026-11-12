"use client";

import { useEffect, useId, useRef, useState, ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

export interface ActionMenuItem {
  key: string;
  label: string;
  onSelect: () => void;
  danger?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  label?: string;
  align?: "left" | "right";
}

/**
 * Accessible kebab action menu shared by project cards and the project
 * workspace header across modules. Closes on outside click, Escape,
 * selecting an item, or navigating to a new route.
 */
export default function ActionMenu({ items, label = "Project actions", align = "right" }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  // The menu is drawn on the page itself, not inside the card, so a card that clips its content cannot cut the menu off.
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Close the menu whenever the route changes. Adjusted during render
  // (rather than in an effect) so it happens before the closed menu ever paints.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current && !containerRef.current.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const close = () => setOpen(false);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={label}
        onClick={() => {
          if (!open && buttonRef.current) {
            const r = buttonRef.current.getBoundingClientRect();
            const width = 208;
            const height = items.length * 44 + 16;
            const left = Math.max(8, Math.min(align === "right" ? r.right - width : r.left, window.innerWidth - width - 8));
            const top = r.bottom + 8 + height > window.innerHeight ? Math.max(8, r.top - 8 - height) : r.bottom + 8;
            setPos({ top, left });
          }
          setOpen((v) => !v);
        }}
        className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ec440]"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>

      {open && pos && createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          style={{ position: "fixed", top: pos.top, left: pos.left }}
          className="z-[60] w-52 bg-white border border-slate-100 rounded-2xl shadow-xl py-2"
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={`w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                item.danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
