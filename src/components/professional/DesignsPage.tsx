"use client";

import { useEffect, useId, useRef, useState } from "react";
import Dialog from "@/components/Dialog";
import Select from "@/components/shared/Select";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { uploadProfessionalImage } from "@/lib/professional/api";
import {
  DESIGN_CATEGORY_LABELS,
  DESIGN_PRICE_TYPE_LABELS,
  DesignsApi,
  formatDesignPrice,
  type Design,
  type DesignCategory,
  type DesignInput,
  type DesignPriceType,
} from "@/lib/designs/api";
import { Card, EmptyState, PageFrame, PrimaryButton, SecondaryButton, fieldClass } from "./ui";

const MAX_IMAGES = 10;

const MAX_FURNITURE = 40;

const EMPTY: DesignInput = { title: "", description: "", category: "interior", spaceType: "", images: [], furniture: [], priceType: "fixed", price: undefined, currency: "USD", status: "draft" };

function toInput(design: Design): DesignInput {
  return { title: design.title, description: design.description, category: design.category, spaceType: design.spaceType ?? "", images: design.images, furniture: design.furniture ?? [], priceType: design.priceType, price: design.price, currency: design.currency, status: design.status };
}

/** The professional's own designs: publish interior and exterior designs, each with a price. */
export default function DesignsPage() {
  const { token, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const [designs, setDesigns] = useState<Design[] | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<{ id?: string; input: DesignInput } | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!isAuthReady || !token) return;
    let cancelled = false;
    DesignsApi.mine(token).then((result) => {
      if (cancelled) return;
      if (result.ok) setDesigns(result.data.designs);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, reload]);

  const remove = async (design: Design) => {
    if (!token || !window.confirm(`Delete "${design.title}"?`)) return;
    const result = await DesignsApi.remove(token, design.id);
    if (!result.ok) showToast(result.error, "error");
    else {
      showToast("Design deleted.");
      setReload((n) => n + 1);
    }
  };

  const setStatus = async (design: Design, status: "draft" | "published") => {
    if (!token) return;
    const result = await DesignsApi.update(token, design.id, { ...toInput(design), status });
    if (!result.ok) showToast(result.error, "error");
    else {
      showToast(status === "published" ? "Design published." : "Design unpublished.");
      setReload((n) => n + 1);
    }
  };

  return (
    <PageFrame
      title="Designs"
      action={
        <PrimaryButton type="button" onClick={() => setEditing({ input: EMPTY })}>
          New design
        </PrimaryButton>
      }
    >
      {error ? (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
      ) : designs === null ? (
        <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading designs…</p>
      ) : designs.length === 0 ? (
        <EmptyState
          title="No designs yet"
          action={
            <PrimaryButton type="button" onClick={() => setEditing({ input: EMPTY })}>
              New design
            </PrimaryButton>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {designs.map((design) => (
            <Card key={design.id} className="flex flex-col overflow-hidden !p-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {design.images[0] ? <img src={design.images[0]} alt="" className="h-48 w-full object-cover" /> : <div className="h-48 w-full bg-slate-100" />}
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{DESIGN_CATEGORY_LABELS[design.category]}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${design.status === "published" ? "bg-[#2ec440]/10 text-[#219b31]" : "bg-slate-100 text-slate-500"}`}>{design.status === "published" ? "Published" : "Draft"}</span>
                </div>
                <h3 className="font-black text-slate-900">{design.title}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-700">{formatDesignPrice(design)}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <SecondaryButton type="button" className="min-h-9 px-3 py-1.5" onClick={() => setEditing({ id: design.id, input: toInput(design) })}>
                    Edit
                  </SecondaryButton>
                  <SecondaryButton type="button" className="min-h-9 px-3 py-1.5" onClick={() => setStatus(design, design.status === "published" ? "draft" : "published")}>
                    {design.status === "published" ? "Unpublish" : "Publish"}
                  </SecondaryButton>
                  <SecondaryButton type="button" className="min-h-9 px-3 py-1.5 hover:!border-red-300 hover:!text-red-600" onClick={() => remove(design)}>
                    Delete
                  </SecondaryButton>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <DesignDialog
        state={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          setReload((n) => n + 1);
        }}
      />
    </PageFrame>
  );
}

function DesignDialog({ state, onClose, onSaved }: { state: { id?: string; input: DesignInput } | null; onClose: () => void; onSaved: () => void }) {
  const titleId = useId();
  return (
    <Dialog open={state !== null} onClose={onClose} labelledBy={titleId} panelClassName="max-w-2xl">
      {state && <DesignForm key={state.id ?? "new"} titleId={titleId} id={state.id} initial={state.input} onClose={onClose} onSaved={onSaved} />}
    </Dialog>
  );
}

function DesignForm({ titleId, id, initial, onClose, onSaved }: { titleId: string; id?: string; initial: DesignInput; onClose: () => void; onSaved: () => void }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<DesignInput>(initial);
  const [priceText, setPriceText] = useState(initial.price ? String(initial.price) : "");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const patch = (changes: Partial<DesignInput>) => setForm((current) => ({ ...current, ...changes }));

  const addImages = async (files: FileList | null) => {
    if (!files || !token) return;
    setUploading(true);
    setError("");
    try {
      const room = MAX_IMAGES - form.images.length;
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, room)) urls.push(await uploadProfessionalImage(file, file.type || "image/jpeg", token));
      patch({ images: [...form.images, ...urls] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const save = async (status: "draft" | "published") => {
    if (!token) return;
    const price = form.priceType === "on_request" ? undefined : Number(priceText);
    setBusy(true);
    setError("");
    const input: DesignInput = { ...form, furniture: form.furniture.filter((f) => f.name.trim()).map((f) => ({ ...f, name: f.name.trim(), quantity: f.quantity || 1 })), status, price, currency: (form.currency || "USD").toUpperCase() };
    const result = id ? await DesignsApi.update(token, id, input) : await DesignsApi.create(token, input);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    showToast(status === "published" ? "Design published." : "Design saved.");
    onSaved();
  };

  return (
    <>
      <div className="flex max-h-[88vh] flex-col p-6">
        <h2 id={titleId} className="mb-4 pr-6 text-lg font-semibold text-slate-900">
          {id ? "Edit design" : "New design"}
        </h2>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          <label className="block text-sm font-bold text-slate-700">
            Title
            <input className={`${fieldClass} mt-1`} value={form.title} maxLength={160} onChange={(e) => patch({ title: e.target.value })} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">
              Type
              <Select className={`${fieldClass} mt-1`} value={form.category} onChange={(e) => patch({ category: e.target.value as DesignCategory })}>
                {(Object.keys(DESIGN_CATEGORY_LABELS) as DesignCategory[]).map((c) => (
                  <option key={c} value={c}>
                    {DESIGN_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Space
              <input className={`${fieldClass} mt-1`} value={form.spaceType ?? ""} maxLength={80} placeholder="Living room, kitchen, facade…" onChange={(e) => patch({ spaceType: e.target.value })} />
            </label>
          </div>
          <label className="block text-sm font-bold text-slate-700">
            Description
            <textarea className={`${fieldClass} mt-1 min-h-28 resize-y font-normal`} value={form.description} maxLength={4000} onChange={(e) => patch({ description: e.target.value })} />
          </label>

          <div>
            <p className="text-sm font-bold text-slate-700">
              Images <span className="font-normal text-slate-400">({form.images.length}/{MAX_IMAGES})</span>
            </p>
            <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {form.images.map((url, index) => (
                <div key={url} className="group relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-24 w-full rounded-lg object-cover" />
                  <button type="button" aria-label="Remove image" onClick={() => patch({ images: form.images.filter((_, i) => i !== index) })} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/80 text-xs font-bold text-white hover:bg-red-600">
                    ×
                  </button>
                  {index === 0 && <span className="absolute bottom-1 left-1 rounded bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-bold text-white">Cover</span>}
                </div>
              ))}
              {form.images.length < MAX_IMAGES && (
                <button type="button" disabled={uploading} onClick={() => fileInput.current?.click()} className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-sm font-bold text-slate-500 hover:border-[#2ec440] hover:text-[#219b31] disabled:opacity-50">
                  {uploading ? "Uploading…" : "+ Add"}
                </button>
              )}
            </div>
            <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addImages(e.target.files)} />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-700">
              Furniture list <span className="font-normal text-slate-400">({form.furniture.length}/{MAX_FURNITURE})</span>
            </p>
            <div className="mt-2 space-y-2">
              {form.furniture.map((item, index) => (
                <div key={index} className="grid grid-cols-[1fr_5rem_auto] gap-2 sm:grid-cols-[1fr_5rem_1fr_auto]">
                  <input className={fieldClass} placeholder="Item, e.g. 3 seater sofa" aria-label={`Furniture item ${index + 1}`} maxLength={120} value={item.name} onChange={(e) => patch({ furniture: form.furniture.map((f, i) => (i === index ? { ...f, name: e.target.value } : f)) })} />
                  <input className={fieldClass} inputMode="numeric" placeholder="Qty" aria-label={`Quantity for item ${index + 1}`} value={String(item.quantity)} onChange={(e) => patch({ furniture: form.furniture.map((f, i) => (i === index ? { ...f, quantity: Number(e.target.value.replace(/\D/g, "")) || 0 } : f)) })} />
                  <input className={`${fieldClass} col-span-3 sm:col-span-1 sm:col-start-3 sm:row-start-1`} placeholder="Notes (colour, size)" aria-label={`Notes for item ${index + 1}`} maxLength={200} value={item.notes ?? ""} onChange={(e) => patch({ furniture: form.furniture.map((f, i) => (i === index ? { ...f, notes: e.target.value } : f)) })} />
                  <button type="button" aria-label={`Remove item ${index + 1}`} onClick={() => patch({ furniture: form.furniture.filter((_, i) => i !== index) })} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-600 sm:col-start-4 sm:row-start-1">
                    ×
                  </button>
                </div>
              ))}
            </div>
            {form.furniture.length < MAX_FURNITURE && (
              <button type="button" onClick={() => patch({ furniture: [...form.furniture, { name: "", quantity: 1, notes: "" }] })} className="mt-2 text-sm font-bold text-[#219b31] hover:underline">
                + Add item
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm font-bold text-slate-700 sm:col-span-1">
              Price
              <Select className={`${fieldClass} mt-1`} value={form.priceType} onChange={(e) => patch({ priceType: e.target.value as DesignPriceType })}>
                {(Object.keys(DESIGN_PRICE_TYPE_LABELS) as DesignPriceType[]).map((t) => (
                  <option key={t} value={t}>
                    {DESIGN_PRICE_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </label>
            {form.priceType !== "on_request" && (
              <>
                <label className="block text-sm font-bold text-slate-700">
                  Amount{form.priceType === "per_sqm" ? " per m²" : ""}
                  <input className={`${fieldClass} mt-1`} inputMode="decimal" value={priceText} onChange={(e) => setPriceText(e.target.value.replace(/[^\d.]/g, ""))} />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Currency
                  <input className={`${fieldClass} mt-1 uppercase`} value={form.currency} maxLength={3} onChange={(e) => patch({ currency: e.target.value.replace(/[^A-Za-z]/g, "") })} />
                </label>
              </>
            )}
          </div>
          {error && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <SecondaryButton type="button" onClick={onClose}>
            Cancel
          </SecondaryButton>
          <SecondaryButton type="button" disabled={busy || uploading || !form.title.trim()} onClick={() => save("draft")}>
            Save as draft
          </SecondaryButton>
          <PrimaryButton type="button" disabled={busy || uploading || !form.title.trim()} onClick={() => save("published")}>
            {busy ? "Saving…" : "Publish"}
          </PrimaryButton>
        </div>
      </div>
    </>
  );
}
