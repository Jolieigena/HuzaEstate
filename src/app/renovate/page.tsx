"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Reveal from "@/components/Reveal";
import Accordion from "@/components/Accordion";
import AuthRequiredModal from "@/components/AuthRequiredModal";
import { useAuth } from "@/lib/auth-context";
import { useDisplayCurrency } from "@/lib/currency/display";
import { DESIGN_CATEGORY_LABELS, DesignsApi, formatDesignPrice, type Design } from "@/lib/designs/api";

// Opens the new-project screen, which creates a Huza AI project and goes straight to its brief.
const STUDIO_PATH = "/studio/renovate/new?mode=ai";

const SAMPLE_PROMPT =
  "Redesign this living room in a warm contemporary style. Keep the windows and floor layout, add more storage, improve the lighting and use materials that are easy to source locally.";

const UNDERSTOOD = ["Keep existing windows", "Preserve room layout", "Add storage", "Improve lighting", "Warm contemporary style", "Prefer local materials"];

const FAQ_ITEMS = [
  { question: "Do I need an account?", answer: "You can look around without one. You need a free account to create and save a renovation project." },
  { question: "Can I renovate only one room?", answer: "Yes. You can focus on a single room or plan a full property renovation." },
  { question: "Can I keep parts of the existing design?", answer: "Yes. You can say what must stay, such as windows, layout or fixtures, and Huza AI will work around it." },
  { question: "Will I receive an exact quotation?", answer: "No. Huza AI gives an indicative budget range. An exact quotation comes from a contractor once you share your finished concept." },
  { question: "Can I share the concept with a contractor?", answer: "Yes. You can package your preferred direction and request a professional quotation." },
];

function CheckIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function RenovatePage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const money = useDisplayCurrency();

  // Real interior and exterior designs that professionals on HuzaEstate have published, newest first.
  const [designs, setDesigns] = useState<Design[]>([]);
  useEffect(() => {
    let active = true;
    Promise.all([DesignsApi.list({ category: "interior", sort: "newest", limit: 6 }), DesignsApi.list({ category: "exterior", sort: "newest", limit: 6 })]).then((results) => {
      if (!active) return;
      const all = results.flatMap((result) => (result.ok ? result.data.designs : []));
      const seen = new Set<string>();
      setDesigns(
        all
          .filter((d) => d.images.length > 0 && !seen.has(d.id) && seen.add(d.id))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 6),
      );
    });
    return () => {
      active = false;
    };
  }, []);

  // `path` is where the person lands once signed in; "Try This Prompt" opens the studio with the sample prompt already filled in.
  const [targetPath, setTargetPath] = useState(STUDIO_PATH);
  const startRenovate = (path: string = STUDIO_PATH) => {
    if (isNavigating) return;
    if (isLoggedIn) {
      setIsNavigating(true);
      router.push(path);
      return;
    }
    setTargetPath(path);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero: what to type, and what Huza AI picks up from it */}
      <section className="max-w-[1400px] mx-auto px-6 sm:px-10 md:px-12 pt-10 md:pt-16 pb-14 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6 order-1">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1]">See what your space could become.</h1>
            <p className="text-slate-600 text-lg leading-relaxed mt-5 max-w-xl">
              Tell Huza AI what you want to change in your home. It suggests the work, the materials and a budget range before you call a contractor.
            </p>
            <div className="mt-8">
              <button
                type="button"
                onClick={() => startRenovate()}
                disabled={isNavigating}
                className="bg-slate-900 hover:bg-[#2ec440] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-[15px] px-8 py-4 rounded-full transition-all shadow-sm hover:-translate-y-0.5"
              >
                Renovate My Space
              </button>
            </div>
          </div>

          <Reveal delay={100} className="lg:col-span-6 order-2 bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-8">
            <div className="flex flex-col gap-4">
              <div className="self-end max-w-md bg-slate-900 text-white rounded-2xl rounded-tr-md px-5 py-4 text-[15px] leading-relaxed shadow-sm">“{SAMPLE_PROMPT}”</div>

              <div className="self-start max-w-md bg-white border border-slate-200 rounded-2xl rounded-tl-md px-5 py-5 shadow-sm">
                <p className="text-slate-900 font-bold text-sm mb-3">Huza AI understood:</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-slate-600 text-[15px]">
                  {UNDERSTOOD.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="text-[#2ec440] flex-shrink-0">
                        <CheckIcon />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => startRenovate(`${STUDIO_PATH}&brief=${encodeURIComponent(SAMPLE_PROMPT)}`)}
                disabled={isNavigating}
                className="bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-900 border border-slate-200 font-bold text-[15px] px-8 py-3.5 rounded-full transition-all"
              >
                Try This Prompt
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Real designs published by professionals on HuzaEstate */}
      {designs.length > 0 && (
        <section className="w-full bg-white pb-14 sm:pb-20 px-6 sm:px-10 md:px-12">
          <div className="max-w-[1400px] mx-auto">
            <Reveal className="mb-8 flex items-end justify-between gap-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Work by our professionals</h2>
              <Link href="/designs" className="text-sm font-bold text-[#219b31] hover:underline whitespace-nowrap">
                See all designs
              </Link>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {designs.map((design) => (
                <Link key={design.id} href={`/designs/${design.id}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={design.images[0]} alt={design.title} className="h-52 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                  <div className="p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {DESIGN_CATEGORY_LABELS[design.category]}
                      {design.spaceType ? ` · ${design.spaceType}` : ""}
                    </p>
                    <h3 className="mt-1 font-black text-slate-900">{design.title}</h3>
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                      <span className="font-bold text-slate-900">{formatDesignPrice(design, money.format)}</span>
                      {design.designer && <span className="min-w-0 truncate font-semibold text-slate-600">{design.designer.displayName}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Some changes need a professional: one slim band */}
      <section className="w-full bg-slate-900 py-10 sm:py-12 px-6 sm:px-10 md:px-12">
        <Reveal className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Some changes need professional review</h2>
            <p className="text-slate-300 text-[15px] leading-relaxed mt-2 max-w-2xl">
              Structural walls, roofs, plumbing, electrics, extensions and anything needing a permit must be assessed by qualified professionals before work begins.
            </p>
          </div>
          <Link
            href="/professionals"
            className="inline-flex items-center justify-center gap-2 bg-[#2ec440] hover:bg-[#28b039] text-white font-bold px-6 py-3.5 rounded-full transition-colors whitespace-nowrap"
          >
            Browse Professionals
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="w-full bg-white py-14 sm:py-20 px-6 sm:px-10 md:px-12">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Questions</h2>
          </Reveal>
          <Reveal delay={100}>
            <Accordion items={FAQ_ITEMS} />
          </Reveal>
        </div>
      </section>

      <AuthRequiredModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="Sign in to renovate your space"
        description="Create renovation directions and save every version securely in your account."
        signInHref={`/login?redirect=${encodeURIComponent(targetPath)}`}
        signUpHref={`/signup?redirect=${encodeURIComponent(targetPath)}`}
      />
    </div>
  );
}
