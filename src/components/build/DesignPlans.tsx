"use client";

import { useState } from "react";
import FloorPlanSvg from "@/components/build/FloorPlanSvg";
import { downloadDesignPng, downloadDesignSvg } from "@/lib/build/exportPlan";
import type { HouseDesignRecord } from "@/lib/houseDesigns/api";
import { useToast } from "@/lib/toast-context";

/** The floor plans of a design that was sent in, with buttons to download them. Shared by the customer's own list and the admin inbox. */
export default function DesignPlans({ record }: { record: HouseDesignRecord }) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const subtitle = record.plotSummary || undefined;

  const download = async (format: "png" | "svg") => {
    setBusy(true);
    try {
      if (format === "svg") downloadDesignSvg(record.design, record.title, subtitle);
      else await downloadDesignPng(record.design, record.title, subtitle);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not download the design.", "error");
    }
    setBusy(false);
  };

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="min-h-10 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-[#2ec440] hover:text-[#219b31]">
          {open ? "Hide floor plans" : "View floor plans"}
        </button>
        <button type="button" onClick={() => download("png")} disabled={busy} className="min-h-10 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-[#2ec440] disabled:opacity-50">
          {busy ? "Preparing…" : "Download picture (PNG)"}
        </button>
        <button type="button" onClick={() => download("svg")} disabled={busy} className="min-h-10 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-[#2ec440] hover:text-[#219b31] disabled:opacity-50">
          Download SVG
        </button>
      </div>
      {open && (
        <div className="mt-4 space-y-4">
          {record.design.floors.map((floor) => (
            <div key={floor.id}>
              <p className="mb-2 text-sm font-bold text-slate-700">{floor.name}</p>
              <FloorPlanSvg floor={floor} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
