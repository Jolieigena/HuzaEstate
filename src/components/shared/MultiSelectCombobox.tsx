"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export interface ComboboxGroup {
  label: string;
  options: string[];
}

interface MultiSelectComboboxProps {
  /** The chosen values, in the order they were picked. */
  value: string[];
  onChange: (next: string[]) => void;
  groups: ComboboxGroup[];
  placeholder?: string;
  /** Most values that can be chosen; once reached, the list says so instead of offering more. */
  max?: number;
  /** Lets the person add a value that isn't in `groups` (offered as "Add "…"" while searching). */
  allowCustom?: boolean;
  /** Longest custom value accepted. */
  maxLength?: number;
  ariaLabel?: string;
}

type Row = { kind: "option"; value: string; group: string } | { kind: "custom"; value: string };

/** A searchable, grouped multi-select. Chosen values show as removable chips inside the field;
 *  typing filters the list, Arrow keys move, Enter picks, Backspace on an empty search removes the
 *  last chip, Escape closes. The menu stays open while picking so several can be chosen in a row. */
export default function MultiSelectCombobox({ value, onChange, groups, placeholder = "Search…", max, allowCustom = true, maxLength = 80, ariaLabel }: MultiSelectComboboxProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const selected = useMemo(() => new Set(value.map((v) => v.toLowerCase())), [value]);
  const atLimit = max !== undefined && value.length >= max;
  const trimmed = query.trim();

  const { rows, groupedRows } = useMemo(() => {
    const q = trimmed.toLowerCase();
    const rows: Row[] = [];
    const groupedRows: { label: string; rows: { row: Row; index: number }[] }[] = [];
    for (const group of groups) {
      const matches = group.options.filter((o) => !selected.has(o.toLowerCase()) && (!q || o.toLowerCase().includes(q) || group.label.toLowerCase().includes(q)));
      if (!matches.length) continue;
      const entries = matches.map((o) => {
        const row: Row = { kind: "option", value: o, group: group.label };
        rows.push(row);
        return { row, index: rows.length - 1 };
      });
      groupedRows.push({ label: group.label, rows: entries });
    }
    const known = groups.some((g) => g.options.some((o) => o.toLowerCase() === trimmed.toLowerCase()));
    if (allowCustom && trimmed && !known && !selected.has(trimmed.toLowerCase())) {
      const row: Row = { kind: "custom", value: trimmed.slice(0, maxLength) };
      rows.push(row);
      groupedRows.push({ label: "Not in the list?", rows: [{ row, index: rows.length - 1 }] });
    }
    return { rows, groupedRows };
  }, [groups, selected, trimmed, allowCustom, maxLength]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const add = (item: string) => {
    if (atLimit || selected.has(item.toLowerCase())) return;
    onChange([...value, item]);
    setQuery("");
    setActive(0);
    inputRef.current?.focus();
  };
  const remove = (item: string) => onChange(value.filter((v) => v !== item));

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (rows.length ? (i + 1) % rows.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (rows.length ? (i - 1 + rows.length) % rows.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = rows[Math.min(active, rows.length - 1)];
      if (open && row) add(row.value);
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Backspace" && !query && value.length) {
      remove(value[value.length - 1]);
    }
  };

  const activeId = open && rows.length ? `${listId}-${Math.min(active, rows.length - 1)}` : undefined;

  return (
    <div ref={rootRef} className="relative">
      <div
        className={`flex min-h-[46px] w-full cursor-text flex-wrap items-center gap-1.5 rounded-xl border bg-white px-2.5 py-2 transition ${open ? "border-[#2ec440] ring-2 ring-[#2ec440]/15" : "border-slate-200"}`}
        onClick={() => {
          inputRef.current?.focus();
          setOpen(true);
        }}
      >
        {value.map((item) => (
          <span key={item} className="inline-flex items-center gap-1 rounded-full bg-slate-900 py-1 pl-3 pr-1.5 text-xs font-bold text-white">
            {item}
            <button
              type="button"
              aria-label={`Remove ${item}`}
              onClick={(e) => {
                e.stopPropagation();
                remove(item);
              }}
              className="flex h-4 w-4 items-center justify-center rounded-full text-white/70 hover:bg-white/20 hover:text-white"
            >
              &times;
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          aria-label={ariaLabel}
          value={query}
          maxLength={maxLength}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={value.length ? "" : placeholder}
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
        <svg className={`ml-auto h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {open && (
        <div id={listId} role="listbox" aria-multiselectable="true" className="absolute left-0 right-0 z-30 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          {atLimit ? (
            <p className="px-4 py-3 text-sm font-semibold text-slate-500">You&apos;ve chosen the maximum of {max}. Remove one to add another.</p>
          ) : rows.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">{trimmed ? "No matches." : "Everything is already chosen."}</p>
          ) : (
            groupedRows.map((group) => (
              <div key={group.label} role="group" aria-label={group.label}>
                <p className="sticky top-0 bg-white px-4 pb-1 pt-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">{group.label}</p>
                {group.rows.map(({ row, index }) => (
                  <div
                    key={row.value}
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={false}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => add(row.value)}
                    onMouseEnter={() => setActive(index)}
                    className={`cursor-pointer px-4 py-2 text-sm ${index === Math.min(active, rows.length - 1) ? "bg-[#2ec440]/10 text-[#219b31]" : "text-slate-700"}`}
                  >
                    {row.kind === "custom" ? (
                      <>
                        Add <span className="font-bold">&ldquo;{row.value}&rdquo;</span>
                      </>
                    ) : (
                      row.value
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
