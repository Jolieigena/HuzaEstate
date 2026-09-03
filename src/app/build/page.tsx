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
    description:
      "Share your location, plot dimensions and orientation, and upload an existing plot plan or sketch if you have one.",
    video: buildVideos.overview,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    number: 2,
    title: "Describe your home",
    description: "Complete a guided form or send Huza AI a natural-language prompt describing what you want.",
    video: buildVideos.describeYourHome,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-6l-4 4v-4z" />
      </svg>
    ),
  },
  {
    number: 3,
    title: "Generate design directions",
    description: "Huza AI creates alternative layout and visual concepts based on your confirmed requirements.",
    video: buildVideos.generateConcepts,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    number: 4,
    title: "Compare and refine",
    description: "Compare options side by side, request changes and save the versions you like best.",
    video: buildVideos.refineDesign,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h10m-10 6h16" />
      </svg>
    ),
  },
  {
    number: 5,
    title: "Request professional review",
    description: "Share your selected concept with an architect, engineer or quantity surveyor before construction.",
    video: buildVideos.professionalReview,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

const CREATIONS = [
  { title: "Plot and site concept", description: "See how your home could sit on your plot given its shape, size and orientation." },
  { title: "Conceptual floor plans", description: "Explore alternative room layouts based on the bedrooms and spaces you need." },
  { title: "Exterior design options", description: "Compare exterior styles, rooflines and façade treatments for your home." },
  { title: "Interior visualisations", description: "Preview how key interior spaces could look and feel." },
  { title: "Material and colour directions", description: "Get suggested material palettes and colour directions to explore." },
  { title: "Indicative budget ranges", description: "See an approximate budget range based on your requirements." },
  { title: "Saved design versions", description: "Keep every version you generate so you can revisit or compare them later." },
  { title: "Professional review package", description: "Package your selected concept to share with an architect or engineer." },
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
    image: "/hero-house-white.jpg",
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
    image: "/hero-house-ai.jpg",
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
    image: "/hero-house.png",
    size: "120 sqm",
    floors: "1 floor",
    bedrooms: "2 bedrooms",
    style: "Starter home",
    prompt: "Design an affordable single-floor starter home for a 120 sqm plot with two bedrooms and room to extend later.",
    requirements: "2 bedrooms, low-cost materials, simple roofline, future extension allowance.",
    concept: "A simple, efficient footprint with a structural layout that leaves room for an additional wing later.",
  },
];

const VALIDATION_STAGES = [
  "AI-generated concept",
  "User refinement",
  "Architect review",
  "Engineering review",
  "Cost validation",
  "Permit preparation",
];

const FAQ_ITEMS = [
  { question: "Do I need an account to use Build?", answer: "No. Anyone can explore this page, watch the demo videos and view examples without an account. You'll need a free account only when you're ready to create and save a design." },
  { question: "Can I design from a written prompt?", answer: "Yes. You can describe your home in natural language, and Huza AI will confirm your requirements before generating concepts." },
  { question: "Can I upload a plot plan or sketch?", answer: "Yes. You can upload an existing plot plan or a rough sketch alongside your plot's location, dimensions and orientation." },
  { question: "Does HuzaEstate produce construction-ready drawings?", answer: "No. Huza AI produces conceptual layouts and visuals. Construction-ready architectural, structural and permit documents must be prepared or approved by qualified professionals." },
  { question: "Can I change a generated design?", answer: "Yes. You can request changes to any generated concept and compare the results before saving a version." },
  { question: "Will the system estimate construction costs?", answer: "Yes, Build shows an indicative budget range based on your requirements. This is an estimate, not a fixed quotation." },
  { question: "Can I share my project with an architect?", answer: "Yes. Once you have a concept you like, you can package it to share with an architect, engineer or quantity surveyor for review." },
  { question: "Are my designs saved?", answer: "Yes. Every version you generate is saved to your account so you can revisit or compare it later." },
  { question: "Can I create more than one project?", answer: "Yes. You can start as many Build projects as you like from your dashboard." },
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
  const [demoOpen, setDemoOpen] = useState(false);
  const [activeExample, setActiveExample] = useState<(typeof EXAMPLES)[number] | null>(null);
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
      {/* Section 1: Hero */}
      <section className="max-w-[1400px] mx-auto px-6 sm:px-10 md:px-12 pt-12 md:pt-20 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6 order-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2ec440]/10 text-[#2ec440] font-semibold text-xs uppercase tracking-wide mb-6">
              HuzaEstate Build
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              Describe your dream home. Watch it take shape.
            </h1>
            <p className="text-slate-600 text-lg leading-relaxed mt-6 max-w-xl">
              Turn your ideas, requirements and plot information into personalised home concepts with Huza AI. Explore layouts, exterior styles and estimated budgets before working with a professional.
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
                Watch Full Demo
              </button>
            </div>
            <p className="text-slate-400 text-sm mt-4">An account is required to create and save a design.</p>
          </div>

          <div className="lg:col-span-6 order-2">
            <ProcessVideoCard video={buildVideos.overview} autoplayPreview aspectClassName="aspect-[4/3] sm:aspect-video" className="shadow-xl" />
          </div>
        </div>
      </section>

      {/* Section 2: How Build works */}
      <section className="w-full bg-[#f8fafc] py-16 sm:py-24 px-6 sm:px-10 md:px-12 border-t border-b border-slate-200/60">
        <div className="max-w-[1400px] mx-auto">
          <Reveal className="max-w-2xl mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">How HuzaEstate Build works</h2>
            <p className="text-slate-600 text-lg leading-relaxed mt-4">
              You&apos;re guided from your initial idea to a saved concept that can be shared with a professional — one confirmed step at a time.
            </p>
          </Reveal>

          <div className="flex flex-col gap-16 sm:gap-20">
            {STEPS.map((step, index) => (
              <Reveal key={step.number} delay={index * 80}>
                <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center ${index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}>
                  <div className="lg:col-span-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-[#2ec440] flex-shrink-0">
                        {step.icon}
                      </div>
                      <span className="text-3xl font-black text-slate-200">{String(step.number).padStart(2, "0")}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">{step.title}</h3>
                    <p className="text-slate-600 text-[15px] leading-relaxed max-w-md">{step.description}</p>
                  </div>
                  <div className="lg:col-span-6">
                    <ProcessVideoCard video={step.video} aspectClassName="aspect-video" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Prompt experience preview */}
      <section className="w-full bg-white py-16 sm:py-24 px-6 sm:px-10 md:px-12">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">See Huza AI in action</h2>
            <p className="text-slate-600 text-lg leading-relaxed mt-4 max-w-2xl mx-auto">
              This is a public demonstration of how a conversation with Huza AI works, not the working agent.
            </p>
          </Reveal>

          <Reveal delay={100} className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-10">
            <div className="flex flex-col gap-5">
              <div className="self-end max-w-lg bg-slate-900 text-white rounded-2xl rounded-tr-md px-5 py-4 text-[15px] leading-relaxed shadow-sm">
                “Design a contemporary two-floor family home for a 600 sqm plot in Kigali. Include four bedrooms, a home office, natural ventilation, two parking spaces and a maximum budget of 180 million RWF.”
              </div>

              <div className="self-start max-w-xl bg-white border border-slate-200 rounded-2xl rounded-tl-md px-5 py-5 shadow-sm">
                <p className="text-slate-900 font-bold text-sm mb-3">Huza AI understood:</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-slate-600 text-[15px]">
                  {[
                    "Two floors",
                    "Four bedrooms",
                    "Home office",
                    "Two parking spaces",
                    "Natural ventilation",
                    "Approx. budget: 180M RWF",
                    "Location: Kigali",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="text-[#2ec440] flex-shrink-0"><CheckIcon /></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-slate-400 text-sm italic">Huza AI confirms your requirements before generating concepts.</p>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={startBuild}
                disabled={isNavigating}
                className="bg-slate-900 hover:bg-[#2ec440] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-[15px] px-8 py-3.5 rounded-full transition-all"
              >
                Try This Prompt
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Section 4: What users can create */}
      <section className="w-full bg-[#f8fafc] py-16 sm:py-24 px-6 sm:px-10 md:px-12 border-t border-b border-slate-200/60">
        <div className="max-w-[1400px] mx-auto">
          <Reveal className="max-w-2xl mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">What you can create</h2>
            <p className="text-slate-600 text-lg leading-relaxed mt-4">Floor plans and generated visuals shown here are conceptual, not construction-ready.</p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CREATIONS.map((item, index) => (
              <Reveal key={item.title} delay={index * 60} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 h-full flex flex-col">
                <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Design examples */}
      <section className="w-full bg-white py-16 sm:py-24 px-6 sm:px-10 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Design examples</h2>
              <p className="text-slate-500 text-lg mt-2">A sample of the directions Huza AI can explore with you.</p>
            </div>
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

      {/* Section 6: Professional validation */}
      <section className="w-full bg-slate-900 py-16 sm:py-24 px-6 sm:px-10 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          <Reveal className="max-w-2xl mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">From an idea to a professionally reviewed project</h2>
            <p className="text-slate-300 text-lg leading-relaxed mt-4">
              Huza AI helps you explore and organise your requirements, but technical documents must be reviewed and prepared by qualified professionals.
            </p>
          </Reveal>

          <Reveal delay={100} className="flex flex-wrap items-stretch gap-3 mb-10">
            {VALIDATION_STAGES.map((stage, index) => (
              <div key={stage} className="flex items-center gap-3">
                <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#2ec440]/20 text-[#2ec440] font-bold text-xs flex items-center justify-center flex-shrink-0">{index + 1}</span>
                  <span className="text-white font-semibold text-sm whitespace-nowrap">{stage}</span>
                </div>
                {index < VALIDATION_STAGES.length - 1 && (
                  <svg className="w-5 h-5 text-slate-500 flex-shrink-0 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                )}
              </div>
            ))}
          </Reveal>

          <Reveal delay={150} className="bg-white/5 border border-white/10 rounded-2xl px-6 py-5">
            <p className="text-slate-200 text-[15px] leading-relaxed">
              <span className="font-bold text-white">Important: </span>
              AI-generated designs are conceptual and must not be used directly for construction. Final architectural, structural and permit documents must be prepared or approved by qualified professionals.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Section 7: FAQ */}
      <section className="w-full bg-white py-16 sm:py-24 px-6 sm:px-10 md:px-12">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Build FAQ</h2>
          </Reveal>
          <Reveal delay={100}>
            <Accordion items={FAQ_ITEMS} />
          </Reveal>
        </div>
      </section>

      {/* Section 8: Final CTA */}
      <section className="w-full bg-[#f8fafc] py-16 sm:py-24 px-6 sm:px-10 md:px-12 border-t border-slate-200/60">
        <Reveal className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Your future home can begin with one idea.</h2>
          <p className="text-slate-600 text-lg leading-relaxed mb-10">Create an account, describe what you want and start exploring your first home concept.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={startBuild}
              disabled={isNavigating}
              className="w-full sm:w-auto bg-slate-900 hover:bg-[#2ec440] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 px-10 rounded-xl transition-colors shadow-lg"
            >
              Start Designing
            </button>
            <Link
              href={isLoggedIn ? STUDIO_PATH : "/signup?redirect=" + encodeURIComponent(STUDIO_PATH)}
              className="w-full sm:w-auto text-center bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 font-bold py-4 px-10 rounded-xl transition-colors"
            >
              Create an Account
            </Link>
          </div>
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
              <h2 id={exampleTitleId} className="text-2xl font-black text-slate-900">{activeExample.title}</h2>
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
