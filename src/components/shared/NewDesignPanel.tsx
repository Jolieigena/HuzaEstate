"use client";

import Link from "next/link";
import SidePane from "@/components/shared/SidePane";

/** "New design" as a pane on the right: what the design will be made from, and the button to make it. */
export default function NewDesignPanel({
  open,
  onClose,
  rows,
  warnings = [],
  briefHref,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  rows: [string, string][];
  warnings?: string[];
  briefHref: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  return (
    <SidePane open={open} onClose={onClose} title="New design">
      <dl className="mb-4 grid grid-cols-2 gap-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="col-span-2 grid grid-cols-2 gap-x-3">
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-right font-semibold text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>

      {warnings.length > 0 && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <ul className="space-y-1">
            {warnings.slice(0, 3).map((w) => (
              <li key={w} className="text-xs text-amber-700">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button type="button" onClick={onConfirm} className="w-full rounded-xl bg-slate-900 px-5 py-3 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
          {confirmLabel}
        </button>
        <Link href={briefHref} className="w-full rounded-xl border border-slate-200 px-5 py-3 text-center font-semibold text-slate-700 transition-colors hover:bg-slate-50">
          Return to the brief
        </Link>
      </div>
    </SidePane>
  );
}
