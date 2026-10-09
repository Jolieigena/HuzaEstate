"use client";

import { useEffect, useId, useRef, useState } from "react";
import Dialog from "@/components/Dialog";
import Select from "@/components/shared/Select";
import { CurrencySelect, DaysSelect, useCurrencyChoice } from "@/components/designs/fields";
import { Card, EmptyState, PageFrame, PrimaryButton, SecondaryButton, fieldClass } from "@/components/professional/ui";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { uploadProfessionalImage } from "@/lib/professional/api";
import { FURNITURE_CATEGORIES, FurnitureApi, STOCK_LABELS, formatPrice, type Product, type ProductInput, type StockStatus } from "@/lib/furniture/api";

const MAX_IMAGES = 6;
const MAKING_TIMES = [3, 7, 14, 21, 30, 45, 60, 90].map((d) => ({ value: String(d), label: `${d} days` }));

/** What a supplier sells: list furniture with photos and a price, and publish it to the catalogue. */
export default function SupplierProductsPage() {
  const { token, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!isAuthReady || !token) return;
    let cancelled = false;
    FurnitureApi.mine(token).then((result) => {
      if (cancelled) return;
      if (result.ok) setProducts(result.data.products);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, reload]);

  const remove = async (product: Product) => {
    if (!token || !window.confirm(`Delete "${product.name}"?`)) return;
    const result = await FurnitureApi.remove(token, product.id);
    if (!result.ok) showToast(result.error, "error");
    else {
      showToast("Product deleted.");
      setReload((n) => n + 1);
    }
  };

  const setStatus = async (product: Product, status: "draft" | "published") => {
    if (!token) return;
    const result = await FurnitureApi.update(token, product.id, { ...toInput(product), status });
    if (!result.ok) showToast(result.error, "error");
    else {
      showToast(status === "published" ? "Product published." : "Product hidden from the catalogue.");
      setReload((n) => n + 1);
    }
  };

  return (
    <PageFrame
      title="Products"
      action={
        <PrimaryButton type="button" onClick={() => setEditing("new")}>
          Add a product
        </PrimaryButton>
      }
    >
      {error ? (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
      ) : products === null ? (
        <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading…</p>
      ) : products.length === 0 ? (
        <EmptyState
          title="No products yet"
          action={
            <PrimaryButton type="button" onClick={() => setEditing("new")}>
              Add a product
            </PrimaryButton>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="flex flex-col overflow-hidden !p-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {product.images[0] ? <img src={product.images[0]} alt="" className="h-44 w-full object-cover" /> : <div className="h-44 w-full bg-slate-100" />}
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{product.category}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${product.status === "published" ? "bg-[#2ec440]/10 text-[#219b31]" : "bg-slate-100 text-slate-500"}`}>{product.status === "published" ? "Published" : "Draft"}</span>
                </div>
                <h3 className="font-black text-slate-900">{product.name}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {formatPrice(product.price, product.currency)} <span className="font-normal text-slate-400">· {STOCK_LABELS[product.stock]}</span>
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <SecondaryButton type="button" className="min-h-9 px-3 py-1.5" onClick={() => setEditing(product)}>
                    Edit
                  </SecondaryButton>
                  <SecondaryButton type="button" className="min-h-9 px-3 py-1.5" onClick={() => setStatus(product, product.status === "published" ? "draft" : "published")}>
                    {product.status === "published" ? "Hide" : "Publish"}
                  </SecondaryButton>
                  <SecondaryButton type="button" className="min-h-9 px-3 py-1.5 hover:!border-red-300 hover:!text-red-600" onClick={() => remove(product)}>
                    Delete
                  </SecondaryButton>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ProductDialog
        editing={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          setReload((n) => n + 1);
        }}
      />
    </PageFrame>
  );
}

function toInput(product: Product): ProductInput {
  return { name: product.name, description: product.description, category: product.category, images: product.images, price: product.price, currency: product.currency, stock: product.stock, leadTimeDays: product.leadTimeDays, status: product.status };
}

function ProductDialog({ editing, onClose, onSaved }: { editing: Product | "new" | null; onClose: () => void; onSaved: () => void }) {
  const titleId = useId();
  return (
    <Dialog open={editing !== null} onClose={onClose} labelledBy={titleId} panelClassName="max-w-2xl">
      {editing && <ProductForm key={editing === "new" ? "new" : editing.id} titleId={titleId} product={editing === "new" ? null : editing} onClose={onClose} onSaved={onSaved} />}
    </Dialog>
  );
}

function ProductForm({ titleId, product, onClose, onSaved }: { titleId: string; product: Product | null; onClose: () => void; onSaved: () => void }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [priceText, setPriceText] = useState(product ? String(product.price) : "");
  const { currency, setCurrency } = useCurrencyChoice(product?.currency ?? "");
  const [stock, setStock] = useState<StockStatus>(product?.stock ?? "in_stock");
  const [leadTime, setLeadTime] = useState(product?.leadTimeDays !== undefined ? String(product.leadTimeDays) : "14");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const addImages = async (files: FileList | null) => {
    if (!files || !token) return;
    const room = MAX_IMAGES - images.length;
    if (files.length > room) showToast(`Only ${room} more ${room === 1 ? "photo fits" : "photos fit"} (${MAX_IMAGES} per product). The rest were skipped.`, "error");
    setUploading(true);
    setError("");
    try {
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, room)) urls.push(await uploadProfessionalImage(file, file.type || "image/jpeg", token));
      setImages((current) => [...current, ...urls]);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Upload failed. Please try again.", "error");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const save = async (status: "draft" | "published") => {
    if (!token) return;
    setBusy(true);
    setError("");
    const input: ProductInput = { name: name.trim(), description: description.trim(), category, images, price: Number(priceText), currency, stock, ...(stock === "made_to_order" ? { leadTimeDays: Number(leadTime) } : {}), status };
    const result = product ? await FurnitureApi.update(token, product.id, input) : await FurnitureApi.create(token, input);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    showToast(status === "published" ? "Product published." : "Product saved.");
    onSaved();
  };

  const complete = name.trim() !== "" && category !== "" && Number(priceText) > 0;

  return (
    <div className="flex max-h-[88vh] flex-col p-6">
      <h2 id={titleId} className="mb-4 pr-6 text-lg font-semibold text-slate-900">
        {product ? "Edit product" : "Add a product"}
      </h2>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        <label className="block text-sm font-bold text-slate-700">
          Name
          <input className={`${fieldClass} mt-1`} value={name} maxLength={120} autoFocus onChange={(e) => setName(e.target.value)} />
        </label>

        <div>
          <p className="text-sm font-bold text-slate-700">
            Photos <span className="font-normal text-slate-400">({images.length}/{MAX_IMAGES})</span>
          </p>
          <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((url, index) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-24 w-full rounded-lg object-cover" />
                <button type="button" aria-label="Remove photo" onClick={() => setImages((current) => current.filter((_, i) => i !== index))} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/80 text-xs font-bold text-white hover:bg-red-600">
                  ×
                </button>
                {index === 0 && <span className="absolute bottom-1 left-1 rounded bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-bold text-white">Cover</span>}
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <button type="button" disabled={uploading} onClick={() => fileInput.current?.click()} className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-sm font-bold text-slate-500 hover:border-[#2ec440] hover:text-[#219b31] disabled:opacity-50">
                {uploading ? "Uploading…" : "+ Add"}
              </button>
            )}
          </div>
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => addImages(e.target.files)} />
        </div>

        {name.trim() !== "" && (
          <>
            <label className="block text-sm font-bold text-slate-700">
              Category
              <Select className={`${fieldClass} mt-1`} value={category} aria-label="Category" onChange={(e) => setCategory(e.target.value)}>
                <option value="">Choose a category</option>
                {FURNITURE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </label>
            {category !== "" && (
              <>
                <div className="grid grid-cols-[1fr_7rem] gap-3">
                  <label className="block text-sm font-bold text-slate-700">
                    Price
                    <input className={`${fieldClass} mt-1`} inputMode="decimal" value={priceText} onChange={(e) => setPriceText(e.target.value.replace(/[^\d.]/g, ""))} />
                  </label>
                  <label className="block text-sm font-bold text-slate-700">
                    Currency
                    <CurrencySelect className={`${fieldClass} mt-1`} value={currency} onChange={setCurrency} />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-bold text-slate-700">
                    Availability
                    <Select className={`${fieldClass} mt-1`} value={stock} aria-label="Availability" onChange={(e) => setStock(e.target.value as StockStatus)}>
                      {(Object.keys(STOCK_LABELS) as StockStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {STOCK_LABELS[s]}
                        </option>
                      ))}
                    </Select>
                  </label>
                  {stock === "made_to_order" && (
                    <label className="block text-sm font-bold text-slate-700">
                      Ready in
                      <DaysSelect className={`${fieldClass} mt-1`} ariaLabel="Ready in" value={leadTime} onChange={setLeadTime} options={MAKING_TIMES} />
                    </label>
                  )}
                </div>
                <label className="block text-sm font-bold text-slate-700">
                  Description <span className="font-normal text-slate-400">(optional)</span>
                  <textarea className={`${fieldClass} mt-1 min-h-24 resize-y font-normal`} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} />
                </label>
              </>
            )}
          </>
        )}
        {error && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <SecondaryButton type="button" onClick={onClose}>
          Cancel
        </SecondaryButton>
        <SecondaryButton type="button" disabled={busy || uploading || !complete} onClick={() => save("draft")}>
          Save as draft
        </SecondaryButton>
        <PrimaryButton type="button" disabled={busy || uploading || !complete || images.length === 0} onClick={() => save("published")}>
          {busy ? "Saving…" : "Publish"}
        </PrimaryButton>
      </div>
    </div>
  );
}
