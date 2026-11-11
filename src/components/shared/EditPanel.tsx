"use client";

import { useState } from "react";
import SidePane from "@/components/shared/SidePane";

/**
 * "Edit design" as a pane on the right, not a dialog: the design stays in view and can be scrolled and looked at while the person
 * says what to change. On a phone it is a sheet at the bottom. It stays open after a change, so one change can follow another.
 * `onSubmit` makes the change and returns an error to show, or nothing when it worked.
 */
export default function EditPanel({
  open,
  onClose,
  title = "Edit design",
  suggestions,
  placeholder,
  submitLabel = "Change my design",
  workingLabel = "Changing your design…",
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  suggestions: string[];
  placeholder: string;
  submitLabel?: string;
  workingLabel?: string;
  onSubmit: (request: string) => Promise<string | null>;
}) {
  const [request, setRequest] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<string[]>([]);

  if (!open) return null;

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
    setDone((list) => [text, ...list].slice(0, 6));
    setRequest("");
  };

  return (
    <SidePane open={open} onClose={onClose} title={title}>
      <div className="mb-4 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button key={s} type="button" disabled={working} onClick={() => setRequest(s)} className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50">
            {s}
          </button>
        ))}
      </div>
      <label htmlFor="edit-panel-request" className="mb-2 block text-sm font-bold text-slate-700">
        What would you like to change?
      </label>
      <textarea
        id="edit-panel-request"
        value={request}
        onChange={(e) => setRequest(e.target.value)}
        disabled={working}
        rows={4}
        placeholder={placeholder}
        className="mb-4 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 transition-colors focus:border-[#2ec440] focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 disabled:bg-slate-50"
      />
      {error && <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
      <button type="button" disabled={!request.trim() || working} onClick={submit} className="w-full rounded-xl bg-slate-900 px-5 py-3 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440] disabled:opacity-50">
        {working ? workingLabel : submitLabel}
      </button>

      {done.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Changes made</p>
          <ul className="space-y-1.5">
            {done.map((item, index) => (
              <li key={`${item}-${index}`} className="flex items-start gap-2 text-sm text-slate-600">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#2ec440]" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </SidePane>
  );
}
