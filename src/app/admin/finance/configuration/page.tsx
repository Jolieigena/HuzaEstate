"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useHasPermission } from "@/lib/admin/hooks";
import { useFinanceConfig, useInvoices } from "@/lib/finance/hooks";
import { ConfigService } from "@/lib/finance/configService";
import { simulateProviderOutcome, sendExternalWebhookEvent } from "@/lib/finance/provider";
import type { LiveModeChecklist, ProviderMode } from "@/lib/finance/types";
import { useToast } from "@/lib/toast-context";
import ReasonModal from "@/components/finance/modals/ReasonModal";
import { PrototypeBanner } from "@/components/finance/ui";
import { PageFrame, Card, RequirePermission, PrimaryButton, SecondaryButton, DestructiveButton, fieldClass } from "@/components/admin/ui";

const CHECKLIST_LABELS: Record<keyof LiveModeChecklist, string> = {
  providerAccountApproved: "Provider account approved",
  requiredContractsCompleted: "Required contracts completed",
  complianceReviewCompleted: "Compliance review completed",
  securityReviewCompleted: "Security review completed",
  webhookVerified: "Webhook verified",
  refundProcessTested: "Refund process tested",
  reconciliationTested: "Reconciliation tested",
  supportProcessReady: "Support process ready",
  legalWordingApproved: "Legal wording approved",
};

export default function AdminFinanceConfigurationPage() {
  const { account } = useAuth();
  const canConfigure = useHasPermission(account?.id, "finance.configure");
  const config = useFinanceConfig();
  const invoices = useInvoices();
  const { showToast } = useToast();
  const [disableOpen, setDisableOpen] = useState(false);
  const [testLog, setTestLog] = useState<string[]>([]);

  if (!account) return null;

  function log(message: string) {
    setTestLog((prev) => [`${new Date().toLocaleTimeString()} — ${message}`, ...prev].slice(0, 8));
  }

  return (
    <PageFrame title="Payment Configuration" description="Provider, supported methods, fees, funding and Live-mode readiness. Secret values are never displayed once stored.">
      <RequirePermission granted={canConfigure}>
        <div className="mb-6">
          <PrototypeBanner />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Provider</h2>
            <dl className="space-y-3 text-sm">
              <Row label="Payments enabled">
                <ToggleButton value={config.paymentsEnabled} onChange={(v) => ConfigService.update({ paymentsEnabled: v }, account.id, `Payments ${v ? "enabled" : "disabled"}.`)} />
              </Row>
              <Row label="Current provider">
                <span className="font-semibold text-slate-800">{config.currentProvider}</span>
              </Row>
              <Row label="Provider mode">
                <select
                  className={`${fieldClass} w-auto`}
                  value={config.providerMode}
                  onChange={(e) => {
                    const mode = e.target.value as ProviderMode;
                    if (mode === "live") {
                      const result = ConfigService.setLiveModeEnabled(true, account.id, "Attempted live-mode switch from configuration page.");
                      if (!result.ok) showToast(`Live mode blocked — incomplete: ${result.blockedReasons.join(", ")}`, "error");
                    } else {
                      ConfigService.update({ providerMode: mode }, account.id, `Provider mode set to ${mode}.`);
                    }
                  }}
                >
                  <option value="mock">Mock</option>
                  <option value="sandbox">Sandbox</option>
                  <option value="live">Live</option>
                </select>
              </Row>
              <Row label="Funding feature">
                <ToggleButton value={config.fundingFeatureEnabled} onChange={(v) => ConfigService.update({ fundingFeatureEnabled: v }, account.id, `Funding feature ${v ? "enabled" : "disabled"}.`)} />
              </Row>
              <Row label="Release workflow">
                <ToggleButton value={config.releaseWorkflowEnabled} onChange={(v) => ConfigService.update({ releaseWorkflowEnabled: v }, account.id, `Release workflow ${v ? "enabled" : "disabled"}.`)} />
              </Row>
              <Row label="Settlement schedule">
                <span className="font-semibold text-slate-800">{config.settlementScheduleDays} days</span>
              </Row>
              <Row label="Payment expiry">
                <span className="font-semibold text-slate-800">{config.paymentExpiryMinutes} minutes</span>
              </Row>
              <Row label="Webhook health">
                <span className="font-semibold text-slate-800">{config.webhookHealth}{config.webhookLastTestedAt ? ` (last tested ${new Date(config.webhookLastTestedAt).toLocaleString()})` : ""}</span>
              </Row>
            </dl>
            <div className="mt-4">
              <DestructiveButton onClick={() => setDisableOpen(true)}>Disable Payments</DestructiveButton>
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Live-mode readiness checklist</h2>
            <div className="space-y-2">
              {(Object.keys(CHECKLIST_LABELS) as (keyof LiveModeChecklist)[]).map((key) => (
                <label key={key} className="flex items-center gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={config.liveModeChecklist[key]}
                    onChange={(e) => ConfigService.updateLiveModeChecklist({ [key]: e.target.checked }, account.id)}
                    className="h-4 w-4 rounded accent-[#2ec440]"
                  />
                  {CHECKLIST_LABELS[key]}
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">Even with every item checked, this build has no real provider adapter — Live mode stays inert.</p>
          </Card>

          <Card className="lg:col-span-2">
            <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Security test panel</h2>
            <p className="mb-4 text-sm text-slate-500">
              Exercises the real server-side Route Handlers at <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">/api/finance/payments/calculate</code> and{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">/api/finance/webhooks/mock</code> — the amount-authority and signature/idempotency checks are real, not simulated in the browser.
            </p>
            <div className="flex flex-wrap gap-2">
              <SecondaryButton
                onClick={async () => {
                  const result = await simulateProviderOutcome("webhook-health-check", "success", 100, "RWF");
                  if (result.verified) {
                    ConfigService.update({ webhookHealth: "healthy", webhookLastTestedAt: new Date().toISOString() }, account.id, "Webhook health check succeeded.");
                    log("Webhook health check: verified event accepted.");
                  } else {
                    log(`Webhook health check failed: ${result.error}`);
                  }
                }}
              >
                Test Webhook Health
              </SecondaryButton>

              <SecondaryButton
                onClick={async () => {
                  const first = await simulateProviderOutcome("dup-test-payment", "success", 100, "RWF");
                  if (!first.event) {
                    log("Could not create a first event to duplicate.");
                    return;
                  }
                  const second = await simulateProviderOutcome("dup-test-payment", "success", 100, "RWF", first.event.eventId);
                  log(second.verified ? "Unexpected: duplicate event was accepted." : `Duplicate event correctly rejected: ${second.error}`);
                }}
              >
                Send Duplicate Webhook Event
              </SecondaryButton>

              <SecondaryButton
                onClick={async () => {
                  const result = await sendExternalWebhookEvent({
                    eventId: `bad-sig-${Date.now()}`,
                    paymentId: "sig-test-payment",
                    outcome: "success",
                    amountMinor: 100,
                    currency: "RWF",
                    timestamp: Date.now(),
                    signature: "0000000000000000000000000000000000000000000000000000000000000000",
                  });
                  log(result.verified ? "Unexpected: invalid signature was accepted." : `Invalid signature correctly rejected: ${result.error}`);
                }}
              >
                Send Invalid-Signature Webhook
              </SecondaryButton>

              <SecondaryButton
                disabled={invoices.length === 0}
                onClick={async () => {
                  const invoice = invoices[0];
                  const res = await fetch("/api/finance/payments/calculate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ lineItems: invoice.lineItems, currency: invoice.currency, feeConfig: { id: "test", version: invoice.feeConfigVersion, effectiveFrom: new Date().toISOString(), platformFeeType: "percentage", platformFeeValue: 250, feePayer: "customer", providerFeeNote: "", promotionalWaiver: false, createdBy: "test", createdAt: new Date().toISOString() }, clientTotalMinor: 1 }),
                  });
                  const data = await res.json();
                  log(data.matchesClientTotal ? "Unexpected: tampered total accepted." : `Tampered amount rejected — server-authoritative total is ${data.authoritativeTotalMinor} (client sent 1).`);
                }}
              >
                Attempt Tampered Payment Amount
              </SecondaryButton>
            </div>

            <div role="status" aria-live="polite" className="mt-4 space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              {testLog.length === 0 ? <p>No tests run yet.</p> : testLog.map((entry, i) => <p key={i}>{entry}</p>)}
            </div>
          </Card>
        </div>
      </RequirePermission>

      <ReasonModal
        open={disableOpen}
        title="Disable payments platform-wide?"
        description="Customers will be unable to start new payments until this is re-enabled."
        reasonLabel="Reason"
        confirmLabel="Disable Payments"
        danger
        onClose={() => setDisableOpen(false)}
        onConfirm={async (reason) => {
          ConfigService.update({ paymentsEnabled: false }, account.id, reason);
          showToast("Payments disabled.", "info");
        }}
      />
    </PageFrame>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function ToggleButton({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <PrimaryButton className={`!min-h-0 !py-1.5 text-xs ${value ? "" : "!bg-slate-300"}`} onClick={() => onChange(!value)}>
      {value ? "Enabled" : "Disabled"}
    </PrimaryButton>
  );
}
