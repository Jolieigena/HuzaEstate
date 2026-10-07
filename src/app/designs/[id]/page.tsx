"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import BackLink from "@/components/BackLink";
import { FurnitureQuoteDialog, RequestDialog, SignInPrompt, type RequestTarget } from "@/components/designs/DesignRequestDialogs";
import { useAuth } from "@/lib/auth-context";
import { DESIGN_CATEGORY_LABELS, DesignsApi, formatDesignPrice, formatMoney, type Design } from "@/lib/designs/api";

const primary = "min-h-11 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]";
const secondary = "min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-[#2ec440] hover:text-[#219b31]";

export default function DesignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token, isAuthReady, isLoggedIn, account } = useAuth();
  const [state, setState] = useState<{ design?: Design; error?: string } | null>(null);
  const [active, setActive] = useState(0);
  const [area, setArea] = useState("");
  const [target, setTarget] = useState<RequestTarget | null>(null);
  const [furnitureOpen, setFurnitureOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);

  useEffect(() => {
    if (!isAuthReady) return;
    let cancelled = false;
    DesignsApi.get(id, token).then((result) => {
      if (!cancelled) setState(result.ok ? { design: result.data.design } : { error: result.error });
    });
    return () => {
      cancelled = true;
    };
  }, [id, token, isAuthReady]);

  if (!state) return <p className="py-24 text-center text-sm font-semibold text-slate-400">Loading…</p>;
  if (!state.design) return <p className="py-24 text-center text-sm font-semibold text-slate-500">{state.error || "Design not found."}</p>;

  const design = state.design;
  const designer = design.designer;
  const isOwner = !!designer && account?.id === designer.accountId;
  const published = design.status === "published";
  const areaNumber = Number(area);
  const estimate = design.priceType === "per_sqm" && design.price && areaNumber > 0 ? design.price * areaNumber : undefined;

  const ask = (kind: RequestTarget["kind"]) => {
    if (!designer) return;
    if (!isLoggedIn) {
      setSignInOpen(true);
      return;
    }
    setTarget({ kind, designId: design.id, designTitle: design.title, professionalId: designer.accountId, professionalName: designer.displayName, areaSqm: areaNumber > 0 ? areaNumber : undefined, spaceType: design.spaceType });
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <BackLink fallbackHref="/designs" />
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {design.images[active] ? <img src={design.images[active]} alt={design.title} className="h-[420px] w-full rounded-2xl object-cover" /> : <div className="h-[420px] w-full rounded-2xl bg-slate-100" />}
          {design.images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-3">
              {design.images.map((url, index) => (
                <button key={url} type="button" onClick={() => setActive(index)} aria-label={`Show image ${index + 1}`} className={`overflow-hidden rounded-lg border-2 ${index === active ? "border-[#2ec440]" : "border-transparent"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-20 w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {design.furniture.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-black text-slate-900">Furniture in this design</h2>
              <ul className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
                {design.furniture.map((item, index) => (
                  <li key={index} className="flex items-baseline justify-between gap-4 px-5 py-3 text-sm">
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="shrink-0 text-slate-500">
                      {item.notes ? `${item.notes} · ` : ""}× {item.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {DESIGN_CATEGORY_LABELS[design.category]}
            {design.spaceType ? ` · ${design.spaceType}` : ""}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{design.title}</h1>
          <p className="mt-4 text-2xl font-black text-slate-900">{formatDesignPrice(design)}</p>
          {!published && <p className="mt-2 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">Draft, only you can see this</p>}

          {design.priceType === "per_sqm" && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <label className="block text-sm font-bold text-slate-700">
                Your area (m²)
                <input className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-[#2ec440] focus:ring-2 focus:ring-[#2ec440]/15" inputMode="decimal" value={area} onChange={(e) => setArea(e.target.value.replace(/[^\d.]/g, ""))} />
              </label>
              {estimate !== undefined && (
                <p className="mt-3 text-sm text-slate-600">
                  Estimated price <span className="text-lg font-black text-slate-900">{formatMoney(estimate, design.currency)}</span>
                </p>
              )}
            </div>
          )}

          {design.description && <p className="mt-6 whitespace-pre-line text-sm leading-7 text-slate-600">{design.description}</p>}

          {published && designer && !isOwner && (
            <div className="mt-6 flex flex-col gap-2">
              <button type="button" className={primary} onClick={() => ask("custom_price")}>
                Request a custom price
              </button>
              <button type="button" className={secondary} onClick={() => ask("custom_design")}>
                Request a custom design
              </button>
              {design.furniture.length > 0 && (
                <button
                  type="button"
                  className={secondary}
                  onClick={() => (isLoggedIn ? setFurnitureOpen(true) : setSignInOpen(true))}
                >
                  Get furniture quotes
                </button>
              )}
            </div>
          )}

          {designer && (
            <Link href={`/professionals/${designer.accountId}`} className="mt-8 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-[#2ec440]">
              {designer.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={designer.photoUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 font-black text-slate-500">{designer.displayName.charAt(0)}</span>
              )}
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-900">{designer.displayName}</p>
                <p className="truncate text-sm text-slate-500">{[designer.city, designer.country].filter(Boolean).join(", ")}</p>
              </div>
            </Link>
          )}
        </div>
      </div>

      <RequestDialog target={target} onClose={() => setTarget(null)} />
      <FurnitureQuoteDialog design={furnitureOpen ? design : null} onClose={() => setFurnitureOpen(false)} />
      <SignInPrompt open={signInOpen} onClose={() => setSignInOpen(false)} returnTo={`/designs/${design.id}`} />
    </main>
  );
}
