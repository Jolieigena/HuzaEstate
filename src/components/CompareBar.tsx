"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCompareIds } from "@/lib/compare/hooks";
import { CompareStoreEngine, MAX_COMPARE } from "@/lib/compare/store";
import { useLanguage } from "@/lib/i18n/language";

// Where homes are listed, so a visitor can keep ticking more; elsewhere (the account areas, sign-in, checkout) the bar stays out of the way.
const SHOW_ON = ["/", "/properties", "/buy", "/rent", "/dashboard"];

/** The bar at the bottom of the screen once a home is ticked for comparing: how many, a button to compare, and a way to start over. */
export default function CompareBar() {
  const ids = useCompareIds();
  const pathname = usePathname();
  const { t } = useLanguage();
  const visible = ids.length > 0 && SHOW_ON.some((p) => (p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(`${p}/`)));
  if (!visible) return null;
  return (
    <div className="fixed inset-x-0 bottom-20 lg:bottom-6 z-40 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-slate-900 text-white shadow-2xl pl-5 pr-2 py-2">
        <span className="text-sm font-semibold whitespace-nowrap">
          {ids.length} / {MAX_COMPARE} {t("selected")}
        </span>
        <button type="button" onClick={() => CompareStoreEngine.clear()} className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-1">
          {t("Clear")}
        </button>
        {ids.length >= 2 ? (
          <Link href="/compare" className="rounded-full bg-[#2ec440] hover:bg-[#25a835] text-white text-sm font-bold px-5 py-2 transition-colors">
            {t("Compare")}
          </Link>
        ) : (
          <span className="rounded-full bg-white/10 text-slate-400 text-sm font-bold px-5 py-2 cursor-not-allowed" aria-disabled="true">
            {t("Compare")}
          </span>
        )}
      </div>
    </div>
  );
}
