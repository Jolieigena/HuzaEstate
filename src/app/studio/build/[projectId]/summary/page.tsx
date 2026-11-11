"use client";

import { useState } from "react";
import { FloorPlanGraphic } from "@/components/build/FloorPlanSvg";
import { useBuildProjectContext } from "@/components/build/BuildProjectContext";
import { projectLocationLabel } from "@/lib/build/format";
import { ROOM_LABELS, RoomKey } from "@/lib/build/types";
import { downloadProjectPdf } from "@/lib/build/pdfReport";
import { useToast } from "@/lib/toast-context";
import { useStudioMoney } from "@/lib/currency/studioMoney";

/** The download step: the whole design and the document to keep. */
export default function ProjectSummaryPage() {
  const project = useBuildProjectContext();
  const { showToast } = useToast();
  const money = useStudioMoney();
  const [making, setMaking] = useState(false);
  const design = project.concepts.find((c) => c.id === project.selectedConceptId) ?? project.concepts[project.concepts.length - 1];
  const requiredSustainability = project.brief.sustainability.items.filter((i) => i.priority);
  const activeReview = project.reviewRequests.find((r) => r.status !== "cancelled");

  const download = async () => {
    setMaking(true);
    try {
      await downloadProjectPdf(project, { code: money.code, fromRwf: money.fromRwf });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "The PDF could not be made. Please try again.", "error");
    } finally {
      setMaking(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-black text-slate-900">Download</h1>
        <button type="button" onClick={download} disabled={making || !design} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-900 px-6 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">
          {making ? "Making your PDF…" : "Download PDF"}
        </button>
      </div>

      {design && (
        <section>
          <h2 className="text-lg font-black text-slate-900">Your design</h2>
          <p className="mb-4 text-sm font-semibold text-slate-600">
            {design.metrics.floorAreaSqm} sqm · {design.metrics.floors} floor{design.metrics.floors === 1 ? "" : "s"} · {design.metrics.bedrooms} bed / {design.metrics.bathrooms} bath
          </p>
          <div className="space-y-8">
            {design.floors.map((floor) => (
              <div key={floor.id} className="break-inside-avoid">
                {design.floors.length > 1 && <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-slate-500">{floor.name}</h3>}
                <div className="w-full [&>svg]:h-auto [&>svg]:w-full">
                  <FloorPlanGraphic floor={floor} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {project.fullDesign && project.fullDesign.pictures.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-black text-slate-900">Full design</h2>
          <p className="mb-4 text-sm font-semibold text-slate-600">{project.fullDesign.summary}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {project.fullDesign.pictures.map((picture) => (
              <figure key={picture.key} className="break-inside-avoid">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={picture.url} alt={picture.label} className="aspect-[16/10] w-full rounded-xl object-cover" />
                <figcaption className="mt-1 text-xs font-bold text-slate-500">{picture.label}</figcaption>
              </figure>
            ))}
          </div>
          {project.fullDesign.items.length > 0 && (
            <dl className="mt-4 grid grid-cols-[10rem_1fr] gap-x-4 gap-y-2 text-sm break-inside-avoid">
              {project.fullDesign.items.map((item) => (
                <div key={item.label} className="contents">
                  <dt className="font-bold text-slate-900">{item.label}</dt>
                  <dd className="text-slate-600">{item.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      )}

      <section className="grid gap-8 sm:grid-cols-2 break-inside-avoid">
        <div>
          <h2 className="mb-3 font-bold text-slate-900">Plot</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-500">Location</dt>
            <dd className="text-right font-semibold text-slate-900">{projectLocationLabel(project)}</dd>
            <dt className="text-slate-500">Plot area</dt>
            <dd className="text-right font-semibold text-slate-900">{project.brief.plot.areaSqm ? `${project.brief.plot.areaSqm} sqm` : "Not provided"}</dd>
            <dt className="text-slate-500">Shape</dt>
            <dd className="text-right font-semibold capitalize text-slate-900">{project.brief.plot.shape}</dd>
            <dt className="text-slate-500">Slope</dt>
            <dd className="text-right font-semibold capitalize text-slate-900">{project.brief.plot.slope}</dd>
          </dl>
        </div>
        <div>
          <h2 className="mb-3 font-bold text-slate-900">Requirements</h2>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">{project.brief.household.floors} floors</span>
            {project.brief.household.rooms.map((r) => (
              <span key={r.key} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
                {ROOM_LABELS[r.key as RoomKey] ?? r.label}
                {r.quantity > 1 ? ` × ${r.quantity}` : ""}
              </span>
            ))}
          </div>
          {requiredSustainability.length > 0 && (
            <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-slate-600">
              {requiredSustainability.map((i) => (
                <li key={i.key}>{i.label}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {activeReview && (
        <section className="break-inside-avoid">
          <h2 className="mb-2 font-bold text-slate-900">Professional review</h2>
          <p className="text-sm text-slate-600">
            {activeReview.type.replace(/_/g, " ")} — {activeReview.status.replace(/_/g, " ")}
          </p>
        </section>
      )}

      <section className="break-inside-avoid rounded-xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-600">
        <p className="mb-1 font-bold text-slate-900">Disclaimer</p>
        <p>
          This is a conceptual design produced by HuzaEstate Build and is not an approved construction drawing. Final architectural, structural and permit documents must be prepared or approved by qualified professionals.
        </p>
      </section>
    </div>
  );
}
