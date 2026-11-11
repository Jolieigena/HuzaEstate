"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** The two parts of the Hire a professional step: a professional's review of the design, and contractors' quotations. */
export default function HireTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/studio/renovate/${projectId}`;
  const tabs = [
    { label: "Professional review", href: `${base}/professionals` },
    { label: "Quotations", href: `${base}/quotes` },
  ];
  return (
    <nav aria-label="Hire a professional" className="mb-6 flex gap-6 border-b border-slate-200 text-sm sm:text-base">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link key={tab.href} href={tab.href} aria-current={active ? "page" : undefined} className={`-mb-px border-b-2 pb-3 font-bold ${active ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
