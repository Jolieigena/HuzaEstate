"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Reveal from "@/components/Reveal";
import Accordion from "@/components/Accordion";
import AuthRequiredModal from "@/components/AuthRequiredModal";
import { useAuth } from "@/lib/auth-context";

const STUDIO_PATH = "/studio/build/new";

const SAMPLE_PROMPT =
  "Design a contemporary two-floor family home for a 600 sqm plot in Kigali. Include four bedrooms, a home office, natural ventilation, two parking spaces and a maximum budget of 180 million RWF.";

const UNDERSTOOD = ["Two floors", "Four bedrooms", "Home office", "Two parking spaces", "Natural ventilation", "Approx. budget: 180M RWF", "Location: Kigali"];

const FAQ_ITEMS = [
  { question: "Do I need an account to use Build?", answer: "You can look around without one. You need a free account to create and save a design." },
  { question: "Does HuzaEstate produce construction-ready drawings?", answer: "No. Huza AI makes conceptual layouts and pictures. Construction-ready architectural, structural and permit documents must be prepared or approved by qualified professionals." },
  { question: "Will the system estimate construction costs?", answer: "Build shows an indicative budget range based on your requirements. It is an estimate, not a quotation." },
  { question: "Can I share my project with an architect?", answer: "Yes. Once you have a concept you like, you can send it to an architect, engineer or quantity surveyor for review." },
  { question: "Are my designs saved?", answer: "Yes. Every version you make is saved to your account, and you can start as many projects as you like." },
];

function CheckIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function BuildPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const startBuild = () => {
    if (isNavigating) return;
    if (isLoggedIn) {
      setIsNavigating(true);
      router.push(STUDIO_PATH);
      return;
    }
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero: what to type, and what Huza AI picks up from it */}
      <section className="max-w-[1400px] mx-auto px-6 sm:px-10 md:px-12 pt-10 md:pt-16 pb-14 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6 order-1">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1]">
              Describe your dream home. Watch it take shape.
            </h1>
            <p className="text-slate-600 text-lg leading-relaxed mt-5 max-w-xl">
              Layouts, exterior styles and a budget range for your plot, made by Huza AI before you talk to a professional.
            </p>
            <div className="mt-8">
              <button
                type="button"
                onClick={startBuild}
                disabled={isNavigating}
                className="bg-slate-900 hover:bg-[#2ec440] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-[15px] px-8 py-4 rounded-full transition-all shadow-sm hover:-translate-y-0.5"
              >
                Start Designing
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
                onClick={startBuild}
                disabled={isNavigating}
                className="bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-900 border border-slate-200 font-bold text-[15px] px-8 py-3.5 rounded-full transition-all"
              >
                Try a prompt of your own
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Professional review: one slim band */}
      <section className="w-full bg-slate-900 py-10 sm:py-12 px-6 sm:px-10 md:px-12">
        <Reveal className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Concepts are not construction-ready</h2>
            <p className="text-slate-300 text-[15px] leading-relaxed mt-2 max-w-2xl">Final architectural, structural and permit documents must be prepared or approved by qualified professionals.</p>
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
        title="Sign in to start designing"
        description="Create and save home concepts, compare versions and continue your project from any device."
        signInHref={`/login?redirect=${encodeURIComponent(STUDIO_PATH)}`}
        signUpHref={`/signup?redirect=${encodeURIComponent(STUDIO_PATH)}`}
      />
    </div>
  );
}
