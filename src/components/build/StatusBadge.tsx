import { BuildProjectStatus, PROJECT_STATUS_LABELS, ReviewStatus, REVIEW_STATUS_LABELS } from "@/lib/build/types";

const PROJECT_STATUS_STYLES: Record<BuildProjectStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  brief_in_progress: "bg-amber-50 text-amber-700",
  ready_to_generate: "bg-blue-50 text-blue-700",
  generating: "bg-blue-50 text-blue-700",
  concepts_ready: "bg-[#2ec440]/10 text-[#2ec440]",
  refinement_in_progress: "bg-amber-50 text-amber-700",
  awaiting_professional_review: "bg-purple-50 text-purple-700",
  professionally_reviewed: "bg-[#2ec440]/10 text-[#2ec440]",
  archived: "bg-slate-100 text-slate-500",
};

export function StatusBadge({ status, className = "" }: { status: BuildProjectStatus; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${PROJECT_STATUS_STYLES[status]} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
      {PROJECT_STATUS_LABELS[status]}
    </span>
  );
}

const REVIEW_STATUS_STYLES: Record<ReviewStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  submitted: "bg-blue-50 text-blue-700",
  viewed: "bg-blue-50 text-blue-700",
  clarification_requested: "bg-purple-50 text-purple-700",
  accepted: "bg-blue-50 text-blue-700",
  in_review: "bg-amber-50 text-amber-700",
  changes_requested: "bg-amber-50 text-amber-700",
  resubmitted: "bg-purple-50 text-purple-700",
  completed: "bg-[#2ec440]/10 text-[#2ec440]",
  declined: "bg-red-50 text-red-600",
  cancelled: "bg-red-50 text-red-600",
};

export function ReviewStatusBadge({ status, className = "" }: { status: ReviewStatus; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${REVIEW_STATUS_STYLES[status]} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
      {REVIEW_STATUS_LABELS[status]}
    </span>
  );
}
