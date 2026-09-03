"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Reveal from "@/components/Reveal";
import Accordion from "@/components/Accordion";
import AuthRequiredModal from "@/components/AuthRequiredModal";
import Dialog from "@/components/Dialog";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import { ProcessVideoCard, VideoModal } from "@/components/ProcessVideo";
import { useAuth } from "@/lib/auth-context";
import { renovateVideos } from "@/lib/videos";

const STUDIO_PATH = "/studio/renovate/new";

const STEPS = [
  {
    number: 1,
    title: "Upload your existing space",
    description: "Add room photographs, a floor plan, a sketch or a walkthrough video of the property.",
    video: renovateVideos.uploadYourSpace,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 12v9m0-9l-3 3m3-3l3 3" />
      </svg>
    ),
  },
  {
    number: 2,
    title: "Describe what must change",
    description: "Identify the rooms, problems, preferred style, budget and items that must remain.",
    video: renovateVideos.uploadYourSpace,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    number: 3,
    title: "Generate renovation options",
    description: "Huza AI creates alternative concepts while considering the existing space.",
    video: renovateVideos.generateRenovation,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    number: 4,
    title: "Refine selected areas",
    description: "Request focused changes to walls, finishes, furniture, colours, roofing or landscaping.",
    video: renovateVideos.refineRenovation,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h10m-10 6h16" />
      </svg>
    ),
  },
  {
    number: 5,
    title: "Prepare for execution",
    description: "Save your preferred direction and request professional review or contractor quotations.",
    video: renovateVideos.requestQuotation,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

const CATEGORIES = [
  {
    id: "kitchen",
    title: "Kitchen renovation",
    description: "Reimagine layout, cabinetry, counters and lighting.",
    inputs: "Photos of the current kitchen, dimensions, preferred style and budget.",
    outputs: "Alternative layouts, cabinetry and finish directions, and an indicative budget range.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h18v4H3V3zm0 6h18v12H3V9zm5 3v6m8-6v6" /></svg>
    ),
  },
  {
    id: "bathroom",
    title: "Bathroom renovation",
    description: "Explore new fixtures, tiling and layout options.",
    inputs: "Photos of the current bathroom, dimensions, must-keep fixtures.",
    outputs: "Layout and fixture options, tiling and colour directions, indicative budget range.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 12h16M6 12V6a2 2 0 012-2h2a2 2 0 012 2v6m4 0v8m-12 0v-4a2 2 0 012-2h8a2 2 0 012 2v4" /></svg>
    ),
  },
  {
    id: "living-room",
    title: "Living room redesign",
    description: "Refresh furniture layout, finishes and lighting.",
    inputs: "Photos of the room, furniture you want to keep, preferred style.",
    outputs: "Furniture placement ideas, colour and material directions.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M5 10V6a2 2 0 012-2h10a2 2 0 012 2v4m-16 0v9a1 1 0 001 1h1a1 1 0 001-1v-2h12v2a1 1 0 001 1h1a1 1 0 001-1v-9" /></svg>
    ),
  },
  {
    id: "bedroom",
    title: "Bedroom redesign",
    description: "Explore layout, storage and colour changes.",
    inputs: "Photos of the room, storage needs, preferred style.",
    outputs: "Layout options, storage solutions, colour and material directions.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 18v-6a2 2 0 012-2h14a2 2 0 012 2v6M3 18h18M3 18v2m18-2v2M6 10V7a2 2 0 012-2h8a2 2 0 012 2v3" /></svg>
    ),
  },
  {
    id: "exterior",
    title: "Exterior and façade",
    description: "Refresh the exterior look, cladding and colours.",
    inputs: "Exterior photos from a few angles, preferred style or materials.",
    outputs: "Façade and cladding directions, colour palettes.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21h18M4 21V9l8-6 8 6v12M9 21v-6h6v6" /></svg>
    ),
  },
  {
    id: "roofing",
    title: "Roofing",
    description: "Explore roof material, colour and structural changes.",
    inputs: "Roof photos, known structural details, budget.",
    outputs: "Material and colour options, notes on likely structural review needs.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l9-9 9 9M5 10v10h14V10" /></svg>
    ),
  },
  {
    id: "extension",
    title: "Home extension",
    description: "Plan an additional room or wing.",
    inputs: "Current floor plan or photos, plot boundaries, desired new space.",
    outputs: "Conceptual extension layouts and an indicative budget range.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m-8-8h16" /></svg>
    ),
  },
  {
    id: "additional-floor",
    title: "Additional floor",
    description: "Explore adding a floor to your existing structure.",
    inputs: "Current structure photos or plans, desired new spaces.",
    outputs: "Conceptual upper-floor layouts, notes on likely engineering review needs.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 21h16M4 21V11l8-4 8 4v10M4 11h16" /></svg>
    ),
  },
  {
    id: "landscaping",
    title: "Landscaping",
    description: "Reimagine gardens, driveways and outdoor spaces.",
    inputs: "Photos of the outdoor space, plot layout, preferred style.",
    outputs: "Landscaping and hardscaping directions.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v6m0 0a4 4 0 110 8 4 4 0 010-8zm0 8v4m-6-1a3 3 0 106 0m0 0a3 3 0 106 0" /></svg>
    ),
  },
  {
    id: "full-renovation",
    title: "Full property renovation",
    description: "Plan a coordinated renovation across the whole property.",
    inputs: "Photos or a floor plan of the whole property, room-by-room priorities, overall budget.",
    outputs: "A room-by-room renovation scope and a suggested sequence.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
    ),
  },
  {
    id: "accessibility",
    title: "Accessibility improvement",
    description: "Improve access, circulation and safety around the home.",
    inputs: "Photos of entrances and key rooms, specific accessibility needs.",
    outputs: "Accessibility-focused layout and fixture suggestions.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
    ),
  },
  {
    id: "energy-efficiency",
    title: "Energy-efficiency upgrade",
    description: "Explore insulation, solar-readiness and lighting upgrades.",
    inputs: "Photos of the property, current energy concerns, budget.",
    outputs: "Efficiency-focused suggestions and an indicative budget range.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    ),
  },
];

const RECEIVE_ITEMS = [
  { title: "Before-and-after concepts", description: "Visual comparisons between your existing space and the proposed direction." },
  { title: "Alternative design styles", description: "A few distinct style directions to choose between." },
  { title: "Suggested materials and colours", description: "Palettes and materials suited to your chosen style and budget." },
  { title: "Furniture placement", description: "Suggested layouts for furniture and fixtures in the renovated space." },
  { title: "Room-by-room scope", description: "A clear breakdown of what changes in each room." },
  { title: "Indicative budget range", description: "An approximate cost range based on the scope you describe." },
  { title: "Suggested renovation sequence", description: "A sensible order to tackle the work in, room by room." },
  { title: "Saved design versions", description: "Every version you generate is saved so you can revisit or compare it." },
  { title: "Professional quotation request", description: "A packaged brief you can send to a contractor for a quotation." },
];

const SAFETY_ITEMS = [
  "Structural walls",
  "Foundations",
  "Roof structure",
  "Plumbing systems",
  "Electrical systems",
  "Building extensions",
  "Additional floors",
  "Changes requiring permits",
];

const FAQ_ITEMS = [
  { question: "Do I need an account?", answer: "No. Browsing this page, watching the demo and exploring categories is free and open to everyone. You'll need a free account to upload, generate and save renovation concepts." },
  { question: "What files can I upload?", answer: "You can upload room photographs, a floor plan, a sketch or a walkthrough video of your property." },
  { question: "Can I renovate only one room?", answer: "Yes. You can focus on a single room or category, or plan a full property renovation." },
  { question: "Can I keep parts of the existing design?", answer: "Yes. You can specify what must remain — such as windows, layout or fixtures — and Huza AI will work around them." },
  { question: "Can I edit only a selected area?", answer: "Yes. You can request focused changes to specific walls, finishes, furniture, colours, roofing or landscaping." },
  { question: "Will I receive an exact quotation?", answer: "No. Huza AI provides an indicative budget range. An exact quotation comes from a contractor once you share your finished concept." },
  { question: "Can I compare different styles?", answer: "Yes. You can generate and compare multiple style directions before choosing one." },
  { question: "Can I share the concept with a contractor?", answer: "Yes. You can package your preferred direction and request a professional quotation." },
  { question: "Are uploaded photographs private?", answer: "Your uploads are only used to generate your renovation concepts and are tied to your account." },
  { question: "Can I return to an older design version?", answer: "Yes. Every version you generate is saved so you can revisit it later." },
];

export default function RenovatePage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number] | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const categoryTitleId = useId();
  const categoryDescId = useId();

  const startRenovate = () => {
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
              HuzaEstate Renovate
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              See what your space could become.
            </h1>
            <p className="text-slate-600 text-lg leading-relaxed mt-6 max-w-xl">
              Upload photographs, a floor plan or a walkthrough of your existing property. Describe what you want to change and explore personalised renovation concepts with Huza AI.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-8">
              <button
                type="button"
                onClick={startRenovate}
                disabled={isNavigating}
                className="bg-slate-900 hover:bg-[#2ec440] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-[15px] px-8 py-4 rounded-full transition-all shadow-sm hover:-translate-y-0.5"
              >
                Renovate My Space
              </button>
              <button
                type="button"
                onClick={() => setDemoOpen(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[15px] px-8 py-4 rounded-full transition-all"
              >
                Watch Full Demo
              </button>
            </div>
            <p className="text-slate-400 text-sm mt-4">An account is required to upload, generate and save renovation concepts.</p>
          </div>

          <div className="lg:col-span-6 order-2">
            <ProcessVideoCard video={renovateVideos.overview} autoplayPreview aspectClassName="aspect-[4/3] sm:aspect-video" className="shadow-xl" />
          </div>
        </div>
      </section>

      {/* Section 2: Before-and-after preview */}
      <section className="w-full bg-[#f8fafc] py-16 sm:py-24 px-6 sm:px-10 md:px-12 border-t border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto">
          <Reveal className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">See the difference for yourself</h2>
            <p className="text-slate-600 text-lg leading-relaxed mt-4">Drag the handle, or use your keyboard&apos;s arrow keys, to compare an existing space with a renovation concept.</p>
          </Reveal>
          <Reveal delay={100}>
            <BeforeAfterSlider
              beforeSrc="/hero-house-white.jpg"
              afterSrc="/hero-house-final.jpg"
              beforeAlt="Existing living space before a HuzaEstate Renovate concept"
              afterAlt="Renovated living space concept generated with Huza AI"
            />
          </Reveal>
        </div>
      </section>

      {/* Section 3: How Renovate works */}
      <section className="w-full bg-white py-16 sm:py-24 px-6 sm:px-10 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          <Reveal className="max-w-2xl mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">How HuzaEstate Renovate works</h2>
            <p className="text-slate-600 text-lg leading-relaxed mt-4">
              You&apos;re guided from your existing space to a saved renovation direction that can be shared with a contractor.
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

      {/* Section 4: Renovation categories */}
      <section className="w-full bg-[#f8fafc] py-16 sm:py-24 px-6 sm:px-10 md:px-12 border-t border-b border-slate-200/60">
        <div className="max-w-[1400px] mx-auto">
          <Reveal className="max-w-2xl mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Renovation categories</h2>
            <p className="text-slate-600 text-lg leading-relaxed mt-4">Select a category to see what it typically needs and what you&apos;ll get back.</p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORIES.map((category, index) => (
              <Reveal key={category.id} delay={index * 40}>
                <button
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className="text-left w-full h-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ec440]"
                >
                  <div className="w-10 h-10 rounded-full bg-[#2ec440]/10 flex items-center justify-center text-[#2ec440] mb-4">
                    {category.icon}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{category.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{category.description}</p>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Renovation prompt preview */}
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
                “Redesign this living room in a warm contemporary style. Keep the windows and floor layout, add more storage, improve the lighting and use materials that are easy to source locally.”
              </div>

              <div className="self-start max-w-xl bg-white border border-slate-200 rounded-2xl rounded-tl-md px-5 py-5 shadow-sm">
                <p className="text-slate-900 font-bold text-sm mb-3">Huza AI understood:</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-slate-600 text-[15px]">
                  {[
                    "Keep existing windows",
                    "Preserve room layout",
                    "Add storage",
                    "Improve lighting",
                    "Warm contemporary style",
                    "Prefer local materials",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="text-[#2ec440] flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={startRenovate}
                disabled={isNavigating}
                className="bg-slate-900 hover:bg-[#2ec440] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-[15px] px-8 py-3.5 rounded-full transition-all"
              >
                Try This Renovation
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Section 6: What users receive */}
      <section className="w-full bg-[#f8fafc] py-16 sm:py-24 px-6 sm:px-10 md:px-12 border-t border-b border-slate-200/60">
        <div className="max-w-[1400px] mx-auto">
          <Reveal className="max-w-2xl mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">What you&apos;ll receive</h2>
            <p className="text-slate-600 text-lg leading-relaxed mt-4">Visual concepts help you plan. Structural or technical approval always comes from a qualified professional.</p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {RECEIVE_ITEMS.map((item, index) => (
              <Reveal key={item.title} delay={index * 50} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 h-full flex flex-col">
                <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7: Renovation safety */}
      <section className="w-full bg-slate-900 py-16 sm:py-24 px-6 sm:px-10 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          <Reveal className="max-w-2xl mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Some changes need professional review</h2>
            <p className="text-slate-300 text-lg leading-relaxed mt-4">
              Changes involving the following may require inspection or approval before work begins:
            </p>
          </Reveal>

          <Reveal delay={100} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
            {SAFETY_ITEMS.map((item) => (
              <div key={item} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white font-semibold text-sm text-center">
                {item}
              </div>
            ))}
          </Reveal>

          <Reveal delay={150} className="bg-white/5 border border-white/10 rounded-2xl px-6 py-5">
            <p className="text-slate-200 text-[15px] leading-relaxed">
              <span className="font-bold text-white">Important: </span>
              Huza AI renovation outputs are visual and planning concepts. Structural, electrical, plumbing and permit-related changes must be assessed by qualified professionals before work begins.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Section 8: FAQ */}
      <section className="w-full bg-white py-16 sm:py-24 px-6 sm:px-10 md:px-12">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Renovate FAQ</h2>
          </Reveal>
          <Reveal delay={100}>
            <Accordion items={FAQ_ITEMS} />
          </Reveal>
        </div>
      </section>

      {/* Section 9: Final CTA */}
      <section className="w-full bg-[#f8fafc] py-16 sm:py-24 px-6 sm:px-10 md:px-12 border-t border-slate-200/60">
        <Reveal className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Reimagine the home you already have.</h2>
          <p className="text-slate-600 text-lg leading-relaxed mb-10">Upload your space, explain what needs to change and explore a renovation direction before committing to the work.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={startRenovate}
              disabled={isNavigating}
              className="w-full sm:w-auto bg-slate-900 hover:bg-[#2ec440] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 px-10 rounded-xl transition-colors shadow-lg"
            >
              Renovate My Space
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
      <VideoModal video={renovateVideos.overview} open={demoOpen} onClose={() => setDemoOpen(false)} />

      {/* Auth-required modal */}
      <AuthRequiredModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="Sign in to renovate your space"
        description="Upload your property, generate renovation directions and save every version securely in your account."
        signInHref={`/login?redirect=${encodeURIComponent(STUDIO_PATH)}`}
        signUpHref={`/signup?redirect=${encodeURIComponent(STUDIO_PATH)}`}
      />

      {/* Category modal */}
      <Dialog
        open={activeCategory !== null}
        onClose={() => setActiveCategory(null)}
        labelledBy={categoryTitleId}
        describedBy={categoryDescId}
        panelClassName="max-w-lg"
      >
        {activeCategory && (
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2ec440]/10 flex items-center justify-center text-[#2ec440] flex-shrink-0">
                  {activeCategory.icon}
                </div>
                <h2 id={categoryTitleId} className="text-xl font-black text-slate-900">{activeCategory.title}</h2>
              </div>
              <button
                type="button"
                data-dialog-close
                onClick={() => setActiveCategory(null)}
                aria-label="Close category"
                className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ec440]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div id={categoryDescId} className="space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Typical inputs required</p>
                <p className="text-slate-600 text-[15px] leading-relaxed">{activeCategory.inputs}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Possible outputs</p>
                <p className="text-slate-600 text-[15px] leading-relaxed">{activeCategory.outputs}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveCategory(null);
                startRenovate();
              }}
              disabled={isNavigating}
              className="w-full mt-7 bg-slate-900 hover:bg-[#2ec440] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg"
            >
              Start This Renovation
            </button>
          </div>
        )}
      </Dialog>
    </div>
  );
}
