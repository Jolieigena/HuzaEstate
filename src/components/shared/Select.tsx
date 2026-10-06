"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ChangeEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { parseSelectChildren, type SelectOption } from "./selectOptions";

// The browser draws a native <select>'s menu itself, so it can't be styled and looks different on every
// system. This is a drop-in replacement: it takes the same <option> / <optgroup> children, the same
// value / onChange / className / disabled / required props, and reports changes through an event that
// carries target.value, so a <select> becomes a <Select> with nothing else rewritten.

const CHEVRON = "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M6 9l6 6 6-6'/%3e%3c/svg%3e\")";
const MAX_LIST_HEIGHT = 288;
const SEARCH_FROM_OPTIONS = 10;

interface SelectProps {
  value?: string | number | readonly string[];
  defaultValue?: string | number;
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: () => void;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  title?: string;
  autoFocus?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

function Check() {
  return (
    <svg className="h-4 w-4 shrink-0 text-[#219b31]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function Select({ value, defaultValue, onChange, onBlur, children, className = "", style, id, name, disabled, required, title, autoFocus, ...aria }: SelectProps) {
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const typeAhead = useRef({ text: "", timer: 0 as unknown as ReturnType<typeof setTimeout> });

  const options = useMemo(() => parseSelectChildren(children), [children]);
  const [internal, setInternal] = useState<string>(defaultValue === undefined ? "" : String(defaultValue));
  const current = value !== undefined ? (Array.isArray(value) ? String(value[0] ?? "") : String(value)) : internal;
  const selected = options.find((o) => o.value === current);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState<CSSProperties | null>(null);

  const searchable = options.length > SEARCH_FROM_OPTIONS;
  const q = query.trim().toLowerCase();
  const visible = useMemo(() => (q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options), [options, q]);

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const groups = new Set(visible.map((o) => o.group).filter(Boolean)).size;
    const wanted = Math.min(visible.length * 36 + groups * 30 + (searchable ? 56 : 0) + 12, MAX_LIST_HEIGHT);
    const below = window.innerHeight - rect.bottom - 10;
    const above = rect.top - 10;
    const flip = below < wanted && above > below;
    const width = Math.max(rect.width, 160);
    setPos({
      position: "fixed",
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      minWidth: rect.width,
      maxWidth: Math.min(window.innerWidth - 16, 448),
      maxHeight: Math.max(120, Math.min(MAX_LIST_HEIGHT, flip ? above : below)),
      ...(flip ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }),
    });
  }, [visible, searchable]);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const reposition = () => place();
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, place]);

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    if (open && active >= 0) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, listId]);

  const firstEnabled = (list: SelectOption[], from = 0, step = 1) => {
    for (let i = from; i >= 0 && i < list.length; i += step) if (!list[i].disabled) return i;
    return -1;
  };

  const openList = () => {
    if (disabled) return;
    setQuery("");
    const index = options.findIndex((o) => o.value === current && !o.disabled);
    setActive(index >= 0 ? index : firstEnabled(options));
    setOpen(true);
    if (options.length > SEARCH_FROM_OPTIONS) setTimeout(() => searchRef.current?.focus(), 0);
  };

  // Focus goes back to the trigger after the list closes, done from an effect (refs aren't read while rendering).
  const [refocus, setRefocus] = useState(0);
  useEffect(() => {
    if (refocus > 0) triggerRef.current?.focus();
  }, [refocus]);

  const close = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) setRefocus((n) => n + 1);
  };

  const commit = (option: SelectOption) => {
    if (option.disabled) return;
    if (value === undefined) setInternal(option.value);
    if (option.value !== current) {
      const target = { value: option.value, name: name ?? "" };
      onChange?.({ target, currentTarget: target } as unknown as ChangeEvent<HTMLSelectElement>);
    }
    close();
  };

  const move = (delta: number) => {
    if (visible.length === 0) return;
    let index = active;
    for (let i = 0; i < visible.length; i++) {
      index = (index + delta + visible.length) % visible.length;
      if (!visible[index].disabled) break;
    }
    setActive(index);
  };

  // The list is the visible (filtered) options; `active` indexes into it.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const key = e.key;
    if (!open) {
      if (key === "ArrowDown" || key === "ArrowUp" || key === "Enter" || key === " ") {
        e.preventDefault();
        openList();
        return;
      }
      if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Typing on a closed select jumps to the option starting with those letters, like a native one.
        window.clearTimeout(typeAhead.current.timer);
        typeAhead.current.text += key.toLowerCase();
        typeAhead.current.timer = setTimeout(() => (typeAhead.current.text = ""), 700);
        const hit = options.find((o) => !o.disabled && o.label.toLowerCase().startsWith(typeAhead.current.text));
        if (hit) commit(hit);
      }
      return;
    }
    if (key === "Escape") {
      // Stop here: a Dialog around this select listens for Escape on the document and would close too.
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent.stopPropagation();
      close();
    } else if (key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (key === "Home") {
      e.preventDefault();
      setActive(firstEnabled(visible));
    } else if (key === "End") {
      e.preventDefault();
      setActive(firstEnabled(visible, visible.length - 1, -1));
    } else if (key === "Enter" || (key === " " && !searchable)) {
      e.preventDefault();
      if (active >= 0 && visible[active]) commit(visible[active]);
    } else if (key === "Tab") {
      close(false);
    }
  };

  const groups: { label?: string; items: { option: SelectOption; index: number }[] }[] = [];
  visible.forEach((option, index) => {
    const last = groups[groups.length - 1];
    if (last && last.label === option.group) last.items.push({ option, index });
    else groups.push({ label: option.group, items: [{ option, index }] });
  });

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        title={title}
        autoFocus={autoFocus}
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        aria-label={aria["aria-label"]}
        aria-labelledby={aria["aria-labelledby"]}
        aria-describedby={aria["aria-describedby"]}
        aria-required={required || undefined}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
        onBlur={() => onBlur?.()}
        className={`${className} cursor-pointer text-left disabled:cursor-not-allowed disabled:opacity-60 aria-expanded:border-[#2ec440]`}
        style={{ paddingRight: "2.25rem", backgroundImage: CHEVRON, backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center", backgroundSize: "1rem 1rem", ...style }}
      >
        <span className="block truncate">{selected?.label ?? " "}</span>
      </button>

      {/* A real input so a `required` Select still blocks form submission with the browser's own message. */}
      {(required || name) && <input tabIndex={-1} aria-hidden="true" required={required} name={name} value={current} onChange={() => undefined} disabled={disabled} className="pointer-events-none absolute h-0 w-0 opacity-0" />}

      {open &&
        pos &&
        createPortal(
          <div
            ref={popoverRef}
            id={listId}
            role="listbox"
            aria-label={aria["aria-label"]}
            style={pos}
            className="z-[300] flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10"
          >
            {searchable && (
              <div className="border-b border-slate-100 p-2">
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  onKeyDown={onKeyDown}
                  placeholder="Search…"
                  aria-label="Search options"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#2ec440] focus:bg-white"
                />
              </div>
            )}
            <div className="overflow-y-auto p-1">
              {visible.length === 0 ? (
                <p className="px-3 py-3 text-sm text-slate-400">No matches.</p>
              ) : (
                groups.map((group, groupIndex) => (
                  <div key={`${group.label ?? "_"}-${groupIndex}`} role={group.label ? "group" : undefined} aria-label={group.label}>
                    {group.label && <p className="px-3 pb-1 pt-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">{group.label}</p>}
                    {group.items.map(({ option, index }) => {
                      const isSelected = option.value === current;
                      return (
                        <div
                          key={`${option.value}-${index}`}
                          id={`${listId}-${index}`}
                          role="option"
                          aria-selected={isSelected}
                          aria-disabled={option.disabled || undefined}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => commit(option)}
                          onMouseEnter={() => !option.disabled && setActive(index)}
                          className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
                            option.disabled ? "cursor-not-allowed text-slate-300" : index === active ? "bg-slate-100 text-slate-900" : "text-slate-700"
                          } ${isSelected ? "font-semibold text-[#219b31]" : ""}`}
                        >
                          <span className="truncate">{option.label || " "}</span>
                          {isSelected && <Check />}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
