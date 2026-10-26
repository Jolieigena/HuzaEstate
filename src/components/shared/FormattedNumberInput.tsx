"use client";

import { useLayoutEffect, useRef } from "react";

interface FormattedNumberInputProps {
  /** The plain number as typed, without commas ("1250000.5"), so callers can keep using Number(value). */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
  className?: string;
  maxDecimals?: number;
  disabled?: boolean;
  "aria-label"?: string;
}

/** Keeps only digits and one decimal point. */
function clean(text: string, maxDecimals: number): string {
  let out = "";
  let seenDot = false;
  let decimals = 0;
  for (const ch of text) {
    if (ch >= "0" && ch <= "9") {
      if (seenDot) {
        if (decimals >= maxDecimals) continue;
        decimals += 1;
      }
      out += ch;
    } else if (ch === "." && !seenDot && maxDecimals > 0) {
      seenDot = true;
      out += ch;
    }
  }
  // "007" is typed as 7; "0.5" keeps its zero.
  return out.replace(/^0+(?=\d)/, "");
}

/** "1250000.5" -> "1,250,000.5" */
export function withCommas(raw: string): string {
  const [whole, fraction] = raw.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}

/** A number field that shows commas after every three digits while the person types (1,250,000) and hands back the plain number. */
export default function FormattedNumberInput({ value, onChange, placeholder, required, id, className, maxDecimals = 2, disabled, ...rest }: FormattedNumberInputProps) {
  const ref = useRef<HTMLInputElement>(null);
  // How many digits sit before the caret, so it stays put after the commas are redrawn.
  const caretDigits = useRef<number | null>(null);

  useLayoutEffect(() => {
    const input = ref.current;
    const digits = caretDigits.current;
    caretDigits.current = null;
    if (!input || digits === null || document.activeElement !== input) return;
    let seen = 0;
    let position = input.value.length;
    if (digits === 0) position = 0;
    else {
      for (let i = 0; i < input.value.length; i++) {
        if (/[0-9.]/.test(input.value[i])) seen += 1;
        if (seen === digits) {
          position = i + 1;
          break;
        }
      }
    }
    input.setSelectionRange(position, position);
  });

  return (
    <input
      ref={ref}
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={withCommas(value)}
      onChange={(e) => {
        const typed = e.target.value;
        const caret = e.target.selectionStart ?? typed.length;
        caretDigits.current = (typed.slice(0, caret).match(/[0-9.]/g) ?? []).length;
        onChange(clean(typed, maxDecimals));
      }}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={className}
      aria-label={rest["aria-label"]}
    />
  );
}
