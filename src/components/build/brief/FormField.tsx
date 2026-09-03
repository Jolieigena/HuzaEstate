"use client";

import { ReactNode } from "react";

export function Field({ label, htmlFor, required, error, helper, children }: { label: string; htmlFor: string; required?: boolean; error?: string; helper?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-bold text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {helper && <p className="text-xs text-slate-400 mb-2">{helper}</p>}
      {children}
      {error && (
        <p className="text-red-600 text-xs font-semibold mt-1.5" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export const inputClass = (hasError?: boolean) =>
  `w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors ${
    hasError ? "border-red-300" : "border-slate-200"
  }`;

export function Toggle({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-colors ${
        pressed ? "bg-[#2ec440]/10 border-[#2ec440] text-[#2ec440]" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
      }`}
    >
      {children}
    </button>
  );
}
