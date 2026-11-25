"use client";

import { useState } from "react";
import { fieldClass } from "@/components/professional/ui";
import type { Product, ProductInput } from "@/lib/furniture/api";

/** What one value means: words, and one of the product's pictures, shown when the buyer picks it. */
export type ValueDetail = { description: string; image: string };
/** One choice a buyer makes, such as Size with 12 mm and 16 mm, and what each value means. */
export type OptionRow = { name: string; values: string[]; details?: Record<string, ValueDetail> };
/** What the supplier typed for one combination, keyed by {@link keyOf}. */
export type VariantEdits = Record<string, { price: string; quantity: string; on: boolean }>;

const MAX_OPTIONS = 3;
const MAX_VALUES = 12;
const NAME_SUGGESTIONS = ["Size", "Type", "Length", "Thickness", "Colour", "Weight"];

export const keyOf = (values: string[]) => values.join("\u0001");

/** Every combination of the options' values, in order. */
export function combinations(options: OptionRow[]): string[][] {
  const usable = options.filter((o) => o.name.trim() && o.values.length > 0);
  return usable.reduce<string[][]>((all, option) => all.flatMap((prefix) => option.values.map((value) => [...prefix, value])), [[]]).filter((c) => c.length > 0);
}

/** The editor's starting point for a product: its options and the prices and counts of its combinations. */
export function initialOptions(product: Product | null): { options: OptionRow[]; edits: VariantEdits } {
  const options = (product?.options ?? []).map((o) => ({
    name: o.name,
    values: [...o.values],
    details: Object.fromEntries((o.details ?? []).map((d) => [d.value, { description: d.description ?? "", image: d.image ?? "" }])),
  }));
  const edits: VariantEdits = {};
  for (const variant of product?.variants ?? []) edits[keyOf(variant.values)] = { price: String(variant.price), quantity: variant.quantity !== undefined ? String(variant.quantity) : "", on: true };
  // A combination the product does not sell is switched off, not given a price.
  for (const combo of combinations(options)) if (!edits[keyOf(combo)]) edits[keyOf(combo)] = { price: "", quantity: "", on: false };
  return { options, edits };
}

/** What goes to the server: the options, and the combinations that are on sale. Nothing when there are no options. */
export function optionInputs(options: OptionRow[], edits: VariantEdits): Pick<ProductInput, "options" | "variants"> {
  const usable = options.filter((o) => o.name.trim() && o.values.length > 0);
  if (usable.length === 0) return {};
  const variants = combinations(usable)
    .filter((combo) => edits[keyOf(combo)]?.on)
    .map((combo) => {
      const edit = edits[keyOf(combo)];
      return { values: combo, price: Number(edit.price), ...(edit.quantity.trim() !== "" ? { quantity: Number(edit.quantity) } : {}) };
    });
  return {
    options: usable.map((o) => {
      const details = o.values
        .map((value) => ({ value, description: (o.details?.[value]?.description ?? "").trim(), image: o.details?.[value]?.image ?? "" }))
        .filter((d) => d.description || d.image)
        .map((d) => ({ value: d.value, ...(d.description ? { description: d.description } : {}), ...(d.image ? { image: d.image } : {}) }));
      return { name: o.name.trim(), values: o.values, ...(details.length ? { details } : {}) };
    }),
    variants,
  };
}

/** True when the options are in a state that can be saved: any option has a name and values, and every combination on sale has a price. */
export function optionsReady(options: OptionRow[], edits: VariantEdits): boolean {
  if (options.length === 0) return true;
  if (options.some((o) => !o.name.trim() || o.values.length === 0)) return false;
  const onSale = combinations(options).filter((combo) => edits[keyOf(combo)]?.on);
  return onSale.length > 0 && onSale.every((combo) => Number(edits[keyOf(combo)].price) > 0);
}

function ValueInput({ values, onChange }: { values: string[]; onChange: (values: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const parts = raw.split(",").map((p) => p.trim().slice(0, 30)).filter(Boolean);
    if (parts.length === 0) return;
    const next = [...values];
    for (const part of parts) if (next.length < MAX_VALUES && !next.some((v) => v.toLowerCase() === part.toLowerCase())) next.push(part);
    onChange(next);
    setDraft("");
  };
  return (
    <div className="mt-1 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 focus-within:border-[#2ec440] focus-within:ring-2 focus-within:ring-[#2ec440]/20">
      {values.map((value) => (
        <span key={value} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 py-1 pl-2.5 pr-1.5 text-sm font-semibold text-slate-700">
          {value}
          <button type="button" aria-label={`Remove ${value}`} onClick={() => onChange(values.filter((v) => v !== value))} className="text-slate-400 hover:text-red-600">
            ×
          </button>
        </span>
      ))}
      {values.length < MAX_VALUES && (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && draft === "" && values.length > 0) onChange(values.slice(0, -1));
          }}
          onBlur={() => add(draft)}
          placeholder={values.length === 0 ? "12 mm, 16 mm" : ""}
          aria-label="Add a value"
          className="min-w-[6rem] flex-1 bg-transparent px-1 py-0.5 text-sm font-normal outline-none"
        />
      )}
    </div>
  );
}

/** Size, type and similar choices for a product, and the price and stock of each combination. */
export default function ProductOptionsEditor({ options, edits, currency, images = [], onChange }: { options: OptionRow[]; edits: VariantEdits; currency: string; images?: string[]; onChange: (options: OptionRow[], edits: VariantEdits) => void }) {
  const combos = combinations(options);
  const [describing, setDescribing] = useState<number | null>(null);
  const setDetail = (index: number, value: string, patch: Partial<ValueDetail>) =>
    onChange(
      options.map((o, i) => (i === index ? { ...o, details: { ...(o.details ?? {}), [value]: { description: o.details?.[value]?.description ?? "", image: o.details?.[value]?.image ?? "", ...patch } } } : o)),
      edits,
    );

  // Changing the options keeps the entries of combinations that still exist, and switches new ones on.
  const update = (nextOptions: OptionRow[]) => {
    const nextEdits: VariantEdits = {};
    for (const combo of combinations(nextOptions)) nextEdits[keyOf(combo)] = edits[keyOf(combo)] ?? { price: "", quantity: "", on: true };
    onChange(nextOptions, nextEdits);
  };
  const setEdit = (key: string, patch: Partial<VariantEdits[string]>) => onChange(options, { ...edits, [key]: { ...edits[key], ...patch } });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-700">
          Options <span className="font-normal text-slate-400">(size, type)</span>
        </p>
        {options.length < MAX_OPTIONS && (
          <button type="button" onClick={() => update([...options, { name: NAME_SUGGESTIONS.find((n) => !options.some((o) => o.name === n)) ?? "", values: [] }])} className="text-sm font-bold text-[#219b31] hover:underline">
            + Add an option
          </button>
        )}
      </div>

      {options.map((option, index) => (
        <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-end gap-3">
            <label className="block w-36 text-xs font-bold text-slate-500">
              Name
              <input className={`${fieldClass} mt-1`} list="option-names" maxLength={20} value={option.name} onChange={(e) => update(options.map((o, i) => (i === index ? { ...o, name: e.target.value } : o)))} />
            </label>
            <label className="block min-w-0 flex-1 text-xs font-bold text-slate-500">
              Values
              <ValueInput values={option.values} onChange={(values) => update(options.map((o, i) => (i === index ? { ...o, values } : o)))} />
            </label>
            <button type="button" aria-label={`Remove ${option.name || "option"}`} onClick={() => update(options.filter((_, i) => i !== index))} className="mb-2 text-lg font-bold text-slate-400 hover:text-red-600">
              ×
            </button>
          </div>
          {option.values.length > 0 && (
            <button type="button" onClick={() => setDescribing(describing === index ? null : index)} className="mt-2 text-xs font-bold text-[#219b31] hover:underline">
              {describing === index ? "Hide the description of each value" : "Describe each value"}
            </button>
          )}
          {describing === index && (
            <ul className="mt-2 space-y-3">
              {option.values.map((value) => (
                <li key={value} className="rounded-lg border border-slate-200 bg-white p-2.5">
                  <p className="text-xs font-bold text-slate-700">{value}</p>
                  <textarea
                    aria-label={`Description of ${value}`}
                    rows={2}
                    maxLength={600}
                    value={option.details?.[value]?.description ?? ""}
                    onChange={(e) => setDetail(index, value, { description: e.target.value })}
                    className={`${fieldClass} mt-1 text-sm`}
                  />
                  {images.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={`Picture of ${value}`}>
                      {images.map((url) => {
                        const on = option.details?.[value]?.image === url;
                        return (
                          <button key={url} type="button" role="radio" aria-checked={on} onClick={() => setDetail(index, value, { image: on ? "" : url })} className={`h-12 w-12 overflow-hidden rounded-lg border-2 ${on ? "border-[#2ec440]" : "border-transparent opacity-70 hover:opacity-100"}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="" className="h-full w-full object-cover" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
      <datalist id="option-names">
        {NAME_SUGGESTIONS.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      {combos.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[28rem] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">On sale</th>
                <th className="px-3 py-2">Choice</th>
                <th className="px-3 py-2">Price ({currency})</th>
                <th className="px-3 py-2">In stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {combos.map((combo) => {
                const key = keyOf(combo);
                const edit = edits[key] ?? { price: "", quantity: "", on: true };
                const missingPrice = edit.on && !(Number(edit.price) > 0);
                return (
                  <tr key={key} className={edit.on ? "" : "opacity-50"}>
                    <td className="px-3 py-2">
                      <input type="checkbox" aria-label={`${combo.join(" · ")} on sale`} checked={edit.on} onChange={(e) => setEdit(key, { on: e.target.checked })} className="h-4 w-4 accent-[#2ec440]" />
                    </td>
                    <td className="px-3 py-2 font-semibold text-slate-800">{combo.join(" · ")}</td>
                    <td className="px-3 py-2">
                      <input
                        aria-label={`Price of ${combo.join(" · ")}`}
                        inputMode="decimal"
                        disabled={!edit.on}
                        value={edit.price}
                        onChange={(e) => setEdit(key, { price: e.target.value.replace(/[^\d.]/g, "") })}
                        className={`w-28 rounded-lg border px-2.5 py-1.5 text-sm ${missingPrice ? "border-red-300" : "border-slate-200"}`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input aria-label={`Stock of ${combo.join(" · ")}`} inputMode="numeric" disabled={!edit.on} value={edit.quantity} maxLength={6} onChange={(e) => setEdit(key, { quantity: e.target.value.replace(/\D/g, "") })} className="w-24 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
