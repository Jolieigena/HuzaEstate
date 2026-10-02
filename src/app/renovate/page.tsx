"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Reveal from "@/components/Reveal";
import Accordion from "@/components/Accordion";
import AuthRequiredModal from "@/components/AuthRequiredModal";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import { ProcessVideoCard, VideoModal } from "@/components/ProcessVideo";
import { useAuth } from "@/lib/auth-context";
import { renovateVideos } from "@/lib/videos";

const STUDIO_PATH = "/studio/renovate/new";

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
  const [isNavigating, setIsNavigating] = useState(false);
  const [demoStage, setDemoStage] = useState(0);

  const startRenovate = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.push(STUDIO_PATH);
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
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1]">
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
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">See the difference for yourself</h2>
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

      {/* Section 5: Renovation prompt preview */}
      <section className="w-full bg-white py-16 sm:py-24 px-6 sm:px-10 md:px-12">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">See Huza AI in action</h2>
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

            <div className="mt-8 flex flex-col items-center">
              {demoStage === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setDemoStage(1);
                    setTimeout(() => setDemoStage(2), 2500);
                  }}
                  className="bg-slate-900 hover:bg-[#2ec440] text-white font-bold text-[15px] px-8 py-3.5 rounded-full transition-all"
                >
                  Try This Prompt
                </button>
              )}
              {demoStage === 1 && (
                <div className="flex items-center gap-3 text-slate-700 font-bold text-[15px] bg-slate-50 border border-slate-200 px-6 py-3 rounded-full">
                  <div className="flex items-center gap-1">
                    {[0,1,2].map((i) => (
                      <span key={i} className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
                    ))}
                  </div>
                  Huza AI is generating your concepts...
                </div>
              )}
            </div>

            {demoStage === 2 && (
              <Reveal className="mt-6 self-start max-w-4xl bg-white border border-slate-200 rounded-2xl rounded-tl-md p-6 shadow-sm">
                <p className="text-slate-900 font-bold text-sm mb-4">Huza AI generated these concepts:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="rounded-xl overflow-hidden border border-slate-200">
                    <div className="relative aspect-video">
                      <Image src="/hero-house-final.jpg" alt="Option 1" fill className="object-cover" />
                    </div>
                    <div className="p-3 bg-slate-50 text-sm font-semibold text-slate-700">Option 1: Warm Contemporary</div>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-slate-200">
                    <div className="relative aspect-video">
                      <Image src="/hero-house.png" alt="Option 2" fill className="object-cover" />
                    </div>
                    <div className="p-3 bg-slate-50 text-sm font-semibold text-slate-700">Option 2: Minimalist Natural</div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => setDemoStage(0)} className="px-5 py-2 rounded-full font-bold text-slate-600 hover:bg-slate-100 transition-colors text-sm border border-slate-200">Reset Demo</button>
                  <button onClick={startRenovate} className="bg-[#2ec440] hover:bg-[#28b039] text-white px-5 py-2 rounded-full font-bold transition-colors text-sm shadow-sm">Start Your Renovation →</button>
                </div>
              </Reveal>
            )}
          </Reveal>
        </div>
      </section>

      {/* Section 6: What users receive */}
      <section className="w-full bg-[#f8fafc] py-16 sm:py-24 px-6 sm:px-10 md:px-12 border-t border-b border-slate-200/60">
        <div className="max-w-[1400px] mx-auto">
          <Reveal className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">What you&apos;ll receive</h2>
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
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Some changes need professional review</h2>
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
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Renovate FAQ</h2>
          </Reveal>
          <Reveal delay={100}>
            <Accordion items={FAQ_ITEMS} />
          </Reveal>
        </div>
      </section>

      {/* Section 9: Final CTA */}
      <section className="w-full bg-[#f8fafc] py-16 sm:py-24 px-6 sm:px-10 md:px-12 border-t border-slate-200/60">
        <Reveal className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-4">Reimagine the home you already have.</h2>
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

    </div>
  );
}
