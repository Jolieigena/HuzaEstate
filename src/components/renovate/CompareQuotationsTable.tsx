"use client";

import { ContractorQuotation } from "@/lib/renovate/types";
import { formatCompactRwf, formatDate } from "@/lib/renovate/format";
import { RenovationQuotationService } from "@/lib/renovate/quotationService";

export default function CompareQuotationsTable({ quotations, onAccept }: { quotations: ContractorQuotation[]; onAccept: (id: string) => void }) {
  const highlights = RenovationQuotationService.compareQuotations(quotations);

  const rows: { label: string; render: (q: ContractorQuotation) => React.ReactNode }[] = [
    { label: "Total price", render: (q) => formatCompactRwf(q.total) },
    { label: "Included work", render: (q) => `${q.includedScope.length} item${q.includedScope.length === 1 ? "" : "s"}` },
    { label: "Exclusions", render: (q) => (q.excludedScope.length ? q.excludedScope.join(", ") : "None") },
    { label: "Duration", render: (q) => `${q.proposedDurationWeeks} weeks` },
    { label: "Payment schedule", render: (q) => q.paymentSchedule },
    { label: "Warranty", render: (q) => q.warrantyInfo },
    { label: "Materials", render: (q) => q.materials.map((m) => m.label).join(", ") },
    { label: "Contractor rating", render: (q) => `★ ${q.contractor.rating}` },
    { label: "Verification", render: (q) => (q.contractor.verified ? "Verified" : "Not verified") },
    { label: "Earliest start", render: (q) => formatDate(q.quotationDate) },
  ];

  if (quotations.length === 0) return null;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-x-auto">
      {quotations.some((q) => q.excludedScope.length > 0) && (
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-3">
          <p className="text-sm text-amber-800 font-semibold">One or more quotations exclude significant work — review exclusions carefully before deciding.</p>
        </div>
      )}
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="sticky left-0 bg-white text-left p-4 font-bold text-slate-400 w-40">Category</th>
            {quotations.map((q) => (
              <th key={q.id} className="p-4 text-left min-w-[200px]">
                <p className="font-bold text-slate-900">{q.contractor.companyName}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {highlights?.lowestCostId === q.id && <span className="text-[10px] font-bold bg-[#2ec440]/10 text-[#2ec440] px-2 py-0.5 rounded-full">Lowest price</span>}
                  {highlights?.shortestDurationId === q.id && <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Shortest duration</span>}
                  {highlights?.highestRatedId === q.id && <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Highest rated</span>}
                  {highlights?.mostCompleteId === q.id && <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Most complete scope</span>}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-slate-50 last:border-b-0 align-top">
              <td className="sticky left-0 bg-white p-4 font-bold text-slate-500 text-xs uppercase tracking-wide">{row.label}</td>
              {quotations.map((q) => (
                <td key={q.id} className="p-4 text-slate-700">
                  {row.render(q)}
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <td className="sticky left-0 bg-white p-4" />
            {quotations.map((q) => (
              <td key={q.id} className="p-4">
                {q.status !== "accepted" && q.status !== "declined" && q.status !== "withdrawn" ? (
                  <button type="button" onClick={() => onAccept(q.id)} className="text-sm font-bold bg-[#2ec440]/10 hover:bg-[#2ec440]/20 text-[#2ec440] py-2 px-4 rounded-xl transition-colors">
                    Accept
                  </button>
                ) : (
                  <span className="text-xs font-bold text-slate-400 capitalize">{q.status}</span>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <p className="px-5 pb-4 text-xs text-slate-400 italic">No single quotation is highlighted as universally best — weigh price, scope, timeline and contractor track record together.</p>
    </div>
  );
}
