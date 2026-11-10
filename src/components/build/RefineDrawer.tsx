"use client";

import { useId, useState } from "react";
import Dialog from "@/components/Dialog";
import { Concept } from "@/lib/build/types";
import { BuildProjectService } from "@/lib/build/projectService";
import { useBuildProjectContext } from "@/components/build/BuildProjectContext";
import { designWithAi } from "@/lib/build/aiApi";
import { conceptFromAiFloors } from "@/lib/build/conceptGenerator";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";

const SUGGESTED_REQUESTS = [
  "Make the kitchen larger",
  "Move the guest bedroom downstairs",
  "Add a home office",
  "Add a bathroom upstairs",
  "Make the living room bigger",
  "Reduce the number of rooms to cut the cost",
];

export default function RefineDrawer({ projectId, concept, open, onClose }: { projectId: string; concept: Concept | null; open: boolean; onClose: () => void }) {
  const { showToast } = useToast();
  const { token } = useAuth();
  const project = useBuildProjectContext();
  const titleId = useId();
  const [request, setRequest] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    if (working) return;
    setRequest("");
    setError("");
    onClose();
  };

  if (!concept) return null;

  const apply = async () => {
    if (!token || !request.trim()) return;
    setWorking(true);
    setError("");
    const outcome = await designWithAi(token, project.brief, { request: request.trim(), floors: concept.floors });
    setWorking(false);
    if (!outcome.ok) {
      setError(outcome.error);
      return;
    }
    // The figures (area, rooms, budget) are worked out again from the new plan.
    const { metrics } = conceptFromAiFloors(project.brief, outcome.floors);
    BuildProjectService.refineConcept(projectId, concept.id, request.trim(), `Changed with AI: "${request.trim()}"`, { ...metrics, sustainabilityScore: concept.metrics.sustainabilityScore, efficiencyScore: concept.metrics.efficiencyScore }, outcome.floors);
    showToast("Your design was changed. It is saved as a new version.");
    setRequest("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} labelledBy={titleId} panelClassName="max-w-lg">
      <div className="p-6 sm:p-8">
        <h2 id={titleId} className="text-xl font-black text-slate-900 mb-6">
          Edit with AI
        </h2>

        <div className="flex flex-wrap gap-2 mb-4">
          {SUGGESTED_REQUESTS.map((s) => (
            <button key={s} type="button" disabled={working} onClick={() => setRequest(s)} className="text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50">
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
          disabled={working}
          rows={3}
          placeholder="e.g. Make the kitchen larger and add a home office"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors resize-none mb-4 disabled:bg-slate-50"
        />
        {error && <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 mb-4">{error}</p>}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button type="button" onClick={handleClose} disabled={working} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button type="button" disabled={!request.trim() || working} onClick={apply} className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-[#2ec440] disabled:opacity-50 text-white font-bold transition-colors shadow-lg">
            {working ? "Changing your design…" : "Change my design"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
