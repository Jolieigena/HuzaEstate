"use client";

import { useId, useState } from "react";
import Dialog from "@/components/Dialog";
import { toMinor } from "@/lib/finance/money";
import { INVOICE_TYPE_LABELS, type Currency, type InvoiceType } from "@/lib/finance/types";
import { PrimaryButton, SecondaryButton, fieldClass, labelClass } from "../ui";

export interface NewLineItemDraft {
  description: string;
  quantity: number;
  unit: string;
  unitPriceMajor: number;
}

export interface InvoiceTargetOption {
  key: string;
  label: string;
  recipientId: string;
  currency: Currency;
  executionProjectId?: string;
  contractId?: string;
  milestoneId?: string;
}

interface Props {
  open: boolean;
  currency: Currency;
  defaultInvoiceType?: InvoiceType;
  contextLabel: string;
  targetOptions?: InvoiceTargetOption[];
  onClose: () => void;
  onCreate: (input: { invoiceType: InvoiceType; dueDate: string; notes: string; lineItems: NewLineItemDraft[]; target?: InvoiceTargetOption }) => void | Promise<void>;
}

const EMPTY_LINE: NewLineItemDraft = { description: "", quantity: 1, unit: "service", unitPriceMajor: 0 };
const STANDALONE_KEY = "__standalone__";

export default function CreateInvoiceModal({ open, currency, defaultInvoiceType = "milestone", contextLabel, targetOptions, onClose, onCreate }: Props) {
  const titleId = useId();
  const [invoiceType, setInvoiceType] = useState<InvoiceType>(defaultInvoiceType);
  const [targetKey, setTargetKey] = useState(STANDALONE_KEY);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<NewLineItemDraft[]>([{ ...EMPTY_LINE }]);
  const [busy, setBusy] = useState(false);

  const total = lines.reduce((sum, l) => sum + toMinor(l.unitPriceMajor * l.quantity, currency), 0);
  const isValid = dueDate.length > 0 && lines.every((l) => l.description.trim().length > 0 && l.unitPriceMajor > 0 && l.quantity > 0);

  const reset = () => {
    setLines([{ ...EMPTY_LINE }]);
    setNotes("");
    setDueDate("");
  };

  return (
    <Dialog open={open} onClose={() => { reset(); onClose(); }} labelledBy={titleId} panelClassName="max-w-2xl">
      <div className="p-6 sm:p-8">
        <h2 id={titleId} className="mb-1 text-xl font-black text-slate-900">
          Create invoice
        </h2>
        <p className="mb-5 text-sm text-slate-500">{contextLabel}</p>

        {targetOptions && targetOptions.length > 0 && (
          <div className="mb-4">
            <label htmlFor="invoice-target" className={labelClass}>
              Bill to
            </label>
            <select id="invoice-target" value={targetKey} onChange={(e) => setTargetKey(e.target.value)} className={fieldClass}>
              <option value={STANDALONE_KEY}>Standalone service invoice</option>
              {targetOptions.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="invoice-type" className={labelClass}>
              Invoice type
            </label>
            <select id="invoice-type" value={invoiceType} onChange={(e) => setInvoiceType(e.target.value as InvoiceType)} className={fieldClass}>
              {Object.entries(INVOICE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="due-date" className={labelClass}>
              Due date
            </label>
            <input id="due-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={fieldClass} />
          </div>
        </div>

        <div className={labelClass}>Line items</div>
        <div className="space-y-3">
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_80px_90px_120px_auto]">
              <input aria-label="Description" placeholder="Description" value={line.description} onChange={(e) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, description: e.target.value } : l)))} className={fieldClass} />
              <input aria-label="Quantity" type="number" min={1} value={line.quantity} onChange={(e) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, quantity: Number(e.target.value) } : l)))} className={fieldClass} />
              <input aria-label="Unit" placeholder="Unit" value={line.unit} onChange={(e) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, unit: e.target.value } : l)))} className={fieldClass} />
              <input aria-label="Unit price" type="number" min={0} placeholder={`Price (${currency})`} value={line.unitPriceMajor || ""} onChange={(e) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, unitPriceMajor: Number(e.target.value) } : l)))} className={fieldClass} />
              <button type="button" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} disabled={lines.length === 1} className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-500 hover:text-red-600 disabled:opacity-30">
                Remove
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setLines((ls) => [...ls, { ...EMPTY_LINE }])} className="mt-2 text-sm font-bold text-[#219b31] hover:underline">
          + Add line item
        </button>

        <div className="mt-4">
          <label htmlFor="invoice-notes" className={labelClass}>
            Notes
          </label>
          <textarea id="invoice-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={fieldClass} />
        </div>

        <p className="mt-4 text-right text-sm font-black text-slate-900">Total: {(total / (currency === "USD" ? 100 : 1)).toLocaleString()} {currency}</p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <SecondaryButton type="button" onClick={() => { reset(); onClose(); }}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            type="button"
            disabled={!isValid || busy}
            onClick={async () => {
              setBusy(true);
              const target = targetOptions?.find((t) => t.key === targetKey);
              await onCreate({ invoiceType, dueDate: new Date(dueDate).toISOString(), notes, lineItems: lines, target });
              setBusy(false);
              reset();
            }}
          >
            {busy ? "Creating…" : "Save Draft Invoice"}
          </PrimaryButton>
        </div>
      </div>
    </Dialog>
  );
}
