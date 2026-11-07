"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useDisplayCurrency } from "@/lib/currency/display";
import { filesToUploadedUrls } from "@/lib/imageUpload";
import { FurnitureApi, type Product } from "@/lib/furniture/api";
import { useBasket } from "@/lib/furniture/basket";
import { fetchProfessionalsDirectory, type RealProfessionalProfile } from "@/lib/professional/api";
import {
  BUILDER_SPECIALISATIONS,
  DESIGNER_SPECIALISATIONS,
  RENOVATE_ROOMS,
  RENOVATE_STYLES,
  ROOM_CATEGORIES,
  previewRenovation,
  type RenovateRoom,
  type RenovateStyle,
  type RenovationResult,
} from "@/lib/renovate/aiPreview";

const STEPS = ["Photos", "Shop", "Hire"] as const;
const MAX_PHOTOS = 4;
const chip = (on: boolean) =>
  `min-h-10 rounded-full border px-4 text-sm font-bold transition-colors ${on ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-[#2ec440]"}`;
const primary = "inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-900 px-8 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440] disabled:opacity-60";
const secondary = "inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 font-bold text-slate-700 transition-colors hover:border-slate-400";

interface Photo {
  file: File;
  preview: string;
}

export default function RenovatePage() {
  const [step, setStep] = useState(0);
  const [room, setRoom] = useState<RenovateRoom>("living-room");
  const [style, setStyle] = useState<RenovateStyle>("modern-luxury");
  const [result, setResult] = useState<RenovationResult | null>(null);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
      <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Renovate your space</h1>
      <ol className="mt-6 flex gap-2" aria-label="Steps">
        {STEPS.map((label, index) => (
          <li key={label} className="flex-1">
            <button
              type="button"
              onClick={() => setStep(index)}
              aria-current={step === index ? "step" : undefined}
              className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${step === index ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-[#2ec440]"}`}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-black ${step === index ? "bg-[#2ec440] text-white" : "bg-slate-100 text-slate-600"}`}>{index + 1}</span>
              <span className="font-bold">{label}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-8">
        {step === 0 && <PhotosStep room={room} setRoom={setRoom} style={style} setStyle={setStyle} result={result} setResult={setResult} onNext={() => setStep(1)} />}
        {step === 1 && <ShopStep room={room} onBack={() => setStep(0)} onNext={() => setStep(2)} />}
        {step === 2 && <HireStep onBack={() => setStep(1)} />}
      </div>
    </main>
  );
}

function PhotosStep({
  room,
  setRoom,
  style,
  setStyle,
  result,
  setResult,
  onNext,
}: {
  room: RenovateRoom;
  setRoom: (r: RenovateRoom) => void;
  style: RenovateStyle;
  setStyle: (s: RenovateStyle) => void;
  result: RenovationResult | null;
  setResult: (r: RenovationResult | null) => void;
  onNext: () => void;
}) {
  const { token, isLoggedIn } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [wish, setWish] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.preview)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list)
      .slice(0, MAX_PHOTOS - photos.length)
      .map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setPhotos((current) => [...current, ...next]);
    setResult(null);
    setError("");
  };

  const removePhoto = (index: number) => {
    setPhotos((current) => {
      URL.revokeObjectURL(current[index].preview);
      return current.filter((_, i) => i !== index);
    });
    setResult(null);
  };

  const renovate = async () => {
    if (busy) return;
    setError("");
    if (photos.length === 0) return setError("Add at least one photo.");
    if (!token) return;
    setBusy(true);
    const uploaded = await filesToUploadedUrls(
      photos.map((p) => p.file),
      token,
    );
    if (uploaded.urls.length === 0) {
      setBusy(false);
      return setError(uploaded.reasons[0] || "The photos could not be uploaded. Please try again.");
    }
    const outcome = await previewRenovation(token, { photos: uploaded.urls, room, style, wish });
    setBusy(false);
    if (!outcome.ok) return setError(outcome.error);
    setResult(outcome.result);
  };

  return (
    <section className="space-y-7 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
      <div>
        <p className="mb-3 text-sm font-bold text-slate-700">Space</p>
        <div className="flex flex-wrap gap-2">
          {RENOVATE_ROOMS.map((r) => (
            <button key={r.id} type="button" onClick={() => setRoom(r.id)} className={chip(room === r.id)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-bold text-slate-700">Style</p>
        <div className="flex flex-wrap gap-2">
          {RENOVATE_STYLES.map((s) => (
            <button key={s.id} type="button" onClick={() => setStyle(s.id)} className={chip(style === s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-bold text-slate-700">Photos</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((photo, index) => (
            <div key={photo.preview} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.preview} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                aria-label="Remove photo"
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 text-white hover:bg-slate-900"
              >
                ×
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-slate-300 text-slate-500 transition-colors hover:border-[#2ec440] hover:text-[#219b31]"
            >
              <span className="text-3xl font-light leading-none">+</span>
              <span className="text-sm font-bold">Add photo</span>
            </button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <label className="block text-sm font-bold text-slate-700">
        What do you want changed?
        <textarea
          value={wish}
          onChange={(e) => setWish(e.target.value)}
          maxLength={600}
          rows={3}
          placeholder="Keep the windows, add storage, brighter lighting…"
          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-[15px] font-normal focus:border-[#2ec440] focus:outline-none focus:ring-4 focus:ring-[#2ec440]/15"
        />
      </label>

      {error && (
        <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {error}
        </p>
      )}

      {result && (
        <div className="grid gap-3 sm:grid-cols-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {photos[0] && <img src={photos[0].preview} alt="Before" className="aspect-[4/3] w-full rounded-2xl object-cover" />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.imageUrl} alt="After" className="aspect-[4/3] w-full rounded-2xl object-cover" />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {isLoggedIn ? (
          <button type="button" onClick={renovate} disabled={busy} className={primary}>
            {busy ? "Renovating…" : "Renovate with AI"}
          </button>
        ) : (
          <Link href="/login?redirect=/renovate" className={primary}>
            Sign in to renovate
          </Link>
        )}
        <button type="button" onClick={onNext} className={secondary}>
          {result ? "Next: Shop" : "Skip to Shop"}
        </button>
      </div>
    </section>
  );
}

function ShopStep({ room, onBack, onNext }: { room: RenovateRoom; onBack: () => void; onNext: () => void }) {
  const money = useDisplayCurrency();
  const basket = useBasket();
  const categories = useMemo(() => ROOM_CATEGORIES[room], [room]);
  const [category, setCategory] = useState("");
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(categories.map((c) => FurnitureApi.list({ category: c }))).then((results) => {
      if (cancelled) return;
      const seen = new Set<string>();
      const all: Product[] = [];
      for (const r of results) {
        if (!r.ok) continue;
        for (const p of r.data.products) {
          if (seen.has(p.id)) continue;
          seen.add(p.id);
          all.push(p);
        }
      }
      setProducts(all);
    });
    return () => {
      cancelled = true;
    };
  }, [categories]);

  const shown = (products ?? []).filter((p) => !category || p.category === category);
  const present = categories.filter((c) => (products ?? []).some((p) => p.category === c));

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setCategory("")} className={chip(category === "")}>
          All
        </button>
        {present.map((c) => (
          <button key={c} type="button" onClick={() => setCategory(c)} className={chip(category === c)}>
            {c}
          </button>
        ))}
      </div>

      {products === null ? (
        <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="py-10 text-center text-sm font-semibold text-slate-500">Nothing in the shop for this space yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((p) => {
            const inCart = basket.lines.find((l) => l.productId === p.id)?.quantity ?? 0;
            const buyable = p.stock !== "out_of_stock" && !p.supplier?.paused;
            return (
              <li key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <Link href={`/shop/${p.id}`} className="block aspect-[4/3] bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.images[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
                </Link>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <Link href={`/shop/${p.id}`} className="line-clamp-2 text-sm font-bold text-slate-900 hover:text-[#219b31]">
                    {p.name}
                  </Link>
                  <p className="text-sm font-black text-slate-900">{money.format(p.price, p.currency)}</p>
                  {buyable ? (
                    <button type="button" onClick={() => basket.add(p, 1)} className="mt-auto min-h-9 rounded-lg bg-slate-900 px-3 text-xs font-bold text-white transition-colors hover:bg-[#2ec440]">
                      {inCart > 0 ? `In cart (${inCart})` : "Add to cart"}
                    </button>
                  ) : (
                    <p className="mt-auto text-xs font-semibold text-slate-500">Unavailable</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onBack} className={secondary}>
          Back
        </button>
        {basket.lines.length > 0 && (
          <Link href="/shop/cart" className={secondary}>
            View cart
          </Link>
        )}
        <button type="button" onClick={onNext} className={primary}>
          Next: Hire
        </button>
      </div>
    </section>
  );
}

function HireStep({ onBack }: { onBack: () => void }) {
  const [who, setWho] = useState<"designers" | "builders">("designers");
  const [profiles, setProfiles] = useState<RealProfessionalProfile[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchProfessionalsDirectory().then((list) => {
      if (!cancelled) setProfiles(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const wanted = who === "designers" ? DESIGNER_SPECIALISATIONS : BUILDER_SPECIALISATIONS;
  const shown = (profiles ?? []).filter((p) => p.specialisations.some((s) => wanted.includes(s)));

  return (
    <section className="space-y-6">
      <div className="flex gap-2">
        <button type="button" onClick={() => setWho("designers")} className={chip(who === "designers")}>
          Designers
        </button>
        <button type="button" onClick={() => setWho("builders")} className={chip(who === "builders")}>
          Builders
        </button>
      </div>

      {profiles === null ? (
        <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="py-10 text-center text-sm font-semibold text-slate-500">
          No {who} listed yet.{" "}
          <Link href="/professionals" className="font-bold text-[#219b31] hover:underline">
            See all professionals
          </Link>
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {shown.map((p) => (
            <li key={p.accountId} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4">
              {p.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.photoUrl} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl font-black text-slate-500">{p.displayName.slice(0, 1)}</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold text-slate-900">{p.displayName}</p>
                <p className="truncate text-sm text-slate-500">{[p.specialisations.slice(0, 2).join(", "), p.city].filter(Boolean).join(" · ")}</p>
                <Link href={`/professionals/${p.accountId}`} className="mt-2 inline-block text-sm font-bold text-[#219b31] hover:underline">
                  View profile and contact
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onBack} className={secondary}>
          Back
        </button>
        <Link href="/professionals" className={secondary}>
          All professionals
        </Link>
      </div>
    </section>
  );
}
