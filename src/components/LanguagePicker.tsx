"use client";

import { useState } from "react";
import { LANGUAGES, useLanguage } from "@/lib/i18n/language";
import { useDismiss } from "@/lib/useDismiss";

/** Chooses the site's language from a list (Kinyarwanda and English first). `dark` is for the dark footer, `up` opens the list above the button. */
/** `align="right"` opens the list towards the left (for a picker at the right edge of a header); `compact` shows only the short code on a phone. */
export default function LanguagePicker({ dark = false, up = false, className = "", align = "left", compact = false }: { dark?: boolean; up?: boolean; className?: string; align?: "left" | "right"; compact?: boolean }) {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[1];

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${current.label}`}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${dark ? "border-white/15 text-slate-300 hover:text-white" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"}`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
          <path strokeWidth="1.8" strokeLinecap="round" d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" />
        </svg>
        {compact ? (
          <>
            <span className="sm:hidden">{current.short}</span>
            <span className="hidden sm:inline">{current.label}</span>
          </>
        ) : current.label}
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul role="listbox" aria-label="Language" className={`absolute z-50 max-h-72 w-48 overflow-y-auto rounded-2xl border border-slate-100 bg-white py-1.5 shadow-xl ${up ? "bottom-full mb-2" : "top-full mt-2"} ${align === "right" ? "right-0" : "left-0"}`}>
          {LANGUAGES.map((option, index) => {
            const active = option.code === language;
            return (
              <li key={option.code} role="option" aria-selected={active} className={index === 2 ? "mt-1 border-t border-slate-100 pt-1" : ""}>
                <button
                  type="button"
                  lang={option.code}
                  onClick={() => {
                    setLanguage(option.code);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors hover:bg-slate-50 ${active ? "font-bold text-[#2ec440]" : "font-medium text-slate-700"}`}
                >
                  {option.label}
                  {active && (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
