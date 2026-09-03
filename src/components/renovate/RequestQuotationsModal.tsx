"use client";

import { useId, useState } from "react";
import Dialog from "@/components/Dialog";
import { RenovationAreaKey, RenovationProject, RENOVATION_AREA_LABELS } from "@/lib/renovate/types";
import { DEMO_CONTRACTORS } from "@/lib/renovate/demoContractors";
import { RenovationQuotationService } from "@/lib/renovate/quotationService";
import { RenovationProjectService } from "@/lib/renovate/projectService";
import { useToast } from "@/lib/toast-context";

const STEP_LABELS = ["Scope", "Rooms", "Documents", "Start period", "Occupancy", "Contractors", "Notes", "Review and send"];
const MAX_CONTRACTORS = 4;

export default function RequestQuotationsModal({ project, open, onClose }: { project: RenovationProject; open: boolean; onClose: () => void }) {
  const { showToast } = useToast();
  const titleId = useId();
  const [step, setStep] = useState(0);
  const [scopeItemIds, setScopeItemIds] = useState<string[]>(project.scope.filter((s) => s.status !== "excluded").map((s) => s.id));
  const [areaKeys, setAreaKeys] = useState<RenovationAreaKey[]>(project.assessment.areas.map((a) => a.areaKey));
  const [documentIds, setDocumentIds] = useState<string[]>([]);
  const [startPeriod, setStartPeriod] = useState("Within 1 month");
  const [occupied, setOccupied] = useState<boolean | null>(project.assessment.budgetTimeline.propertyRemainsOccupied);
  const [contractorIds, setContractorIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const reset = () => {
    setStep(0);
    setDocumentIds([]);
    setStartPeriod("Within 1 month");
    setContractorIds([]);
    setNotes("");
    setSubmitted(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const toggleContractor = (id: string) => {
    setContractorIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : prev.length >= MAX_CONTRACTORS ? prev : [...prev, id]));
  };

  const canAdvance = [true, true, true, true, true, contractorIds.length > 0, true, true][step];

  const handleSubmit = () => {
    const contractors = DEMO_CONTRACTORS.filter((c) => contractorIds.includes(c.id));
    const targetBudget = project.budget?.target ?? 5_000_000;
    const durationWeeks = project.timeline?.totalDurationWeeks ?? 8;
    const includedScope = project.scope.filter((s) => scopeItemIds.includes(s.id));
    const quotations = RenovationQuotationService.generateQuotations({ targetBudget, scope: includedScope, proposedDurationWeeks: durationWeeks, contractors });
    RenovationProjectService.requestQuotations(
      project.id,
      { scopeItemIds, includedAreaKeys: areaKeys, documentIds, preferredStartPeriod: startPeriod, propertyOccupied: occupied, contractorIds, notes },
      contractors,
      quotations
    );
    setSubmitted(true);
    showToast("Quotations requested.");
  };

  return (
    <Dialog open={open} onClose={handleClose} labelledBy={titleId} panelClassName="max-w-xl">
      <div className="p-6 sm:p-8">
        {submitted ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-2xl bg-[#2ec440]/10 text-[#2ec440] flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 id={titleId} className="text-xl font-black text-slate-900 mb-2">
              Quotations requested
            </h2>
            <p className="text-slate-500 text-sm mb-6">Requested from {contractorIds.length} contractor{contractorIds.length === 1 ? "" : "s"}. Prototype quotations are ready to compare below.</p>
            <button type="button" onClick={handleClose} className="bg-slate-900 hover:bg-[#2ec440] text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-lg">
              Done
            </button>
          </div>
        ) : (
          <>
            <h2 id={titleId} className="text-xl font-black text-slate-900 mb-1">
              Request contractor quotations
            </h2>
            <p className="text-slate-500 text-sm mb-5">
              Step {step + 1} of {STEP_LABELS.length}: {STEP_LABELS[step]}
            </p>

            <div className="min-h-[220px]">
              {step === 0 && (
                <div className="space-y-2">
                  {project.scope.map((s) => (
                    <label key={s.id} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={scopeItemIds.includes(s.id)}
                        onChange={() => setScopeItemIds((prev) => (prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]))}
                        className="accent-[#2ec440]"
                      />
                      <span className="text-sm font-semibold text-slate-700">{s.task}</span>
                    </label>
                  ))}
                  {project.scope.length === 0 && <p className="text-sm text-slate-500">No scope items yet — generate a scope of work first for the most accurate quotations.</p>}
                </div>
              )}

              {step === 1 && (
                <div className="flex flex-wrap gap-2">
                  {project.assessment.areas.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAreaKeys((prev) => (prev.includes(a.areaKey) ? prev.filter((k) => k !== a.areaKey) : [...prev, a.areaKey]))}
                      aria-pressed={areaKeys.includes(a.areaKey)}
                      className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                        areaKeys.includes(a.areaKey) ? "bg-[#2ec440]/10 border-[#2ec440] text-[#2ec440]" : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      {RENOVATION_AREA_LABELS[a.areaKey]}
                    </button>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-2">
                  {project.documents.length === 0 ? (
                    <p className="text-sm text-slate-500">No documents yet — you can still send the request and share documents later.</p>
                  ) : (
                    project.documents.map((doc) => (
                      <label key={doc.id} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={documentIds.includes(doc.id)}
                          onChange={() => setDocumentIds((prev) => (prev.includes(doc.id) ? prev.filter((id) => id !== doc.id) : [...prev, doc.id]))}
                          className="accent-[#2ec440]"
                        />
                        <span className="text-sm font-semibold text-slate-700">{doc.name}</span>
                      </label>
                    ))
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-2">
                  {["As soon as possible", "Within 1 month", "1-3 months", "3-6 months", "Flexible"].map((opt) => (
                    <label key={opt} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 cursor-pointer">
                      <input type="radio" name="start-period" checked={startPeriod === opt} onChange={() => setStartPeriod(opt)} className="accent-[#2ec440]" />
                      <span className="text-sm font-semibold text-slate-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {step === 4 && (
                <div className="flex gap-3">
                  {[
                    { v: true, l: "Yes, occupied during work" },
                    { v: false, l: "No, vacant" },
                  ].map((opt) => (
                    <button
                      key={String(opt.v)}
                      type="button"
                      onClick={() => setOccupied(opt.v)}
                      className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-colors ${occupied === opt.v ? "bg-[#2ec440]/10 border-[#2ec440] text-[#2ec440]" : "bg-white border-slate-200 text-slate-600"}`}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              )}

              {step === 5 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 mb-2">Select up to {MAX_CONTRACTORS} contractors.</p>
                  {DEMO_CONTRACTORS.map((c) => (
                    <label key={c.id} className={`flex items-start gap-3 border rounded-xl px-4 py-3 cursor-pointer ${contractorIds.includes(c.id) ? "border-[#2ec440] bg-[#2ec440]/5" : "border-slate-200 bg-slate-50"}`}>
                      <input type="checkbox" checked={contractorIds.includes(c.id)} onChange={() => toggleContractor(c.id)} className="accent-[#2ec440] mt-1" />
                      <div className="flex-grow">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{c.companyName}</span>
                          {c.verified && <span className="text-[10px] font-bold bg-[#2ec440]/10 text-[#2ec440] px-1.5 py-0.5 rounded">Verified</span>}
                        </div>
                        <p className="text-xs text-slate-500">
                          {c.location} · {c.services.join(", ")}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          ★ {c.rating} · {c.completedProjects} completed projects · Responds in {c.estimatedResponseTime}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {step === 6 && (
                <div>
                  <label htmlFor="quote-notes" className="block text-sm font-bold text-slate-700 mb-2">
                    Notes for contractors
                  </label>
                  <textarea
                    id="quote-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={5}
                    placeholder="Anything contractors should know before quoting."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 resize-none"
                  />
                </div>
              )}

              {step === 7 && (
                <dl className="bg-slate-50 border border-slate-200 rounded-2xl p-5 grid grid-cols-2 gap-y-3 text-sm">
                  <dt className="text-slate-500">Scope items</dt>
                  <dd className="text-right font-semibold text-slate-900">{scopeItemIds.length}</dd>
                  <dt className="text-slate-500">Rooms</dt>
                  <dd className="text-right font-semibold text-slate-900">{areaKeys.length}</dd>
                  <dt className="text-slate-500">Documents</dt>
                  <dd className="text-right font-semibold text-slate-900">{documentIds.length}</dd>
                  <dt className="text-slate-500">Preferred start</dt>
                  <dd className="text-right font-semibold text-slate-900">{startPeriod}</dd>
                  <dt className="text-slate-500">Occupied during work</dt>
                  <dd className="text-right font-semibold text-slate-900">{occupied === null ? "Not set" : occupied ? "Yes" : "No"}</dd>
                  <dt className="text-slate-500">Contractors</dt>
                  <dd className="text-right font-semibold text-slate-900">{contractorIds.length}</dd>
                </dl>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-6">
              <button
                type="button"
                onClick={() => (step === 0 ? handleClose() : setStep(step - 1))}
                className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                {step === 0 ? "Cancel" : "Back"}
              </button>
              {step < STEP_LABELS.length - 1 ? (
                <button
                  type="button"
                  disabled={!canAdvance}
                  onClick={() => setStep(step + 1)}
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-[#2ec440] disabled:opacity-50 text-white font-bold transition-colors shadow-lg"
                >
                  Continue
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-[#2ec440] text-white font-bold transition-colors shadow-lg">
                  Send Request
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
