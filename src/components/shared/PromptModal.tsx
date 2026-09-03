"use client";

import { useId, useState, FormEvent } from "react";
import Dialog from "@/components/Dialog";

interface PromptModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  description?: string;
  label: string;
  initialValue?: string;
  submitLabel?: string;
  placeholder?: string;
  required?: boolean;
}

/** Generic single-field text modal shared by rename flows across modules. */
export default function PromptModal({ open, onClose, onSubmit, title, description, label, initialValue = "", submitLabel = "Save", placeholder, required = true }: PromptModalProps) {
  const titleId = useId();
  const inputId = useId();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState("");
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setValue(initialValue);
      setError("");
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (required && !value.trim()) {
      setError("This field is required.");
      return;
    }
    onSubmit(value.trim());
  };

  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} panelClassName="max-w-md">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        <h2 id={titleId} className="text-xl font-black text-slate-900 mb-2">
          {title}
        </h2>
        {description && <p className="text-slate-500 text-sm leading-relaxed mb-5">{description}</p>}

        <label htmlFor={inputId} className="block text-sm font-bold text-slate-700 mb-2">
          {label}
        </label>
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError("");
          }}
          placeholder={placeholder}
          autoFocus
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors ${error ? "border-red-300" : "border-slate-200"}`}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-red-600 text-sm font-semibold mt-2">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" className="px-5 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-[#2ec440] transition-colors shadow-lg">
            {submitLabel}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
