"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useBuildProjectContext } from "@/components/build/BuildProjectContext";
import { ActivityCategory } from "@/lib/build/types";
import { formatDateTime } from "@/lib/build/format";

const CATEGORY_FILTERS: { key: ActivityCategory | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "design", label: "Design" },
  { key: "budget", label: "Budget" },
  { key: "documents", label: "Documents" },
  { key: "professional_review", label: "Professional review" },
  { key: "system", label: "System" },
];

const CATEGORY_STYLES: Record<ActivityCategory, string> = {
  design: "bg-[#2ec440]/10 text-[#2ec440]",
  budget: "bg-amber-50 text-amber-700",
  documents: "bg-blue-50 text-blue-700",
  professional_review: "bg-purple-50 text-purple-700",
  system: "bg-slate-100 text-slate-600",
};

function actionLabel(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function ActivityPage() {
  const project = useBuildProjectContext();
  const [filter, setFilter] = useState<ActivityCategory | "all">("all");

  const events = useMemo(() => {
    const sorted = [...project.activity].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return filter === "all" ? sorted : sorted.filter((e) => e.category === filter);
  }, [project.activity, filter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-900 mb-1">Project activity</h1>
        <p className="text-slate-500 text-sm">A chronological history of everything that has happened on this project.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${filter === f.key ? "bg-[#2ec440]/10 text-[#2ec440]" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {events.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-12 text-center text-slate-500">No activity recorded for this filter yet.</div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 sm:p-8">
          <ol className="relative border-l-2 border-slate-100 pl-6 space-y-6">
            {events.map((event) => (
              <li key={event.id} className="relative">
                <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#2ec440]" aria-hidden="true" />
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${CATEGORY_STYLES[event.category]}`}>{event.category.replace("_", " ")}</span>
                  <span className="font-bold text-slate-900 text-sm">{actionLabel(event.type)}</span>
                </div>
                <p className="text-sm text-slate-600">
                  <span className="font-semibold">{event.actor}</span>
                  {event.details ? ` — ${event.details}` : ""}
                </p>
                <p className="text-xs text-slate-400 mt-1">{formatDateTime(event.timestamp)}</p>
                {event.link && (
                  <Link href={event.link} className="text-xs font-bold text-[#2ec440] hover:text-[#28b039] mt-1 inline-block">
                    View related item
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
