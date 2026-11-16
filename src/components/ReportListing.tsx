"use client";

import { useState } from "react";

/** Where reports are sent. */
export const REPORT_EMAIL = "info@huzalabs.com";

const REASONS = [
  "Scam or fraud",
  "Fake or misleading listing",
  "Property no longer available",
  "Wrong price or details",
  "Offensive or inappropriate content",
  "Harassment or abusive behaviour",
  "Other",
];

/** "Report this listing": lets anyone flag a listing (or its poster) that is fraudulent, misleading or offensive. It opens a
 *  ready-to-send email to the HuzaEstate team with the listing, the reason and the details filled in, so it works the same on
 *  the website and in the mobile app, signed in or not. The team answers reports within 24 hours. */
export default function ReportListing({ propertyId, title }: { propertyId: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");

  function send(e: React.FormEvent) {
    e.preventDefault();
    const link = typeof window !== "undefined" ? `${window.location.origin}/properties/${encodeURIComponent(propertyId)}` : `/properties/${propertyId}`;
    const subject = `Report: ${reason} - ${title}`.slice(0, 150);
    const body = `Listing: ${title}\nLink: ${link}\nReason: ${reason}\n\nDetails:\n${details.trim()}\n`;
    window.location.href = `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setOpen(false);
    setDetails("");
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-red-600 transition-colors">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21V5m0 0h13l-2 4 2 4H3" /></svg>
        Report this listing
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" aria-label="Report this listing" onClick={() => setOpen(false)}>
          <form onSubmit={send} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">Report this listing</h2>
            <p className="mt-1 text-sm text-slate-500">Tell us what is wrong with &ldquo;{title}&rdquo;. Our team reviews every report within 24 hours and removes listings or accounts that break our rules.</p>

            <label className="mt-5 block text-sm font-bold text-slate-700" htmlFor="report-reason">Reason</label>
            <select id="report-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#2ec440] focus:ring-4 focus:ring-[#2ec440]/10">
              {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>

            <label className="mt-4 block text-sm font-bold text-slate-700" htmlFor="report-details">Details</label>
            <textarea id="report-details" required rows={4} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="What happened?" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#2ec440] focus:ring-4 focus:ring-[#2ec440]/10" />

            <p className="mt-3 text-xs text-slate-400">Pressing Send opens an email to {REPORT_EMAIL} with these details. Press send in your email app to finish.</p>

            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="flex-1 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-red-600 transition-colors">Send report</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
