"use client";

import { useId, useState } from "react";
import Dialog from "@/components/Dialog";

const SUGGESTED_REQUESTS = [
  "Make the room brighter",
  "Use lighter colours on the walls",
  "Change the floor to timber",
  "Add more plants",
  "Add built-in storage",
  "Make it feel warmer",
];

/** Asks what to change in the redesign. `onSubmit` makes the change and returns an error to show, or nothing when it worked. */
export default function EditDesignDialog({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (request: string) => Promise<string | null> }) {
  const titleId = useId();
  const [request, setRequest] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    if (working) return;
    setRequest("");
    setError("");
    onClose();
  };
  const submit = async () => {
    const text = request.trim();
    if (!text || working) return;
    setWorking(true);
    setError("");
    const problem = await onSubmit(text);
    setWorking(false);
    if (problem) {
      setError(problem);
      return;
    }
    setRequest("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={close} labelledBy={titleId} panelClassName="max-w-lg">
      <div className="p-6 sm:p-8">
        <h2 id={titleId} className="mb-6 text-xl font-black text-slate-900">
          Edit with AI
        </h2>
        <div className="mb-4 flex flex-wrap gap-2">
          {SUGGESTED_REQUESTS.map((s) => (
            <button key={s} type="button" disabled={working} onClick={() => setRequest(s)} className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50">
              {s}
            </button>
          ))}
        </div>
        <label htmlFor="renovate-edit-request" className="mb-2 block text-sm font-bold text-slate-700">
          What would you like to change?
        </label>
        <textarea
          id="renovate-edit-request"
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          disabled={working}
          rows={3}
          placeholder="e.g. Paint the walls light grey and add a green sofa"
          className="mb-4 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 transition-colors focus:border-[#2ec440] focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 disabled:bg-slate-50"
        />
        {error && <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={close} disabled={working} className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50">
            Cancel
          </button>
          <button type="button" disabled={!request.trim() || working} onClick={submit} className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440] disabled:opacity-50">
            {working ? "Changing your design…" : "Change my design"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
