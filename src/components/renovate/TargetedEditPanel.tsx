"use client";

import { useId, useState } from "react";
import Dialog from "@/components/Dialog";
import { RenovationAreaKey, RenovationConcept, RENOVATION_AREA_LABELS } from "@/lib/renovate/types";
import { analyzeTargetedEdit } from "@/lib/renovate/refinement";
import { RenovationProjectService } from "@/lib/renovate/projectService";
import { useToast } from "@/lib/toast-context";

const PREDEFINED_ZONES = ["Walls", "Floor", "Ceiling", "Cabinetry", "Fixtures", "Lighting", "Furniture", "Whole area"];

const EXAMPLE_REQUESTS = ["Change only the floor.", "Replace these cabinets.", "Add warmer lighting.", "Change this wall to a lighter colour.", "Add more storage here.", "Remove this furniture."];

interface Props {
  projectId: string;
  concept: RenovationConcept | null;
  open: boolean;
  onClose: () => void;
}

export default function TargetedEditPanel({ projectId, concept, open, onClose }: Props) {
  const { showToast } = useToast();
  const titleId = useId();
  const [areaKey, setAreaKey] = useState<RenovationAreaKey | null>(null);
  const [zone, setZone] = useState<string | null>(null);
  const [request, setRequest] = useState("");
  const [preserveText, setPreserveText] = useState("");
  const [confirming, setConfirming] = useState(false);

  const reset = () => {
    setAreaKey(null);
    setZone(null);
    setRequest("");
    setPreserveText("");
    setConfirming(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!concept) return null;

  const preview = areaKey && request ? analyzeTargetedEdit(request, areaKey, concept) : null;

  return (
    <Dialog open={open} onClose={handleClose} labelledBy={titleId} panelClassName="max-w-lg">
      <div className="p-6 sm:p-8">
        <h2 id={titleId} className="text-xl font-black text-slate-900 mb-1">
          Edit a specific part of this concept
        </h2>
        <p className="text-slate-500 text-sm mb-6">Select an area and zone, then describe the change. This is a simplified selection — not pixel-perfect architectural editing.</p>

        {!confirming ? (
          <>
            <p className="text-sm font-bold text-slate-700 mb-2">Which area?</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {concept.areasIncluded.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAreaKey(a)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${areaKey === a ? "bg-[#2ec440]/10 border-[#2ec440] text-[#2ec440]" : "bg-white border-slate-200 text-slate-600"}`}
                >
                  {RENOVATION_AREA_LABELS[a]}
                </button>
              ))}
            </div>

            <p className="text-sm font-bold text-slate-700 mb-2">Which zone within this area?</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {PREDEFINED_ZONES.map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setZone(z)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${zone === z ? "bg-[#2ec440]/10 border-[#2ec440] text-[#2ec440]" : "bg-white border-slate-200 text-slate-600"}`}
                >
                  {z}
                </button>
              ))}
              {zone && (
                <button type="button" onClick={() => setZone(null)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-700">
                  Clear selection
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {EXAMPLE_REQUESTS.map((s) => (
                <button key={s} type="button" onClick={() => setRequest(s)} className="text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full transition-colors">
                  {s}
                </button>
              ))}
            </div>
            <label htmlFor="targeted-request" className="block text-sm font-bold text-slate-700 mb-2">
              What would you like to change?
            </label>
            <textarea
              id="targeted-request"
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors resize-none mb-4"
            />
            <label htmlFor="targeted-preserve" className="block text-sm font-bold text-slate-700 mb-2">
              Elements to preserve <span className="text-slate-400 font-medium">(optional)</span>
            </label>
            <input
              id="targeted-preserve"
              value={preserveText}
              onChange={(e) => setPreserveText(e.target.value)}
              placeholder="e.g. window position, plumbing"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 transition-colors mb-6"
            />

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button type="button" onClick={handleClose} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button
                type="button"
                disabled={!areaKey || !zone || !request.trim()}
                onClick={() => setConfirming(true)}
                className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-[#2ec440] disabled:opacity-50 text-white font-bold transition-colors shadow-lg"
              >
                Preview Edit
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6 space-y-3 text-sm">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Selected area</p>
                <p className="text-slate-800 font-semibold">
                  {areaKey ? RENOVATION_AREA_LABELS[areaKey] : ""} — {zone}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Requested change</p>
                <p className="text-slate-800">{request}</p>
              </div>
              {preserveText && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Elements to preserve</p>
                  <p className="text-slate-800">{preserveText}</p>
                </div>
              )}
              {preview && (
                <>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Possible cost effect</p>
                    <p className="text-slate-700">{preview.possibleCostEffect}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Possible scope effect</p>
                    <p className="text-slate-700">{preview.possibleScopeEffect}</p>
                  </div>
                </>
              )}
              <p className="text-xs text-slate-500">This creates a new version — the current version is never overwritten.</p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button type="button" onClick={() => setConfirming(false)} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!areaKey) return;
                  RenovationProjectService.applyTargetedEdit(
                    projectId,
                    concept.id,
                    {
                      conceptId: concept.id,
                      areaKey,
                      selectionDescription: `${zone} in ${RENOVATION_AREA_LABELS[areaKey]}`,
                      requestedChange: request,
                      elementsToPreserve: preserveText ? preserveText.split(",").map((s) => s.trim()) : [],
                      possibleCostEffect: preview?.possibleCostEffect ?? "",
                      possibleScopeEffect: preview?.possibleScopeEffect ?? "",
                    },
                    {}
                  );
                  showToast("Targeted edit generated as a new version.");
                  handleClose();
                }}
                className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-[#2ec440] text-white font-bold transition-colors shadow-lg"
              >
                Generate Edit as New Version
              </button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
