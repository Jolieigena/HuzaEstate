"use client";

import { useState } from "react";
import Link from "next/link";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { useAuth } from "@/lib/auth-context";
import { useAdminState, useHasPermission } from "@/lib/admin/hooks";
import { AdminService } from "@/lib/admin/service";
import type { AiFeatureFlags, PrivilegedAccessReason } from "@/lib/admin/types";
import { useToast } from "@/lib/toast-context";
import ReasonFormModal from "../ReasonFormModal";
import { Card, EmptyState, PageFrame, RequirePermission, SecondaryButton, StatusPill, formatDateTime } from "../ui";

function useActor() {
  const { account } = useAuth();
  return { actorAccountId: account?.id ?? "system", actorName: account?.name ?? "System" };
}

const TOGGLE_FLAGS: { key: keyof AiFeatureFlags; label: string; description: string }[] = [
  { key: "aiEnabled", label: "AI features enabled", description: "Master switch for all AI generation across the platform." },
  { key: "buildGenerationEnabled", label: "Build generation enabled", description: "Customers can start AI concept generation on Build projects." },
  { key: "renovateGenerationEnabled", label: "Renovate generation enabled", description: "Customers can start AI concept generation on Renovate projects." },
  { key: "targetedEditingEnabled", label: "Targeted editing enabled", description: "Customers can request targeted AI edits to a selected concept." },
  { key: "conceptWatermark", label: "Concept watermark", description: "AI-generated concepts are watermarked as conceptual." },
];

function FeatureToggle({ flagKey, label, description }: { flagKey: keyof AiFeatureFlags; label: string; description: string }) {
  const { account } = useAuth();
  const { actorAccountId, actorName } = useActor();
  const state = useAdminState();
  const { showToast } = useToast();
  const canManage = useHasPermission(account?.id, "ai.manage_configuration");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const enabled = Boolean(state.aiFeatureFlags[flagKey]);

  return (
    <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0">
      <div>
        <p className="text-sm font-bold text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        disabled={!canManage}
        onClick={() => {
          if (enabled) setConfirmOpen(true);
          else {
            AdminService.updateAiFeatureFlags({ [flagKey]: true }, actorAccountId, actorName);
            showToast(`${label} enabled.`);
          }
        }}
        className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-colors disabled:opacity-50 ${enabled ? "bg-[#2ec440]" : "bg-slate-200"}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
      </button>
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        destructive
        title={`Disable ${label.toLowerCase()}?`}
        description="Customers currently mid-generation are unaffected, but new requests will show a maintenance message until this is re-enabled."
        confirmLabel="Disable"
        onConfirm={() => {
          AdminService.updateAiFeatureFlags({ [flagKey]: false }, actorAccountId, actorName);
          setConfirmOpen(false);
          showToast(`${label} disabled.`);
        }}
      />
    </div>
  );
}

export function AiOperationsPage() {
  const { account } = useAuth();
  const { actorAccountId, actorName } = useActor();
  const state = useAdminState();
  const { showToast } = useToast();
  const canView = useHasPermission(account?.id, "ai.view_usage");
  const [promptTarget, setPromptTarget] = useState<string | null>(null);
  const [revealedPrompts, setRevealedPrompts] = useState<Set<string>>(new Set());
  const [resolveTarget, setResolveTarget] = useState<string | null>(null);

  const generations = AdminService.listAiGenerations();
  const build = generations.filter((g) => g.module === "build");
  const renovate = generations.filter((g) => g.module === "renovate");
  const succeeded = generations.filter((g) => g.status === "succeeded");
  const failed = generations.filter((g) => g.status === "failed");
  const cancelled = generations.filter((g) => g.status === "cancelled");
  const avgDuration = generations.length ? Math.round(generations.reduce((sum, g) => sum + g.durationMs, 0) / generations.length / 1000) : 0;
  const flagged = generations.filter((g) => g.safetyFlag || g.status === "failed");

  const summaryCards: [string, number | string][] = [
    ["Build generations", build.length],
    ["Renovate generations", renovate.length],
    ["Successful generations", succeeded.length],
    ["Failed generations", failed.length],
    ["Cancelled generations", cancelled.length],
    ["Average duration", `${avgDuration}s`],
    ["Flagged content", flagged.length],
  ];

  return (
    <PageFrame title="AI Operations" description="Monitor AI generation activity and configure feature availability. Full prompts require a logged, reason-based access.">
      <RequirePermission granted={canView}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map(([name, value]) => (
            <Card key={name} className="p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{name}</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
            </Card>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
          <Card>
            <h3 className="text-lg font-black text-slate-900">Generation records</h3>
            <div className="mt-4 divide-y divide-slate-100">
              {generations.length ? (
                generations.map((gen) => (
                  <div key={gen.id} className="py-3.5 first:pt-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{gen.module} · {gen.generationType.replace(/_/g, " ")}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(gen.createdAt)} · {(gen.durationMs / 1000).toFixed(1)}s · {gen.modelIndicator}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {gen.safetyFlag && <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">Safety flag</span>}
                        <StatusPill status={gen.errorCategory ? `${gen.status} — ${gen.errorCategory.replace(/_/g, " ")}` : gen.status} />
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{revealedPrompts.has(gen.id) ? gen.promptSummary : "Prompt hidden by default — request access to view."}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {!revealedPrompts.has(gen.id) && <SecondaryButton onClick={() => setPromptTarget(gen.id)}>View prompt summary</SecondaryButton>}
                      {gen.status === "failed" && !gen.resolved && <SecondaryButton onClick={() => setResolveTarget(gen.id)}>Mark resolved</SecondaryButton>}
                      {gen.status === "failed" && (
                        <Link href="/admin/support" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-[#2ec440] hover:text-[#219b31]">
                          Link to support case
                        </Link>
                      )}
                      {gen.resolved && <span className="inline-flex items-center text-xs font-bold text-[#219b31]">Resolved{gen.operationalNote ? `: ${gen.operationalNote}` : ""}</span>}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title="No AI generation records" description="Records appear here as customers use Build and Renovate AI generation." />
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-black text-slate-900">AI controls</h3>
            <div className="mt-2 divide-y divide-slate-100">
              {TOGGLE_FLAGS.map((flag) => (
                <FeatureToggle key={flag.key} flagKey={flag.key} label={flag.label} description={flag.description} />
              ))}
            </div>
            <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 text-sm">
              <p className="text-slate-500">Maximum generations per project: <span className="font-bold text-slate-800">{state.aiFeatureFlags.maxGenerationCount}</span></p>
              <p className="text-slate-500">Maximum upload count: <span className="font-bold text-slate-800">{state.aiFeatureFlags.maxUploadCount}</span></p>
              <p className="text-slate-500">Maximum upload size: <span className="font-bold text-slate-800">{state.aiFeatureFlags.maxUploadSizeMb} MB</span></p>
              <p className="text-slate-500">Service indicator: <span className="font-bold text-slate-800">{state.aiFeatureFlags.mockServiceIndicator}</span></p>
            </div>
          </Card>
        </div>

        <ReasonFormModal
          open={Boolean(promptTarget)}
          onClose={() => setPromptTarget(null)}
          title="View prompt summary"
          description="This access is recorded in the audit log, and full prompt content is never shown by default."
          reasonOptions={["customer_support", "active_dispute", "safety_investigation", "abuse_investigation", "legal_regulatory", "technical_recovery"]}
          reasonLabel="Reason for access"
          noteLabel="Case reference"
          noteRequired
          submitLabel="View prompt summary"
          onSubmit={({ reason, note }) => {
            if (!promptTarget) return;
            AdminService.recordPrivilegedPromptAccess(promptTarget, actorAccountId, actorName, reason as PrivilegedAccessReason, note);
            setRevealedPrompts((prev) => new Set(prev).add(promptTarget));
            setPromptTarget(null);
            showToast("Access recorded.");
          }}
        />

        <ReasonFormModal
          open={Boolean(resolveTarget)}
          onClose={() => setResolveTarget(null)}
          title="Mark AI failure resolved"
          reasonLabel="Resolution note"
          submitLabel="Mark resolved"
          onSubmit={({ reason }) => {
            if (!resolveTarget) return;
            AdminService.resolveAiFailure(resolveTarget, actorAccountId, actorName, reason);
            setResolveTarget(null);
            showToast("Marked resolved.");
          }}
        />
      </RequirePermission>
    </PageFrame>
  );
}
