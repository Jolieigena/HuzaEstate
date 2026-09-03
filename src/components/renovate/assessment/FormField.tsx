"use client";

import { ReactNode, useId } from "react";

interface FormFieldProps {
  label: string;
  optional?: boolean;
  error?: string;
  children: (id: string) => ReactNode;
  hint?: string;
}

export function FormField({ label, optional, error, children, hint }: FormFieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold text-slate-700 mb-1.5">
        {label} {optional && <span className="text-slate-400 font-medium">(optional)</span>}
      </label>
      {children(id)}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      {error && (
        <p className="text-red-600 text-sm font-semibold mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors text-sm";
export const inputErrorClass = "w-full px-4 py-2.5 rounded-xl border border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200 transition-colors text-sm";

export function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-colors ${
        selected ? "bg-[#2ec440]/10 border-[#2ec440] text-[#2ec440]" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
      }`}
    >
      {children}
    </button>
  );
}
