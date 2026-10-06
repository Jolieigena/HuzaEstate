"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { cancelSubscription } from "@/lib/postingPlans/api";
import { notifySubscriptionChanged } from "@/lib/postingPlans/hooks";
import { PLAN_LABELS, type PlanTier } from "@/lib/postingPlans/types";
import { formatLongDate } from "./RedeemAccessCode";

/** Confirm step for ending a paid plan. Cancelling never cuts access off: the plan stays active and
 *  paid for until the end of the period, then drops to Free, and the seller isn't billed again. */
export default function CancelPlanConfirm({ tier, renewsOn, onClose }: { tier: PlanTier; renewsOn: string | null; onClose: () => void }) {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [effectiveDate, setEffectiveDate] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!token || busy) return;
    setBusy(true);
    setError("");
    const result = await cancelSubscription(token);
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }
    notifySubscriptionChanged();
    setEffectiveDate(result.effectiveDate);
    setBusy(false);
  };

  const buttonBase = "rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50";

  if (effectiveDate) {
    return (
      <div className="p-6">
        <h3 className="mb-2 text-lg font-semibold text-slate-900">Cancellation scheduled</h3>
        <p className="mb-6 text-sm text-slate-600">
          Your {PLAN_LABELS[tier]} plan stays active until <span className="font-semibold text-slate-900">{formatLongDate(effectiveDate)}</span>, then moves to Free. You won&apos;t be billed again.
        </p>
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className={`${buttonBase} bg-slate-900 text-white hover:bg-slate-800`}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="mb-2 text-lg font-semibold text-slate-900">Cancel your {PLAN_LABELS[tier]} plan?</h3>
      <p className="mb-6 text-sm text-slate-600">
        You&apos;ll keep {PLAN_LABELS[tier]} access{renewsOn ? ` until ${formatLongDate(renewsOn)}` : ""}, then move to the Free plan. You won&apos;t be billed again.
      </p>
      {error && <p className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className={`${buttonBase} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}>
          Keep my plan
        </button>
        <button type="button" onClick={handleCancel} disabled={busy} className={`${buttonBase} bg-red-600 text-white hover:bg-red-700`}>
          {busy ? "Cancelling…" : "Cancel plan"}
        </button>
      </div>
    </div>
  );
}
