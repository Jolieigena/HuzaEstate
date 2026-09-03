"use client";

import { useState } from "react";
import Link from "next/link";
import { useBuildProjectContext } from "@/components/build/BuildProjectContext";
import { BuildProjectService } from "@/lib/build/projectService";
import { FeedbackSeverity, ProfessionalReviewRequest, REVIEW_TYPE_LABELS } from "@/lib/build/types";
import { formatDate, formatDateTime } from "@/lib/build/format";
import { useToast } from "@/lib/toast-context";
import { ReviewStatusBadge } from "@/components/build/StatusBadge";
import RequestReviewModal from "@/components/build/RequestReviewModal";
import ConfirmModal from "@/components/shared/ConfirmModal";

const SEVERITY_STYLES: Record<FeedbackSeverity, string> = {
  info: "bg-slate-100 text-slate-600",
  recommendation: "bg-blue-50 text-blue-700",
  issue: "bg-amber-50 text-amber-700",
  critical: "bg-red-50 text-red-700",
};

function FeedbackItem({ projectId, review, feedbackId }: { projectId: string; review: ProfessionalReviewRequest; feedbackId: string }) {
  const feedback = review.feedback.find((f) => f.id === feedbackId)!;
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState(feedback.reply ?? "");
  const { showToast } = useToast();

  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-sm font-bold text-slate-900">{feedback.authorName}</p>
          <p className="text-xs text-slate-400">{feedback.authorProfession} · {formatDateTime(feedback.createdAt)}</p>
        </div>
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${SEVERITY_STYLES[feedback.severity]}`}>{feedback.severity}</span>
      </div>
      <p className="text-sm text-slate-700 mb-2">{feedback.comment}</p>
      {feedback.relatedFloor && <p className="text-xs text-slate-400 mb-2">Related to: {feedback.relatedFloor}</p>}
      {feedback.reply && !replyOpen && <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 mb-2">Your reply: {feedback.reply}</div>}

      {replyOpen && (
        <div className="mb-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 resize-none"
          />
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => {
                BuildProjectService.replyToFeedback(projectId, review.id, feedback.id, replyText);
                setReplyOpen(false);
                showToast("Reply sent.");
              }}
              className="text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg"
            >
              Send Reply
            </button>
            <button type="button" onClick={() => setReplyOpen(false)} className="text-xs font-bold text-slate-500 px-3 py-1.5">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        {!replyOpen && (
          <button type="button" onClick={() => setReplyOpen(true)} className="text-xs font-bold text-[#2ec440] hover:text-[#28b039]">
            Reply
          </button>
        )}
        <button
          type="button"
          onClick={() => BuildProjectService.markFeedbackAddressed(projectId, review.id, feedback.id, !feedback.addressed)}
          className="text-xs font-bold text-slate-500 hover:text-slate-800"
        >
          {feedback.addressed ? "Marked as addressed" : "Mark as addressed"}
        </button>
        <Link href={`/studio/build/${projectId}/designer`} className="text-xs font-bold text-slate-500 hover:text-slate-800">
          Create revision
        </Link>
      </div>
    </div>
  );
}

export default function ProfessionalsPage() {
  const project = useBuildProjectContext();
  const { showToast } = useToast();
  const [requestOpen, setRequestOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<ProfessionalReviewRequest | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 mb-1">Professional review</h1>
          <p className="text-slate-500 text-sm max-w-xl">
            Huza AI produces conceptual design directions, not approved construction drawings. A qualified professional should review your design before construction begins.
          </p>
        </div>
        <button type="button" onClick={() => setRequestOpen(true)} className="bg-slate-900 hover:bg-[#2ec440] text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-lg whitespace-nowrap">
          Request Professional Review
        </button>
      </div>

      {project.reviewRequests.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-12 text-center">
          <p className="text-slate-500">No professional reviews requested yet.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {project.reviewRequests.map((review) => (
            <div key={review.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-bold text-slate-900">{REVIEW_TYPE_LABELS[review.type]}</h2>
                    <ReviewStatusBadge status={review.status} />
                  </div>
                  <p className="text-sm text-slate-500">
                    {review.professional ? `${review.professional.name} · ${review.professional.profession}` : "Awaiting assignment"} · Requested {formatDate(review.submittedAt)}
                  </p>
                </div>
                {review.status !== "cancelled" && review.status !== "completed" && (
                  <button type="button" onClick={() => setCancelTarget(review)} className="text-sm font-bold text-red-500 hover:text-red-700">
                    Cancel Request
                  </button>
                )}
              </div>

              {review.notes && <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 mb-4">{review.notes}</p>}

              {review.feedback.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Feedback</p>
                  {review.feedback.map((f) => (
                    <FeedbackItem key={f.id} projectId={project.id} review={review} feedbackId={f.id} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <RequestReviewModal project={project} open={requestOpen} onClose={() => setRequestOpen(false)} />

      <ConfirmModal
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        title="Cancel review request?"
        description="The assigned professional will be notified this request is no longer active. Any feedback already given will remain visible."
        confirmLabel="Cancel Request"
        destructive
        onConfirm={() => {
          if (!cancelTarget) return;
          BuildProjectService.cancelReview(project.id, cancelTarget.id);
          showToast("Review request cancelled.");
          setCancelTarget(null);
        }}
      />
    </div>
  );
}
