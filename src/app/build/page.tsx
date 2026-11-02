"use client";

import { useId, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Reveal from "@/components/Reveal";
import Accordion from "@/components/Accordion";
import AuthRequiredModal from "@/components/AuthRequiredModal";
import Dialog from "@/components/Dialog";
import { ProcessVideoCard, VideoModal } from "@/components/ProcessVideo";
import { useAuth } from "@/lib/auth-context";
import { buildVideos } from "@/lib/videos";

const STUDIO_PATH = "/studio/build/new";

const STEPS = [
  {
    number: 1,
    title: "Tell us about your plot",
    description: "Location, size and orientation, plus a plan or sketch if you have one.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    number: 2,
    title: "Describe your home",
    description: "Fill in a short form or tell Huza AI what you want.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-6l-4 4v-4z" />
      </svg>
    ),
  },
  {
    number: 3,
    title: "Generate design directions",
    description: "Huza AI makes layouts and pictures to match.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    number: 4,
    title: "Compare and refine",
    description: "Compare options, ask for changes, save the ones you like.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h10m-10 6h16" />
      </svg>
    ),
  },
  {
    number: 5,
    title: "Request professional review",
    description: "Send your pick to an architect or engineer.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

const EXAMPLES = [
  {
    id: "modern-family-home",
    title: "Modern Family Home",
    image: "/hero-house.jpg",
    size: "320 sqm",
    floors: "2 floors",
    bedrooms: "4 bedrooms",
    style: "Modern",
    prompt: "Design a modern family home for a 320 sqm plot with four bedrooms, an open-plan living area and a home office.",
    requirements: "4 bedrooms, home office, open-plan living, family-friendly layout, 2 parking spaces.",
    concept: "A two-floor layout with a shared living and dining area on the ground floor and bedrooms above, oriented for natural light.",
  },
  {
    id: "contemporary-african-home",
    title: "Contemporary African Home",
    image: "/hero-house-final.jpg",
    size: "450 sqm",
    floors: "2 floors",
    bedrooms: "5 bedrooms",
    style: "Contemporary African",
    prompt: "Design a contemporary African-style home for a 450 sqm plot with locally sourced materials and a shaded outdoor courtyard.",
    requirements: "5 bedrooms, shaded courtyard, locally available materials, cross-ventilation.",
    concept: "A courtyard-centred layout using natural materials and deep overhangs to manage sun and rain.",
  },
  {
    id: "compact-urban-home",
    title: "Compact Urban Home",
    image: "/seed/exterior-modern-white.jpg",
    size: "180 sqm",
    floors: "3 floors",
    bedrooms: "3 bedrooms",
    style: "Urban minimal",
    prompt: "Design a compact three-floor urban home for a narrow 180 sqm plot with a rooftop terrace.",
    requirements: "3 bedrooms, rooftop terrace, compact footprint, street-facing entry.",
    concept: "A vertical layout that stacks living, sleeping and terrace levels to make the most of a narrow plot.",
  },
  {
    id: "luxury-villa",
    title: "Luxury Villa",
    image: "/hero-house-africa-test1.jpg",
    size: "800 sqm",
    floors: "2 floors",
    bedrooms: "6 bedrooms",
    style: "Luxury",
    prompt: "Design a luxury two-floor villa for an 800 sqm plot with a pool, home theatre and staff quarters.",
    requirements: "6 bedrooms, pool, home theatre, staff quarters, four parking spaces.",
    concept: "A generous layout separating family, guest and staff areas around a central pool courtyard.",
  },
  {
    id: "eco-conscious-home",
    title: "Eco-Conscious Home",
    image: "/hero-house-spacious.jpg",
    size: "280 sqm",
    floors: "1 floor",
    bedrooms: "3 bedrooms",
    style: "Eco-conscious",
    prompt: "Design a single-floor eco-conscious home for a 280 sqm plot with rainwater harvesting and passive cooling.",
    requirements: "3 bedrooms, passive cooling, rainwater harvesting, solar-ready roof.",
    concept: "A single-storey layout oriented to reduce heat gain, with a roof designed for solar panels and water collection.",
  },
  {
    id: "affordable-starter-home",
    title: "Affordable Starter Home",
    image: "/seed/exterior-timber-house.jpg",
    size: "120 sqm",
    floors: "1 floor",
    bedrooms: "2 bedrooms",
    style: "Starter home",
    prompt: "Design an affordable single-floor starter home for a 120 sqm plot with two bedrooms and room to extend later.",
    requirements: "2 bedrooms, low-cost materials, simple roofline, future extension allowance.",
    concept: "A simple, efficient footprint with a structural layout that leaves room for an additional wing later.",
  },
];

const FAQ_ITEMS = [
  { question: "Do I need an account to use Build?", answer: "You can look around, watch the demo and view the examples without one. You need a free account to create and save a design." },
  { question: "Does HuzaEstate produce construction-ready drawings?", answer: "No. Huza AI makes conceptual layouts and pictures. Construction-ready architectural, structural and permit documents must be prepared or approved by qualified professionals." },
  { question: "Will the system estimate construction costs?", answer: "Build shows an indicative budget range based on your requirements. It is an estimate, not a quotation." },
  { question: "Can I share my project with an architect?", answer: "Yes. Once you have a concept you like, you can send it to an architect, engineer or quantity surveyor for review." },
  { question: "Are my designs saved?", answer: "Yes. Every version you make is saved to your account, and you can start as many projects as you like." },
];

export default function BuildPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [activeExample, setActiveExample] = useState<(typeof EXAMPLES)[0] | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const exampleTitleId = useId();
  const exampleDescId = useId();

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
      {/* Hero */}
      <section className="max-w-[1400px] mx-auto px-6 sm:px-10 md:px-12 pt-10 md:pt-16 pb-14 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6 order-1">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1]">
              Describe your dream home. Watch it take shape.
            </h1>
            <p className="text-slate-600 text-lg leading-relaxed mt-5 max-w-xl">
              Layouts, exterior styles and a budget range for your plot, made by Huza AI before you talk to a professional.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-8">
              <button
                type="button"
                onClick={startBuild}
                disabled={isNavigating}
                className="bg-slate-900 hover:bg-[#2ec440] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-[15px] px-8 py-4 rounded-full transition-all shadow-sm hover:-translate-y-0.5"
              >
                Start Designing
              </button>
              <button
                type="button"
                onClick={() => setDemoOpen(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[15px] px-8 py-4 rounded-full transition-all"
              >
                Watch Demo
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 order-2">
            <ProcessVideoCard video={buildVideos.overview} autoplayPreview aspectClassName="aspect-[4/3] sm:aspect-video" className="shadow-xl" />
          </div>
        </div>
      </section>

      {/* How Build works */}
      <section className="w-full bg-[#f8fafc] py-14 sm:py-20 px-6 sm:px-10 md:px-12 border-t border-b border-slate-200/60">
        <div className="max-w-[1400px] mx-auto">
          <Reveal className="mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-[1.15]">How it works</h2>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
            {STEPS.map((step, index) => (
              <Reveal key={step.number} delay={index * 60} className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-[#2ec440]/10 text-[#2ec440] flex items-center justify-center">{step.icon}</div>
                  <span className="text-sm font-bold text-slate-300">{step.number}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Design examples */}
      <section className="w-full bg-white py-14 sm:py-20 px-6 sm:px-10 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          <Reveal className="mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Design examples</h2>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {EXAMPLES.map((example, index) => (
              <Reveal key={example.id} delay={index * 80} className="bg-white rounded-[1.75rem] border border-gray-100 p-2 sm:p-2.5 pb-4 hover:shadow-xl transition-shadow duration-300">
                <div className="relative w-full h-[180px] sm:h-[200px] rounded-2xl overflow-hidden mb-3">
                  <Image src={example.image} alt={example.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover" />
                  <div className="absolute top-3 left-3 bg-slate-900/70 text-white text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg">Conceptual</div>
                </div>
                <div className="px-3 sm:px-4 flex flex-col gap-3">
                  <h3 className="text-lg font-bold text-slate-900">{example.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-slate-500">
                    <span>{example.size}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span>{example.floors}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span>{example.bedrooms}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span>{example.style}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveExample(example)}
                    className="mt-1 inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm px-5 py-2.5 rounded-full transition-all w-full"
                  >
                    View Example
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Professional review: one slim band instead of a long process */}
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
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

      {/* Final call to action */}
      <section className="w-full bg-[#f8fafc] py-14 sm:py-20 px-6 sm:px-10 md:px-12 border-t border-slate-200/60">
        <Reveal className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-8">Your future home can begin with one idea.</h2>
          <button
            type="button"
            onClick={startBuild}
            disabled={isNavigating}
            className="bg-slate-900 hover:bg-[#2ec440] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 px-10 rounded-xl transition-colors shadow-lg"
          >
            Start Designing
          </button>
        </Reveal>
      </section>

      {/* Full demo video modal */}
      <VideoModal video={buildVideos.overview} open={demoOpen} onClose={() => setDemoOpen(false)} />

      {/* Auth-required modal */}
      <AuthRequiredModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="Sign in to start designing"
        description="Create and save home concepts, compare versions and continue your project from any device."
        signInHref={`/login?redirect=${encodeURIComponent(STUDIO_PATH)}`}
        signUpHref={`/signup?redirect=${encodeURIComponent(STUDIO_PATH)}`}
      />

      {/* Example modal */}
      <Dialog
        open={activeExample !== null}
        onClose={() => setActiveExample(null)}
        labelledBy={exampleTitleId}
        describedBy={exampleDescId}
        panelClassName="max-w-2xl"
      >
        {activeExample && (
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-5">
              <h2 id={exampleTitleId} className="text-xl font-bold text-slate-900">{activeExample.title}</h2>
              <button
                type="button"
                data-dialog-close
                onClick={() => setActiveExample(null)}
                aria-label="Close example"
                className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ec440]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-6">
              <Image src={activeExample.image} alt={activeExample.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 700px" />
              <div className="absolute top-3 left-3 bg-slate-900/70 text-white text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg">Conceptual</div>
            </div>

            <div id={exampleDescId} className="space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Sample prompt</p>
                <p className="text-slate-700 text-[15px] leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-4">{activeExample.prompt}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Requirements summary</p>
                <p className="text-slate-600 text-[15px] leading-relaxed">{activeExample.requirements}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Concept details</p>
                <p className="text-slate-600 text-[15px] leading-relaxed">{activeExample.concept}</p>
              </div>
              <p className="text-slate-400 text-sm italic">
                This example is a conceptual illustration. Your generated designs will vary based on your own requirements and plot.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveExample(null);
                startBuild();
              }}
              disabled={isNavigating}
              className="w-full mt-7 bg-slate-900 hover:bg-[#2ec440] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg"
            >
              Create My Design
            </button>
          </div>
        )}
      </Dialog>
    </div>
  );
}
