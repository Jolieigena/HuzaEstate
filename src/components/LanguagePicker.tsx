"use client";

import { LANGUAGES, useLanguage } from "@/lib/i18n/language";

/** Switches the site's language. `dark` is for the dark footer. */
export default function LanguagePicker({ dark = false, className = "" }: { dark?: boolean; className?: string }) {
  const { language, setLanguage } = useLanguage();
  return (
    <div role="group" aria-label="Language" className={`inline-flex items-center rounded-full border p-0.5 text-xs font-bold ${dark ? "border-white/15" : "border-slate-200"} ${className}`}>
      {LANGUAGES.map((option) => {
        const active = option.code === language;
        return (
          <button
            key={option.code}
            type="button"
            lang={option.code}
            title={option.label}
            aria-pressed={active}
            onClick={() => setLanguage(option.code)}
            className={`rounded-full px-2.5 py-1.5 transition-colors ${active ? "bg-[#2ec440] text-white" : dark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
          >
            {option.short}
          </button>
        );
      })}
    </div>
  );
}
