"use client";

import { Suspense, useEffect, useRef, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import RequireAuth from "@/components/shared/RequireAuth";
import { BuildProjectService } from "@/lib/build/projectService";
import { briefFromPrompt, projectNameFromPrompt } from "@/lib/build/briefFromPrompt";
import { isBlankDraft } from "@/lib/build/format";

const SPARKLE_PATH =
  "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z";
function Icon({ path, className = "w-5 h-5" }: { path: string; className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={path} />
    </svg>
  );
}

const EXAMPLE_PROMPTS = [
  "A compact three-bedroom family home on a 300 sqm plot in Kigali",
  "A two-floor house with a home office, a garden and two parking spaces",
  "A modern villa with a pool, six bedrooms and staff quarters",
];

/** A project name made from what the visitor typed: the words, capitalised and kept short, so nobody has to name it first. */
function nameFromBrief(brief: string): string {
  const text = brief.trim().replace(/\s+/g, " ");
  if (!text) return "My home design";
  // Kept short, and cut between words, so the name still fits in the page header.
  const cut = text.length > 32 ? `${text.slice(0, 32).replace(/\s+\S*$/, "").trim()}…` : text;
  return cut.charAt(0).toUpperCase() + cut.slice(1);
}

function NewProjectContent() {
  const router = useRouter();
  // Arriving from the Build page or from a designs search that found nothing: the words they started with are already in the box.
  const params = useSearchParams();
  const [prompt, setPrompt] = useState(() => (params.get("brief") ?? "").slice(0, 500));
  const [creating, setCreating] = useState(false);

  // The brief is the first thing a new project shows: opening this page creates a Huza AI project and goes straight there. The
  // choice of how to start (a prompt box, manual, template) is only shown when asked for with ?choose=1.
  const choose = params.get("choose") === "1";
  const autoStarted = useRef(false);
  useEffect(() => {
    if (choose || autoStarted.current) return;
    autoStarted.current = true;
    const words = (params.get("brief") ?? "").slice(0, 500);
    // With nothing typed, a project that was opened before and never filled in is opened again instead of adding another blank one.
    const blank = words.trim() ? undefined : BuildProjectService.getAll().find((p) => isBlankDraft(p) && p.creationMode === "ai");
    if (blank) {
      router.replace(`/studio/build/${blank.id}/brief`);
      return;
    }
    const project = BuildProjectService.create({ name: projectNameFromPrompt(words) || nameFromBrief(words), description: words.trim(), creationMode: "ai" });
    if (words.trim()) BuildProjectService.saveBrief(project.id, briefFromPrompt(project.brief, words), "Filled in from the description.");
    router.replace(`/studio/build/${project.id}/brief`);
  }, [choose, params, router]);

  const startWithAi = (e: FormEvent) => {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    const project = BuildProjectService.create({ name: projectNameFromPrompt(prompt) || nameFromBrief(prompt), description: prompt.trim(), creationMode: "ai" });
    if (prompt.trim()) BuildProjectService.saveBrief(project.id, briefFromPrompt(project.brief, prompt), "Filled in from the description.");
    router.push(`/studio/build/${project.id}/brief`);
  };

  if (!choose) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm font-semibold text-slate-500" role="status">
        Setting up your project…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="max-w-4xl mx-auto px-6 sm:px-10 py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500 mb-8">
          <Link href="/studio/build" className="hover:text-slate-900 font-semibold transition-colors">
            My Build Projects
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-slate-900 font-semibold">New Project</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-8">What would you like to build?</h1>

        {/* The main way in: say it in your own words */}
        <form onSubmit={startWithAi} className="relative overflow-hidden rounded-3xl border border-[#2ec440]/20 bg-gradient-to-br from-[#2ec440]/[0.07] via-white to-white p-5 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2ec440] text-white shadow-sm">
              <Icon path={SPARKLE_PATH} />
            </span>
            <label htmlFor="build-prompt" className="text-lg font-bold text-slate-900">
              Design with Huza AI
            </label>
          </div>

          <textarea
            id="build-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
            rows={4}
            autoFocus
            placeholder="Describe your plot, who will live in the home, the style you like and your budget…"
            className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 text-[15px] leading-relaxed text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-[#2ec440] focus:outline-none focus:ring-4 focus:ring-[#2ec440]/15 transition"
          />

          <div className="mt-4 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setPrompt(example)}
                  className="max-w-full truncate rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-[#2ec440] hover:text-[#219b31]"
                >
                  {example}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-7 py-3.5 text-[15px] font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440] disabled:opacity-60"
            >
              {creating ? "Starting…" : "Start designing"}
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function BuildStudioNewPage() {
  return (
    <RequireAuth>
      <Suspense fallback={null}>
        <NewProjectContent />
      </Suspense>
    </RequireAuth>
  );
}
