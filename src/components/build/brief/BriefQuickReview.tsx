"use client";

import { DesignBrief, HOME_STYLE_LABELS, ROOM_LABELS, RoomKey } from "@/lib/build/types";
import { QUICK_EXTRA_ROOMS } from "./BriefQuickHome";
import { formatCurrency } from "@/lib/build/format";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-900">{value || "—"}</span>
    </div>
  );
}

/** The short path's last screen: a small summary, the confirmation, and a way into the full brief. */
export default function BriefQuickReview({
  brief,
  onEdit,
  onAddDetail,
}: {
  brief: DesignBrief;
  onEdit: (step: "basics") => void;
  onAddDetail: () => void;
}) {
  const quantityOf = (key: string) => brief.household.rooms.find((r) => r.key === key)?.quantity;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Your home</h3>
          <button type="button" onClick={() => onEdit("basics")} className="text-xs font-bold text-[#2ec440] transition-colors hover:text-[#28b039]">
            Edit
          </button>
        </div>
        <Row label="Location" value={[brief.basics.provinceOrCity, brief.basics.countryValue].filter(Boolean).join(", ")} />
        <Row label="Plot size" value={brief.plot.areaSqm ? `${brief.plot.areaSqm} sqm` : ""} />
        <Row label="Floors" value={brief.household.floors} />
        <Row label="Bedrooms" value={quantityOf("bedrooms")} />
        <Row label="Bathrooms" value={quantityOf("bathrooms")} />
        <Row label="Other spaces" value={brief.household.rooms.filter((r) => (QUICK_EXTRA_ROOMS as string[]).includes(r.key)).map((r) => ROOM_LABELS[r.key as RoomKey]).join(", ")} />
        <Row label="Parking" value={brief.household.parkingSpaces} />
        <Row label="Front faces" value={brief.plot.orientation} />
        {brief.household.notes?.trim() && <Row label="Notes" value={brief.household.notes.trim()} />}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Style and budget</h3>
          <button type="button" onClick={() => onEdit("basics")} className="text-xs font-bold text-[#2ec440] transition-colors hover:text-[#28b039]">
            Edit
          </button>
        </div>
        <Row label="Style" value={brief.style.primaryStyle ? HOME_STYLE_LABELS[brief.style.primaryStyle] : ""} />
        {(brief.style.features ?? []).length > 0 && <Row label="Features" value={(brief.style.features ?? []).join(", ")} />}
        <Row label="Target budget" value={brief.budget.targetBudget ? formatCurrency(brief.budget.targetBudget, brief.budget.currency) : ""} />
      </div>

      <button type="button" onClick={onAddDetail} className="text-sm font-bold text-slate-500 transition-colors hover:text-slate-900">
        Add more detail (plot, timeline, sustainability)
      </button>
    </div>
  );
}
