"use client";

import { useId, useState } from "react";
import Dialog from "@/components/Dialog";
import { ContractorQuotation } from "@/lib/renovate/types";
import { formatCompactRwf, formatDate } from "@/lib/renovate/format";

interface Props {
  quotation: ContractorQuotation | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function AcceptQuotationModal({ quotation, open, onClose, onConfirm }: Props) {
  const titleId = useId();
  const [confirmed, setConfirmed] = useState(false);

  const handleClose = () => {
    setConfirmed(false);
    onClose();
  };

  if (!quotation) return null;

  return (
    <Dialog open={open} onClose={handleClose} labelledBy={titleId} panelClassName="max-w-lg">
      <div className="p-6 sm:p-8">
        <h2 id={titleId} className="text-xl font-black text-slate-900 mb-1">
          Accept this quotation?
        </h2>
        <p className="text-slate-500 text-sm mb-6">Review the details before accepting.</p>

        <dl className="bg-slate-50 border border-slate-200 rounded-2xl p-5 grid grid-cols-2 gap-y-3 text-sm mb-4">
          <dt className="text-slate-500">Contractor</dt>
          <dd className="text-right font-semibold text-slate-900">{quotation.contractor.companyName}</dd>
          <dt className="text-slate-500">Total</dt>
          <dd className="text-right font-semibold text-slate-900">{formatCompactRwf(quotation.total)}</dd>
          <dt className="text-slate-500">Included scope</dt>
          <dd className="text-right font-semibold text-slate-900">{quotation.includedScope.length} items</dd>
          <dt className="text-slate-500">Exclusions</dt>
          <dd className="text-right font-semibold text-slate-900">{quotation.excludedScope.length || "None"}</dd>
          <dt className="text-slate-500">Payment schedule</dt>
          <dd className="text-right font-semibold text-slate-900">{quotation.paymentSchedule}</dd>
          <dt className="text-slate-500">Valid until</dt>
          <dd className="text-right font-semibold text-slate-900">{formatDate(quotation.validUntil)}</dd>
        </dl>

        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-4">
          <p className="text-sm font-semibold text-purple-800">Structural, electrical, plumbing and permit-related work should still be professionally reviewed before execution begins.</p>
        </div>

        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="w-5 h-5 mt-0.5 rounded accent-[#2ec440] flex-shrink-0" />
          <span className="text-sm text-slate-700 leading-relaxed">
            I understand this is a prototype acceptance. No payment is processed and no legally binding contract is created.
          </span>
        </label>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button type="button" onClick={handleClose} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            disabled={!confirmed}
            onClick={onConfirm}
            className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-[#2ec440] disabled:opacity-50 text-white font-bold transition-colors shadow-lg"
          >
            Accept Quotation
          </button>
        </div>
      </div>
    </Dialog>
  );
}
