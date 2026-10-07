"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { DESIGN_CATEGORY_LABELS, DesignsApi, formatDesignPrice, type Design } from "@/lib/designs/api";
import { RequestDialog, SignInPrompt, type RequestTarget } from "./DesignRequestDialogs";

/** A professional's published designs, shown on their public profile. Renders nothing when they have none. */
export function ProfessionalDesignsSection({ profileId }: { profileId: string }) {
  const [designs, setDesigns] = useState<Design[]>([]);

  useEffect(() => {
    let cancelled = false;
    DesignsApi.list({ professionalId: profileId, limit: 12 }).then((result) => {
      if (!cancelled && result.ok) setDesigns(result.data.designs);
    });
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  if (designs.length === 0) return null;
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-bold text-slate-900">Designs</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        {designs.map((design) => (
          <Link key={design.id} href={`/designs/${design.id}`} className="overflow-hidden rounded-2xl border border-slate-100 transition-shadow hover:shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {design.images[0] ? <img src={design.images[0]} alt={design.title} className="h-40 w-full object-cover" /> : <div className="h-40 w-full bg-slate-100" />}
            <div className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{DESIGN_CATEGORY_LABELS[design.category]}</p>
              <h3 className="mt-0.5 text-sm font-bold text-slate-900">{design.title}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-700">{formatDesignPrice(design)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** "Request a custom design" for a professional's public profile. */
export function RequestCustomDesignButton({ profileId, profileName }: { profileId: string; profileName: string }) {
  const { isLoggedIn, account } = useAuth();
  const [target, setTarget] = useState<RequestTarget | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);

  if (account?.id === profileId) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => (isLoggedIn ? setTarget({ kind: "custom_design", professionalId: profileId, professionalName: profileName }) : setSignInOpen(true))}
        className="mb-4 min-h-11 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]"
      >
        Request a custom design
      </button>
      <RequestDialog target={target} onClose={() => setTarget(null)} />
      <SignInPrompt open={signInOpen} onClose={() => setSignInOpen(false)} returnTo={`/professionals/${profileId}`} />
    </>
  );
}
