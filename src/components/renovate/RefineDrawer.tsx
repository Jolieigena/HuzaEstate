"use client";

import { useId, useState } from "react";
import Dialog from "@/components/Dialog";
import { RenovationConcept } from "@/lib/renovate/types";
import { analyzeRefinement, RefinementAnalysis } from "@/lib/renovate/refinement";
import { RenovationProjectService } from "@/lib/renovate/projectService";
import { formatCompactRwf } from "@/lib/renovate/format";
import { useToast } from "@/lib/toast-context";

const SUGGESTED_REQUESTS = [
  "Suggest a lower-cost option",
  "Keep the existing plumbing locations",
  "Improve storage without reducing circulation",
  "Suggest locally available materials",
  "Use warmer lighting throughout",
  "Simplify the finishes to reduce cost",
  "Increase the finish quality",
];

export default function RefineDrawer({ projectId, concept, open, onClose }: { projectId: string; concept: RenovationConcept | null; open: boolean; onClose: () => void }) {
  const { showToast } = useToast();
  const titleId = useId();
  const [request, setRequest] = useState("");
  const [analysis, setAnalysis] = useState<RefinementAnalysis | null>(null);

  const reset = () => {
    setRequest("");
    setAnalysis(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!concept) return null;

  return (
    <Dialog open={open} onClose={handleClose} labelledBy={titleId} panelClassName="max-w-lg">
      <div className="p-6 sm:p-8">
        <h2 id={titleId} className="text-xl font-black text-slate-900 mb-1">
          Refine with Huza AI
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          Requesting a change to the {concept.name} concept, version {concept.version}.
        </p>

        {!analysis ? (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              {SUGGESTED_REQUESTS.map((s) => (
                <button key={s} type="button" onClick={() => setRequest(s)} className="text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full transition-colors">
                  {s}
                </button>
              ))}
            </div>
            <label htmlFor="refine-request" className="block text-sm font-bold text-slate-700 mb-2">
              What would you like to change?
            </label>
            <textarea
              id="refine-request"
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              rows={3}
              placeholder="e.g. Keep the layout but change the style"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors resize-none mb-6"
            />
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button type="button" onClick={handleClose} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button
                type="button"
                disabled={!request.trim()}
                onClick={() => setAnalysis(analyzeRefinement(request, concept))}
                className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-[#2ec440] disabled:opacity-50 text-white font-bold transition-colors shadow-lg"
              >
                Preview Refinement
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6 space-y-3">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Requested change</p>
                <p className="text-sm text-slate-800">{request}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Elements affected</p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.elementsAffected.map((el) => (
                    <span key={el} className="text-xs font-semibold bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700">
                      {el}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Possible cost impact</p>
                  <p className={`text-sm font-bold ${analysis.costImpact === "increase" ? "text-amber-600" : analysis.costImpact === "decrease" ? "text-[#2ec440]" : "text-slate-600"}`}>
                    {analysis.costImpact === "increase" ? "Likely increase" : analysis.costImpact === "decrease" ? "Likely decrease" : "Minimal change expected"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Possible scope impact</p>
                  <p className={`text-sm font-bold ${analysis.scopeImpact === "increase" ? "text-amber-600" : analysis.scopeImpact === "decrease" ? "text-[#2ec440]" : "text-slate-600"}`}>
                    {analysis.scopeImpact === "increase" ? "Likely increase" : analysis.scopeImpact === "decrease" ? "Likely decrease" : "Minimal change expected"}
                  </p>
                </div>
              </div>
              {(analysis.conceptPatch.estimatedCostLowRwf || analysis.conceptPatch.estimatedCostHighRwf) && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Estimated new cost range</p>
                  <p className="text-sm text-slate-800 font-semibold">
                    {formatCompactRwf(analysis.conceptPatch.estimatedCostLowRwf ?? concept.estimatedCostLowRwf)} –{" "}
                    {formatCompactRwf(analysis.conceptPatch.estimatedCostHighRwf ?? concept.estimatedCostHighRwf)}
                  </p>
                </div>
              )}
              <p className="text-xs text-slate-500">This creates a new version — your current version is never overwritten.</p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button type="button" onClick={() => setAnalysis(null)} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  RenovationProjectService.refineConcept(projectId, concept.id, request, analysis.changeSummary, analysis.conceptPatch);
                  showToast("Refinement applied as a new version.");
                  handleClose();
                }}
                className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-[#2ec440] text-white font-bold transition-colors shadow-lg"
              >
                Apply as New Version
              </button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
