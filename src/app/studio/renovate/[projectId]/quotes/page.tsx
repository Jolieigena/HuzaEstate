"use client";

import { useState } from "react";
import Link from "next/link";
import { useRenovationProjectContext } from "@/components/renovate/RenovationProjectContext";
import { RenovationProjectService } from "@/lib/renovate/projectService";
import { ContractorQuotation } from "@/lib/renovate/types";
import { useToast } from "@/lib/toast-context";
import QuotationCard from "@/components/renovate/QuotationCard";
import CompareQuotationsTable from "@/components/renovate/CompareQuotationsTable";
import RequestQuotationsModal from "@/components/renovate/RequestQuotationsModal";
import AcceptQuotationModal from "@/components/renovate/AcceptQuotationModal";
import ConfirmModal from "@/components/shared/ConfirmModal";

export default function QuotesPage() {
  const project = useRenovationProjectContext();
  const { showToast } = useToast();
  const [requestOpen, setRequestOpen] = useState(false);
  const [acceptTarget, setAcceptTarget] = useState<ContractorQuotation | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [view, setView] = useState<"cards" | "compare">("cards");

  const scopeConfirmed = project.scope.length > 0;
  const budgetConfirmed = project.budget !== null;
  const conceptSelected = project.selectedConceptId !== null;
  const safetyFlags = Object.values(project.assessment.safety.concerns).some((v) => v === "yes" || v === "unknown");
  const readyToRequest = conceptSelected && scopeConfirmed && budgetConfirmed;

  const activeQuotations = project.quotations.filter((q) => q.status !== "withdrawn");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 mb-1">Contractor quotations</h1>
          <p className="text-slate-500 text-sm max-w-xl">Request and compare quotations from verified contractors. No payment is processed and no contract is created in this prototype.</p>
        </div>
        {project.quotationRequest ? (
          <button type="button" onClick={() => setWithdrawOpen(true)} className="text-sm font-bold text-red-500 hover:text-red-700 whitespace-nowrap">
            Withdraw Request
          </button>
        ) : (
          <button
            type="button"
            disabled={!readyToRequest}
            onClick={() => setRequestOpen(true)}
            className="bg-slate-900 hover:bg-[#2ec440] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-lg whitespace-nowrap"
          >
            Request Contractor Quotations
          </button>
        )}
      </div>

      {!readyToRequest && !project.quotationRequest && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800 space-y-1">
          <p className="font-bold">Before requesting quotations:</p>
          <ul className="list-disc list-inside">
            {!conceptSelected && <li>Select a concept</li>}
            {!scopeConfirmed && <li>Generate the scope of work</li>}
            {!budgetConfirmed && <li>Calculate the indicative budget</li>}
          </ul>
        </div>
      )}

      {safetyFlags && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-sm text-purple-800 font-semibold">
          Safety flags were raised during assessment — request a professional review before accepting a quotation for affected work.
        </div>
      )}

      {activeQuotations.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-12 text-center">
          <p className="text-slate-500">No quotations requested yet.</p>
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <div className="flex rounded-xl border border-slate-200 overflow-hidden">
              {(["cards", "compare"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`px-4 py-2 text-sm font-bold capitalize transition-colors ${view === v ? "bg-[#2ec440]/10 text-[#2ec440]" : "bg-white text-slate-500"}`}
                >
                  {v === "cards" ? "Details" : "Compare"}
                </button>
              ))}
            </div>
          </div>

          {view === "cards" ? (
            <div className="space-y-5">
              {activeQuotations.map((q) => (
                <QuotationCard
                  key={q.id}
                  quotation={q}
                  onAccept={() => setAcceptTarget(q)}
                  onDecline={() => {
                    RenovationProjectService.declineQuotation(project.id, q.id);
                    showToast("Quotation declined.");
                  }}
                />
              ))}
            </div>
          ) : (
            <CompareQuotationsTable quotations={activeQuotations} onAccept={(id) => setAcceptTarget(activeQuotations.find((q) => q.id === id) ?? null)} />
          )}
        </>
      )}

      <p className="text-xs text-slate-400 italic">
        This is a prototype. Accepting a quotation updates your project to &ldquo;Ready for execution&rdquo; but does not process payment or create a binding contract. See{" "}
        <Link href={`/studio/renovate/${project.id}/professionals`} className="underline">
          Professionals
        </Link>{" "}
        for review status.
      </p>

      <RequestQuotationsModal project={project} open={requestOpen} onClose={() => setRequestOpen(false)} />
      <AcceptQuotationModal
        quotation={acceptTarget}
        open={acceptTarget !== null}
        onClose={() => setAcceptTarget(null)}
        onConfirm={() => {
          if (!acceptTarget) return;
          RenovationProjectService.acceptQuotation(project.id, acceptTarget.id);
          showToast("Quotation accepted. No payment was processed.");
          setAcceptTarget(null);
        }}
      />
      <ConfirmModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        title="Withdraw quotation request?"
        description="Contractors will no longer be able to respond to this request. Quotations already received remain visible but are marked withdrawn."
        confirmLabel="Withdraw Request"
        destructive
        onConfirm={() => {
          RenovationProjectService.withdrawQuotationRequest(project.id);
          showToast("Quotation request withdrawn.");
          setWithdrawOpen(false);
        }}
      />
    </div>
  );
}
