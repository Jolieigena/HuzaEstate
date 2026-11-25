"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AccessCodesPage } from "./AccessCodes";
import { ClientDiscountsPage } from "./ClientDiscounts";
import { PageFrame } from "../ui";

const TABS = [
  { key: "codes", label: "Access codes" },
  { key: "discounts", label: "Discounts" },
] as const;

/** What a client pays for a plan, in one place: access codes give a plan free for a while, discounts make it cheaper for a while. */
export function AccessAndDiscountsPage({ scope }: { scope: "platform" | "org" }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = params.get("tab") === "discounts" ? "discounts" : "codes";
  return (
    <PageFrame title="Access & discounts">
      <div role="tablist" aria-label="Access and discounts" className="mb-6 flex gap-2 border-b border-slate-200">
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => router.replace(t.key === "discounts" ? `${pathname}?tab=discounts` : pathname, { scroll: false })}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${on ? "border-[#2ec440] text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {tab === "discounts" ? <ClientDiscountsPage scope={scope} embedded /> : <AccessCodesPage scope={scope} embedded />}
    </PageFrame>
  );
}
