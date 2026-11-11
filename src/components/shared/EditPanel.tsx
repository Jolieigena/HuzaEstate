"use client";

import { useEffect, useId, useState } from "react";

/**
 * "Edit with AI" as a pane on the right, not a dialog: the design stays in view and can be scrolled and looked at while the person
 * says what to change. On a phone it is a sheet at the bottom. It stays open after a change, so one change can follow another.
 * `onSubmit` makes the change and returns an error to show, or nothing when it worked.
 */
export default function EditPanel({
  open,
  onClose,
  title = "Edit with AI",
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
  const titleId = useId();
  const [request, setRequest] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<string[]>([]);

  // While the pane is open the page makes room for it (see globals.css) instead of being covered.
  useEffect(() => {
    if (!open) return;
    document.documentElement.dataset.sidePanel = "open";
    return () => {
      delete document.documentElement.dataset.sidePanel;
    };
  }, [open]);

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
    <aside
      role="complementary"
      aria-labelledby={titleId}
      className="fixed inset-x-0 bottom-0 z-40 flex max-h-[75vh] flex-col rounded-t-2xl border border-slate-200 bg-white shadow-2xl lg:inset-x-auto lg:bottom-0 lg:right-0 lg:top-20 lg:max-h-none lg:w-[380px] lg:rounded-none lg:border-y-0 lg:border-r-0 lg:shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 id={titleId} className="text-lg font-black text-slate-900">
          {title}
        </h2>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
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
      </div>
    </aside>
  );
}
