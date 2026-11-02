"use client";

import { Suspense, useId, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import RequireAuth from "@/components/shared/RequireAuth";
import Dialog from "@/components/Dialog";
import { BuildProjectService } from "@/lib/build/projectService";
import { CreationMode } from "@/lib/build/types";

const SPARKLE_PATH =
  "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z";
const PENCIL_PATH =
  "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10";
const GRID_PATH =
  "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z";

function Icon({ path, className = "w-5 h-5" }: { path: string; className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={path} />
    </svg>
  );
}

// Two other ways to start, for people who would rather place the rooms themselves.
const OTHER_WAYS: { mode: Exclude<CreationMode, "ai">; title: string; line: string; path: string }[] = [
  { mode: "manual", title: "Design it manually", line: "Start from an empty floor and place the rooms yourself.", path: PENCIL_PATH },
  { mode: "template", title: "Start from a template", line: "Pick a house type close to yours and adjust it.", path: GRID_PATH },
];

const EXAMPLE_PROMPTS = [
  "A compact three-bedroom family home on a 300 sqm plot in Kigali",
  "A two-floor house with a home office, a garden and two parking spaces",
  "A modern villa with a pool, six bedrooms and staff quarters",
];

/** A project name made from what the visitor typed: the words, capitalised and kept short, so nobody has to name it first. */
function nameFromBrief(brief: string): string {
  const text = brief.trim().replace(/\s+/g, " ");
  if (!text) return "My home design";
  const cut = text.length > 40 ? `${text.slice(0, 37).trim()}…` : text;
  return cut.charAt(0).toUpperCase() + cut.slice(1);
}

function NewProjectContent() {
  const router = useRouter();
  // Arriving from the Build page or from a designs search that found nothing: the words they started with are already in the box.
  const params = useSearchParams();
  const [prompt, setPrompt] = useState(() => (params.get("brief") ?? "").slice(0, 500));
  const [creating, setCreating] = useState(false);

  // Manual and template projects still ask for a name first.
  const [picked, setPicked] = useState<(typeof OTHER_WAYS)[number] | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const titleId = useId();

  const startWithAi = (e: FormEvent) => {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    const project = BuildProjectService.create({ name: nameFromBrief(prompt), description: prompt.trim(), creationMode: "ai" });
    router.push(`/studio/build/${project.id}/brief`);
  };

  const createOther = (e: FormEvent) => {
    e.preventDefault();
    if (!picked) return;
    if (!name.trim()) {
      setError("Give your project a name so you can find it later.");
      return;
    }
    setCreating(true);
    const project = BuildProjectService.create({ name, description: "", creationMode: picked.mode });
    router.push(picked.mode === "manual" ? `/studio/build/${project.id}/designer` : `/studio/build/${project.id}/designer?pickTemplate=1`);
  };

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

        {/* The other two ways */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {OTHER_WAYS.map((way) => (
            <button
              key={way.mode}
              type="button"
              onClick={() => {
                setPicked(way);
                setName("");
                setError("");
              }}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 transition-colors group-hover:bg-[#2ec440]/10 group-hover:text-[#2ec440]">
                <Icon path={way.path} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-slate-900">{way.title}</span>
                <span className="mt-0.5 block text-sm text-slate-500">{way.line}</span>
              </span>
              <svg className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </section>

      <Dialog open={picked !== null} onClose={() => setPicked(null)} labelledBy={titleId} panelClassName="max-w-md">
        {picked && (
          <form onSubmit={createOther} className="p-6 sm:p-8">
            <h2 id={titleId} className="text-xl font-black text-slate-900 mb-5">
              {picked.title}
            </h2>

            <label htmlFor="project-name" className="block text-sm font-bold text-slate-700 mb-2">
              Project name
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. Kigali Family Home"
              autoFocus
              aria-invalid={Boolean(error)}
              className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors mb-1 ${error ? "border-red-300" : "border-slate-200"}`}
            />
            {error && <p className="text-red-600 text-sm font-semibold">{error}</p>}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
              <button type="button" onClick={() => setPicked(null)} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
                Back
              </button>
              <button type="submit" disabled={creating} className="px-5 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-[#2ec440] transition-colors shadow-lg disabled:opacity-60">
                {creating ? "Creating…" : "Create Project"}
              </button>
            </div>
          </form>
        )}
      </Dialog>
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
