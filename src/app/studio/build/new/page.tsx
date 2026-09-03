"use client";

import { useId, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RequireAuth from "@/components/shared/RequireAuth";
import Dialog from "@/components/Dialog";
import { BuildProjectService } from "@/lib/build/projectService";
import { CreationMode } from "@/lib/build/types";

interface ModeOption {
  mode: CreationMode;
  title: string;
  description: string;
  bestFor: string;
  requires: string;
  outputs: string;
  icon: React.ReactNode;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    mode: "ai",
    title: "Design with Huza AI",
    description: "Describe your plot, household, style and budget. Huza AI will organise your brief and generate design directions.",
    bestFor: "You know roughly what you want but would rather describe it than fill in every field yourself.",
    requires: "A short description of your household, plot and priorities — Huza AI will ask about anything missing.",
    outputs: "A structured brief plus three generated concept directions to compare.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      </svg>
    ),
  },
  {
    mode: "manual",
    title: "Design Manually",
    description: "Start with an empty floor or a simple template, add rooms and shape your own conceptual layout.",
    bestFor: "You already have a layout in mind and prefer to place rooms yourself.",
    requires: "Nothing to start — you can add plot and budget details at any time as you design.",
    outputs: "A conceptual floor plan you can save as versions and later compare or refine.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.586l-2.35 7.65a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25v-4.353c0-.225-.034-.45-.1-.661l-2.35-7.65a2.25 2.25 0 00-2.15-1.586H15M9 3.75V3a2.25 2.25 0 012.25-2.25h1.5A2.25 2.25 0 0115 3v.75" />
      </svg>
    ),
  },
  {
    mode: "template",
    title: "Start from a Template",
    description: "Choose an existing house type and customise rooms, dimensions, style and finishes.",
    bestFor: "You want a proven starting layout to adjust rather than starting from a blank canvas.",
    requires: "Nothing — pick a template that's closest to your household size and go from there.",
    outputs: "A ready-made conceptual layout you can rename rooms, resize and rearrange freely.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
];

function NewProjectContent() {
  const router = useRouter();
  const [selected, setSelected] = useState<ModeOption | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const titleId = useId();

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!name.trim()) {
      setError("Give your project a name so you can find it later.");
      return;
    }
    setCreating(true);
    const project = BuildProjectService.create({ name, description, creationMode: selected.mode });
    const destination =
      selected.mode === "ai" ? `/studio/build/${project.id}/brief` : selected.mode === "manual" ? `/studio/build/${project.id}/designer` : `/studio/build/${project.id}/designer?pickTemplate=1`;
    router.push(destination);
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="max-w-6xl mx-auto px-6 sm:px-10 py-12 sm:py-16">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/studio/build" className="hover:text-slate-900 font-semibold transition-colors">
            My Build Projects
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-slate-900 font-semibold">New Project</span>
        </nav>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2ec440]/10 text-[#2ec440] font-semibold text-xs uppercase tracking-wide mb-5">
          HuzaEstate Build
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">How would you like to start?</h1>
        <p className="text-slate-600 text-lg leading-relaxed mb-10 max-w-2xl">
          Pick a starting point for your new project. You can switch to a different mode later without losing your work.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {MODE_OPTIONS.map((option) => (
            <div key={option.mode} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-[#2ec440] mb-5">{option.icon}</div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">{option.title}</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">{option.description}</p>

              <dl className="space-y-3 text-xs mb-6">
                <div>
                  <dt className="font-bold text-slate-400 uppercase tracking-wide mb-0.5">Best for</dt>
                  <dd className="text-slate-600 leading-relaxed">{option.bestFor}</dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-400 uppercase tracking-wide mb-0.5">Information required</dt>
                  <dd className="text-slate-600 leading-relaxed">{option.requires}</dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-400 uppercase tracking-wide mb-0.5">Expected outputs</dt>
                  <dd className="text-slate-600 leading-relaxed">{option.outputs}</dd>
                </div>
              </dl>

              <button
                type="button"
                onClick={() => {
                  setSelected(option);
                  setName("");
                  setDescription("");
                  setError("");
                }}
                className="mt-auto w-full bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
              >
                Select {option.title}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4">
          <svg className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16.5v-4.5m0-3.5h.008M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-slate-600 text-sm leading-relaxed">
            <span className="font-bold text-slate-900">Have an existing sketch? </span>
            You can upload it once your project is created, from either the Huza AI conversation or the Style step of your brief — no need to decide now.
          </p>
        </div>
      </section>

      <Dialog open={selected !== null} onClose={() => setSelected(null)} labelledBy={titleId} panelClassName="max-w-md">
        {selected && (
          <form onSubmit={handleCreate} className="p-6 sm:p-8">
            <h2 id={titleId} className="text-xl font-black text-slate-900 mb-1">
              {selected.title}
            </h2>
            <p className="text-slate-500 text-sm mb-6">Give your project a name to get started.</p>

            <label htmlFor="project-name" className="block text-sm font-bold text-slate-700 mb-2">
              Project name <span className="text-red-500">*</span>
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
            {error && <p className="text-red-600 text-sm font-semibold mb-3">{error}</p>}

            <label htmlFor="project-description" className="block text-sm font-bold text-slate-700 mb-2 mt-4">
              Description <span className="text-slate-400 font-medium">(optional)</span>
            </label>
            <textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="A short note to help you recognise this project later."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors resize-none"
            />

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
              <button type="button" onClick={() => setSelected(null)} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
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
      <NewProjectContent />
    </RequireAuth>
  );
}
