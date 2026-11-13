"use client";

import { useEffect, useRef, useState } from "react";
/* eslint-disable @next/next/no-img-element */
import { useBuildProjectContext } from "@/components/build/BuildProjectContext";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import EditPanel from "@/components/shared/EditPanel";
import type { Attachment } from "@/lib/ai/attachments";
import { BuildProjectService } from "@/lib/build/projectService";
import { createFullDesign, FULL_DESIGN_VIEWS } from "@/lib/build/fullDesignApi";
import { FullDesign } from "@/lib/build/types";

/** The full design: the AI describes the whole house from the chosen plan and draws it, outside and in. */
export default function FullDesignPage() {
  const project = useBuildProjectContext();
  const { token } = useAuth();
  const { showToast } = useToast();
  const [working, setWorking] = useState<FullDesign | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const runningRef = useRef(false);
  const autoRef = useRef(false);

  const concept = project.concepts.find((c) => c.id === project.selectedConceptId) ?? project.concepts[project.concepts.length - 1];
  const design = busy ? working : project.fullDesign ?? null;

  const start = async (request?: string, attachments?: Attachment[]): Promise<string | null> => {
    if (!concept || !token || runningRef.current) return "Please wait for the current design to finish.";
    runningRef.current = true;
    setBusy(true);
    setError("");
    setWorking(null);
    let problem: string | null = null;
    const previous = request ? project.fullDesign ?? undefined : undefined;
    const outcome = await createFullDesign(token, project.brief, concept.floors, concept.id, setWorking, request && previous ? { request, previous, attachments } : undefined);
    if (outcome.ok) {
      BuildProjectService.saveFullDesign(project.id, outcome.design);
      if (outcome.design.pictures.length < FULL_DESIGN_VIEWS.length) showToast("Some pictures could not be made. You can make the full design again.", "info");
    } else {
      problem = outcome.unavailable ? "AI is not switched on yet." : outcome.error;
      setError(problem);
    }
    setBusy(false);
    runningRef.current = false;
    return problem;
  };

  // The first visit makes the design straight away, so there is nothing to press; after that, the person decides.
  useEffect(() => {
    if (autoRef.current || project.fullDesign || !concept || !token) return;
    autoRef.current = true;
    void start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concept?.id, token]);

  if (!concept) {
    return <p className="text-sm font-semibold text-slate-500">Choose a floor plan first.</p>;
  }

  const shown = design?.pictures ?? [];
  const done = (key: string) => shown.find((p) => p.key === key);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-black text-slate-900">Full design</h1>
        <div className="flex flex-col gap-2 sm:flex-row">
          {project.fullDesign && (
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              disabled={busy || !token}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Edit design
            </button>
          )}
          <button
            type="button"
            onClick={() => void start()}
            disabled={busy || !token}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#2ec440] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            {busy ? "Designing your house…" : project.fullDesign ? "Make a new full design" : "Create full design"}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {design && <p className="text-base font-semibold text-slate-800">{design.summary}</p>}

      {(design || busy) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {FULL_DESIGN_VIEWS.map((view, index) => {
            const picture = done(view.key);
            const wide = index === 0;
            return (
              <figure key={view.key} className={wide ? "sm:col-span-2" : ""}>
                {picture ? (
                  <img src={picture.url} alt={view.label} className="aspect-[16/10] w-full rounded-2xl bg-slate-100 object-cover" />
                ) : (
                  <div className={`aspect-[16/10] w-full rounded-2xl bg-slate-100 ${busy ? "animate-pulse" : ""}`} />
                )}
                <figcaption className="mt-2 text-sm font-bold text-slate-600">{view.label}</figcaption>
              </figure>
            );
          })}
        </div>
      )}

      {design && design.items.length > 0 && (
        <section className="break-inside-avoid">
          <h2 className="mb-3 text-lg font-black text-slate-900">Specification</h2>
          <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white">
            {design.items.map((item) => (
              <div key={item.label} className="grid gap-1 px-5 py-3 sm:grid-cols-[12rem_1fr] sm:gap-4">
                <dt className="text-sm font-bold text-slate-900">{item.label}</dt>
                <dd className="text-sm text-slate-600">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      <EditPanel
        storageKey={`build-full:${project.id}`}
        doneText="Done. Your full design was changed."
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit full design"
        suggestions={["Change the roof to red tiles", "Make the house look more modern", "Use stone on the front wall", "Add a balcony upstairs", "Paint the walls light grey", "Add more garden and trees"]}
        placeholder="e.g. Make the roof dark grey and add a covered terrace"
        onSubmit={(request, attachments) => start(request, attachments)}
      />
    </div>
  );
}
