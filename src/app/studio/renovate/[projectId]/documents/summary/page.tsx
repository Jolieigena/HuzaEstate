"use client";

import { useState } from "react";
/* eslint-disable @next/next/no-img-element */
import { useRenovationProjectContext } from "@/components/renovate/RenovationProjectContext";
import { formatCompactRwf, propertyLocationLabel } from "@/lib/renovate/format";
import { hasPicture } from "@/lib/renovate/redesign";
import { downloadRenovationPdf } from "@/lib/renovate/pdfReport";
import { RENOVATION_AREA_LABELS } from "@/lib/renovate/types";
import { useToast } from "@/lib/toast-context";

/** The download step: the whole redesign and the document to keep. */
export default function RenovationDownloadPage() {
  const project = useRenovationProjectContext();
  const { showToast } = useToast();
  const [making, setMaking] = useState(false);
  const design = project.concepts.find((c) => c.id === project.selectedConceptId) ?? project.concepts[project.concepts.length - 1];
  const views = design?.areaViews.filter(hasPicture) ?? [];
  const activeReview = project.reviewRequests.find((r) => r.status !== "cancelled");
  const acceptedQuotation = project.quotations.find((q) => q.status === "accepted");
  const lists: [string, string[]][] = design
    ? ([
        ["What changes", design.whatChanges],
        ["What stays", design.whatRemains],
        ["What is removed", design.whatIsRemoved],
        ["Materials", design.suggestedMaterials],
        ["Colours", design.suggestedColours],
      ] as [string, string[]][]).filter(([, items]) => items.length > 0)
    : [];
  const scope = [...project.scope].sort((a, b) => a.sequence - b.sequence);

  const download = async () => {
    setMaking(true);
    try {
      await downloadRenovationPdf(project);
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
        <button
          type="button"
          onClick={download}
          disabled={making || !design}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-900 px-6 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          {making ? "Making your PDF…" : "Download PDF"}
        </button>
      </div>

      {views.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-black text-slate-900">Before and after</h2>
          <div className="space-y-6">
            {views.map((view) => (
              <div key={view.areaKey} className="break-inside-avoid">
                <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-slate-500">{view.label}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <img src={view.beforeImage} alt={`${view.label}, before`} className="aspect-[16/10] w-full rounded-xl object-cover" />
                  <img src={view.afterImage} alt={`${view.label}, redesigned`} className="aspect-[16/10] w-full rounded-xl object-cover" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {lists.length > 0 && (
        <section className="grid gap-6 sm:grid-cols-2">
          {lists.map(([title, items]) => (
            <div key={title} className="break-inside-avoid">
              <h2 className="mb-2 font-bold text-slate-900">{title}</h2>
              <ul className="list-inside list-disc space-y-0.5 text-sm text-slate-600">
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {scope.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-black text-slate-900">Scope of work</h2>
          <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white">
            {scope.map((item) => (
              <div key={item.id} className="grid gap-1 px-5 py-3 sm:grid-cols-[12rem_1fr] sm:gap-4">
                <dt className="text-sm font-bold text-slate-900">{RENOVATION_AREA_LABELS[item.areaKey]}</dt>
                <dd className="text-sm text-slate-600">
                  {item.task}
                  {item.quantity ? ` (${item.quantity} ${item.unit})` : ""}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="grid gap-8 sm:grid-cols-2 break-inside-avoid">
        <div>
          <h2 className="mb-2 font-bold text-slate-900">Property</h2>
          <p className="text-sm text-slate-600">{propertyLocationLabel(project)}</p>
        </div>
        <div>
          <h2 className="mb-2 font-bold text-slate-900">Hiring</h2>
          <p className="text-sm text-slate-600">
            {acceptedQuotation
              ? `Accepted: ${acceptedQuotation.contractor.companyName}, ${formatCompactRwf(acceptedQuotation.total)}`
              : activeReview
                ? `${activeReview.type.replace(/_/g, " ")}, ${activeReview.status.replace(/_/g, " ")}`
                : "No professional hired yet."}
          </p>
        </div>
      </section>

      <section className="break-inside-avoid rounded-xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-600">
        <p className="mb-1 font-bold text-slate-900">Disclaimer</p>
        <p>
          This is a conceptual renovation design produced by HuzaEstate Renovate and is not an approved technical design. Structural, electrical, plumbing, safety and permit-related work must be reviewed by qualified professionals before any work begins.
        </p>
      </section>
    </div>
  );
}
