"use client";

import { ContractorQuotation } from "@/lib/renovate/types";
import { formatCompactRwf, formatDate } from "@/lib/renovate/format";
import { QuotationStatusBadge } from "./StatusBadge";

interface Props {
  quotation: ContractorQuotation;
  onAccept: () => void;
  onDecline: () => void;
}

export default function QuotationCard({ quotation, onAccept, onDecline }: Props) {
  const q = quotation;
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-slate-900">{q.contractor.companyName}</h3>
            {q.contractor.verified && <span className="text-[10px] font-bold bg-[#2ec440]/10 text-[#2ec440] px-1.5 py-0.5 rounded">Verified</span>}
            <QuotationStatusBadge status={q.status} />
          </div>
          <p className="text-sm text-slate-500">
            {q.contractor.location} · ★ {q.contractor.rating} · {q.contractor.completedProjects} completed projects
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Quoted {formatDate(q.quotationDate)} · Valid until {formatDate(q.validUntil)}
          </p>
        </div>
        <p className="text-2xl font-black text-slate-900">{formatCompactRwf(q.total)}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Included scope</p>
          <ul className="list-disc list-inside text-slate-600 space-y-0.5">
            {q.includedScope.slice(0, 5).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Excluded scope</p>
          {q.excludedScope.length === 0 ? (
            <p className="text-slate-400">Nothing excluded</p>
          ) : (
            <ul className="list-disc list-inside text-amber-700 space-y-0.5">
              {q.excludedScope.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-slate-400 text-xs font-bold">Labour</p>
          <p className="font-bold text-slate-900">{formatCompactRwf(q.labour)}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-slate-400 text-xs font-bold">Professional fees</p>
          <p className="font-bold text-slate-900">{formatCompactRwf(q.professionalFees)}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-slate-400 text-xs font-bold">Taxes</p>
          <p className="font-bold text-slate-900">{formatCompactRwf(q.taxes)}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-slate-400 text-xs font-bold">Duration</p>
          <p className="font-bold text-slate-900">{q.proposedDurationWeeks} weeks</p>
        </div>
      </div>

      <div className="text-sm text-slate-600 space-y-1 mb-4">
        <p>
          <span className="font-bold text-slate-800">Payment schedule: </span>
          {q.paymentSchedule}
        </p>
        <p>
          <span className="font-bold text-slate-800">Warranty: </span>
          {q.warrantyInfo}
        </p>
      </div>

      {q.assumptions.length > 0 && (
        <div className="bg-slate-50 rounded-xl p-3 mb-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Assumptions</p>
          <ul className="list-disc list-inside text-xs text-slate-600 space-y-0.5">
            {q.assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {q.status !== "accepted" && q.status !== "declined" && q.status !== "withdrawn" && (
        <div className="flex gap-2">
          <button type="button" onClick={onAccept} className="bg-[#2ec440]/10 hover:bg-[#2ec440]/20 text-[#2ec440] font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">
            Accept Quotation
          </button>
          <button type="button" onClick={onDecline} className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors">
            Decline
          </button>
        </div>
      )}
    </div>
  );
}
