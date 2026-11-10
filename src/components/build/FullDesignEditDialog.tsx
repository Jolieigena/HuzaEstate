"use client";

import { useId, useState } from "react";
import Dialog from "@/components/Dialog";

const SUGGESTED_REQUESTS = [
  "Change the roof to red tiles",
  "Make the house look more modern",
  "Use stone on the front wall",
  "Add a balcony upstairs",
  "Paint the walls light grey",
  "Add more garden and trees",
];

/** Asks what to change in the full design; the page makes the design again with that change. */
export default function FullDesignEditDialog({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (request: string) => void }) {
  const titleId = useId();
  const [request, setRequest] = useState("");

  const close = () => {
    setRequest("");
    onClose();
  };
  const submit = () => {
    const text = request.trim();
    if (!text) return;
    setRequest("");
    onSubmit(text);
  };

  return (
    <Dialog open={open} onClose={close} labelledBy={titleId} panelClassName="max-w-lg">
      <div className="p-6 sm:p-8">
        <h2 id={titleId} className="mb-6 text-xl font-black text-slate-900">
          Edit full design with AI
        </h2>
        <div className="mb-4 flex flex-wrap gap-2">
          {SUGGESTED_REQUESTS.map((s) => (
            <button key={s} type="button" onClick={() => setRequest(s)} className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100">
              {s}
            </button>
          ))}
        </div>
        <label htmlFor="full-design-request" className="mb-2 block text-sm font-bold text-slate-700">
          What would you like to change?
        </label>
        <textarea
          id="full-design-request"
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          rows={3}
          placeholder="e.g. Make the roof dark grey and add a covered terrace"
          className="mb-4 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 transition-colors focus:border-[#2ec440] focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20"
        />
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={close} className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50">
            Cancel
          </button>
          <button type="button" disabled={!request.trim()} onClick={submit} className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440] disabled:opacity-50">
            Change my design
          </button>
        </div>
      </div>
    </Dialog>
  );
}
