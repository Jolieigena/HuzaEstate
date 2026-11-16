"use client";

import { useId, useState } from "react";
import Dialog from "@/components/Dialog";
import { BuildProject, REVIEW_TYPE_LABELS, ReviewType } from "@/lib/build/types";
import { useAuth } from "@/lib/auth-context";
import ProfessionalPicker from "@/components/shared/ProfessionalPicker";
import { submitProfessionalContact, type RealProfessionalProfile } from "@/lib/professional/api";
import { BuildProjectService } from "@/lib/build/projectService";
import { useToast } from "@/lib/toast-context";

const STEP_LABELS = ["Professional", "Review type", "Project version", "Documents", "Notes", "Review request"];

export default function RequestReviewModal({ project, open, onClose }: { project: BuildProject; open: boolean; onClose: () => void }) {
  const { showToast } = useToast();
  const titleId = useId();
  const [step, setStep] = useState(0);
  const [reviewType, setReviewType] = useState<ReviewType | null>(null);
  const [versionId, setVersionId] = useState<string>("current");
  const [documentIds, setDocumentIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [picked, setPicked] = useState<RealProfessionalProfile | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const { account } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  const reset = () => {
    setStep(0);
    setReviewType(null);
    setVersionId("current");
    setDocumentIds([]);
    setNotes("");
    setPicked(null);
    setError("");
    setSubmitted(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const professional = picked
    ? { id: picked.accountId, name: picked.displayName, profession: picked.specialisations?.join(", ") || picked.specialisation, location: picked.city, verified: false, rating: picked.averageRating ?? 0, completedReviews: picked.reviewCount ?? 0, estimatedResponseTime: "3-5 business days", avatar: picked.photoUrl }
    : null;

  const canAdvance = [picked !== null, reviewType !== null, true, true, true, true][step];

  const handleSubmit = async () => {
    if (!reviewType || !picked || sending) return;
    setSending(true);
    setError("");
    const result = await submitProfessionalContact(picked.accountId, {
      name: account?.name || "Huza Estate customer",
      email: account?.email ?? "",
      phone: account?.phone,
      message: `Design review request: ${REVIEW_TYPE_LABELS[reviewType]} for my project "${project.name}" on Huza Estate.${notes.trim() ? `\n\nQuestions: ${notes.trim()}` : ""}`,
    });
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    BuildProjectService.requestReview(project.id, {
      type: reviewType,
      professional,
      versionId: versionId === "current" ? null : versionId,
      attachedDocumentIds: documentIds,
      notes,
      estimatedResponseTime: professional?.estimatedResponseTime ?? "3-5 business days",
    });
    setSubmitted(true);
    showToast("Professional review requested.");
  };

  return (
    <Dialog open={open} onClose={handleClose} labelledBy={titleId} panelClassName="max-w-xl">
      <div className="p-6 sm:p-8">
        {submitted ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-2xl bg-[#2ec440]/10 text-[#2ec440] flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 id={titleId} className="text-xl font-black text-slate-900 mb-2">
              Review requested
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              Your {reviewType ? REVIEW_TYPE_LABELS[reviewType].toLowerCase() : "review"} request has been submitted{professional ? ` to ${professional.name}` : ""}. You&apos;ll see updates on the Professionals page.
            </p>
            <button type="button" onClick={handleClose} className="bg-slate-900 hover:bg-[#2ec440] text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-lg">
              Done
            </button>
          </div>
        ) : (
          <>
            <h2 id={titleId} className="text-xl font-black text-slate-900 mb-1">
              Request professional review
            </h2>
            <p className="text-slate-500 text-sm mb-5">
              Step {step + 1} of {STEP_LABELS.length}: {STEP_LABELS[step]}
            </p>

            <div className="min-h-[220px]">
              {step === 1 && (
                <div className="grid sm:grid-cols-2 gap-2">
                  {(Object.entries(REVIEW_TYPE_LABELS) as [ReviewType, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setReviewType(key)}
                      aria-pressed={reviewType === key}
                      className={`px-4 py-3 rounded-xl text-sm font-semibold border text-left transition-colors ${
                        reviewType === key ? "bg-[#2ec440]/10 border-[#2ec440] text-[#2ec440]" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-2">
                  <label className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 cursor-pointer">
                    <input type="radio" name="version" checked={versionId === "current"} onChange={() => setVersionId("current")} className="accent-[#2ec440]" />
                    <span className="text-sm font-semibold text-slate-700">Current project state</span>
                  </label>
                  {project.versions.map((v) => (
                    <label key={v.id} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 cursor-pointer">
                      <input type="radio" name="version" checked={versionId === v.id} onChange={() => setVersionId(v.id)} className="accent-[#2ec440]" />
                      <span className="text-sm font-semibold text-slate-700">
                        Version {v.number} — {v.changeSummary}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-2">
                  {project.documents.length === 0 ? (
                    <p className="text-sm text-slate-500">No documents available yet — you can still request a review and add documents later.</p>
                  ) : (
                    project.documents.map((doc) => (
                      <label key={doc.id} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={documentIds.includes(doc.id)}
                          onChange={() => setDocumentIds((prev) => (prev.includes(doc.id) ? prev.filter((id) => id !== doc.id) : [...prev, doc.id]))}
                          className="accent-[#2ec440]"
                        />
                        <span className="text-sm font-semibold text-slate-700">{doc.name}</span>
                      </label>
                    ))
                  )}
                </div>
              )}

              {step === 4 && (
                <div>
                  <label htmlFor="review-notes" className="block text-sm font-bold text-slate-700 mb-2">
                    Notes and questions for the professional
                  </label>
                  <textarea
                    id="review-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={5}
                    placeholder="e.g. Please check whether the first-floor layout works for a family with teenagers."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] resize-none"
                  />
                </div>
              )}

              {step === 0 && <ProfessionalPicker selectedId={picked?.accountId ?? null} onPick={setPicked} />}
              {step === 5 && (
                <dl className="bg-slate-50 border border-slate-200 rounded-2xl p-5 grid grid-cols-2 gap-y-3 text-sm">
                  <dt className="text-slate-500">Review type</dt>
                  <dd className="text-right font-semibold text-slate-900">{reviewType ? REVIEW_TYPE_LABELS[reviewType] : "—"}</dd>
                  <dt className="text-slate-500">Professional</dt>
                  <dd className="text-right font-semibold text-slate-900">{professional?.name ?? "—"}</dd>
                  <dt className="text-slate-500">Version</dt>
                  <dd className="text-right font-semibold text-slate-900">{versionId === "current" ? "Current state" : `Version ${project.versions.find((v) => v.id === versionId)?.number}`}</dd>
                  <dt className="text-slate-500">Attachments</dt>
                  <dd className="text-right font-semibold text-slate-900">{documentIds.length} document{documentIds.length === 1 ? "" : "s"}</dd>
                  <dt className="text-slate-500">Questions</dt>
                  <dd className="text-right font-semibold text-slate-900">{notes ? "Included" : "None added"}</dd>
                  <dt className="text-slate-500">Estimated response</dt>
                  <dd className="text-right font-semibold text-slate-900">{professional?.estimatedResponseTime ?? "3-5 business days"}</dd>
                </dl>
              )}
            </div>

            {error && (
              <p className="mt-3 text-sm font-semibold text-red-600" role="alert">
                {error}
              </p>
            )}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-6">
              <button
                type="button"
                onClick={() => (step === 0 ? handleClose() : setStep(step - 1))}
                className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                {step === 0 ? "Cancel" : "Back"}
              </button>
              {step < STEP_LABELS.length - 1 ? (
                <button
                  type="button"
                  disabled={!canAdvance}
                  onClick={() => setStep(step + 1)}
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-[#2ec440] disabled:opacity-50 text-white font-bold transition-colors shadow-lg"
                >
                  Continue
                </button>
              ) : (
                <button type="button" disabled={sending} onClick={handleSubmit} className="disabled:opacity-50 px-6 py-3 rounded-xl bg-slate-900 hover:bg-[#2ec440] text-white font-bold transition-colors shadow-lg">
                  {sending ? "Sending…" : "Submit Request"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
