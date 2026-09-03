"use client";

import { useId, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RequireAuth from "@/components/shared/RequireAuth";
import Dialog from "@/components/Dialog";
import PropertySelector from "@/components/renovate/PropertySelector";
import { RenovationProjectService } from "@/lib/renovate/projectService";
import { RenovationCreationMode, RenovationProject, RenovationPropertyInfo } from "@/lib/renovate/types";
import type { MyProperty } from "@/lib/myProperties";
import { useToast } from "@/lib/toast-context";

interface ModeOption {
  mode: RenovationCreationMode;
  title: string;
  description: string;
  bestFor: string;
  requires: string;
  outputs: string;
  changeable: string;
  icon: React.ReactNode;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    mode: "ai",
    title: "Renovate with Huza AI",
    description: "Upload photographs or plans, describe what you want to change and let Huza AI create renovation directions.",
    bestFor: "You know roughly what you want changed but would rather describe it than plan every detail yourself.",
    requires: "Photos of the space (optional but helpful), the areas you want to change and a rough budget.",
    outputs: "A structured brief plus three generated before-and-after concepts to compare.",
    changeable: "You can switch to manual planning at any time without losing your work.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      </svg>
    ),
  },
  {
    mode: "manual",
    title: "Plan Manually",
    description: "Organise rooms, finishes, work items and inspiration yourself before requesting professional support.",
    bestFor: "You already know what you want to change and prefer to organise it room by room.",
    requires: "Nothing to start — you can add photos, materials and notes at any time as you plan.",
    outputs: "A room-by-room mood board you can save as versions and later compare or refine.",
    changeable: "You can bring in Huza AI for suggestions at any point.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.586l-2.35 7.65a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25v-4.353c0-.225-.034-.45-.1-.661l-2.35-7.65a2.25 2.25 0 00-2.15-1.586H15M9 3.75V3a2.25 2.25 0 012.25-2.25h1.5A2.25 2.25 0 0115 3v.75" />
      </svg>
    ),
  },
  {
    mode: "inspiration",
    title: "Start from Inspiration",
    description: "Choose a renovation style or sample project and adapt it to your property.",
    bestFor: "You have a look in mind but aren't sure how to translate it into a plan for your specific property.",
    requires: "Nothing to start — pick a style direction that's closest to what you want and refine it from there.",
    outputs: "A pre-filled style and area starting point you can adjust freely during the assessment.",
    changeable: "You can move to Huza AI or manual planning at any time.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
  },
];

type FlowStep = "mode" | "property";

function NewProjectContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const [selected, setSelected] = useState<ModeOption | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState<FlowStep>("mode");
  const [project, setProject] = useState<RenovationProject | null>(null);

  const titleId = useId();

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!name.trim()) {
      setError("Give your project a name so you can find it later.");
      return;
    }
    setCreating(true);
    const created = RenovationProjectService.create({ name, description, creationMode: selected.mode });
    RenovationProjectService.beginPropertySetup(created.id);
    setProject(created);
    setStep("property");
    setCreating(false);
    showToast("Renovation project created.");
  };

  const goToAssessment = (id: string) => {
    router.push(`/studio/renovate/${id}/assessment`);
  };

  if (step === "property" && project) {
    return (
      <div className="min-h-screen bg-white">
        <section className="max-w-5xl mx-auto px-6 sm:px-10 py-12 sm:py-16">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500 mb-6">
            <Link href="/studio/renovate" className="hover:text-slate-900 font-semibold transition-colors">
              My Renovation Projects
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-slate-900 font-semibold">{project.name}</span>
          </nav>

          <PropertySelector
            onSelectOwned={(myProperty: MyProperty) => {
              RenovationProjectService.selectOwnedProperty(project.id, myProperty);
              showToast("Property selected.");
              goToAssessment(project.id);
            }}
            onRegister={(propertyInfo: RenovationPropertyInfo) => {
              RenovationProjectService.registerProperty(project.id, propertyInfo);
              showToast("Property registered.");
              goToAssessment(project.id);
            }}
          />
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="max-w-6xl mx-auto px-6 sm:px-10 py-12 sm:py-16">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/studio/renovate" className="hover:text-slate-900 font-semibold transition-colors">
            My Renovation Projects
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-slate-900 font-semibold">New Project</span>
        </nav>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2ec440]/10 text-[#2ec440] font-semibold text-xs uppercase tracking-wide mb-5">
          HuzaEstate Renovate
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">How would you like to start?</h1>
        <p className="text-slate-600 text-lg leading-relaxed mb-10 max-w-2xl">
          Pick a starting point for your renovation project. You can switch to a different mode later without losing your work.
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
                <div>
                  <dt className="font-bold text-slate-400 uppercase tracking-wide mb-0.5">Can I change later?</dt>
                  <dd className="text-slate-600 leading-relaxed">{option.changeable}</dd>
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
      </section>

      <Dialog open={selected !== null} onClose={() => setSelected(null)} labelledBy={titleId} panelClassName="max-w-md">
        {selected && (
          <form onSubmit={handleCreate} className="p-6 sm:p-8">
            <h2 id={titleId} className="text-xl font-black text-slate-900 mb-1">
              {selected.title}
            </h2>
            <p className="text-slate-500 text-sm mb-6">Give your renovation project a name to get started.</p>

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
              placeholder="e.g. Kitchen Refresh"
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

export default function RenovateStudioNewPage() {
  return (
    <RequireAuth>
      <NewProjectContent />
    </RequireAuth>
  );
}
