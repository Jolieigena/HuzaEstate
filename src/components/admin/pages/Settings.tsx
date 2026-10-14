"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useIsAdministrator } from "@/lib/admin/hooks";
import { useToast } from "@/lib/toast-context";
import { Card, PageFrame, PrimaryButton, RequirePermission, fieldClass } from "../ui";

const ACCESS_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";

export function SettingsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const canView = useIsAdministrator();
  const [requireListingReview, setRequireListingReview] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [feePercent, setFeePercent] = useState<number | null>(null);
  const [feeText, setFeeText] = useState("");
  const [savingFee, setSavingFee] = useState(false);

  useEffect(() => {
    if (!token || !canView) return;
    let cancelled = false;
    fetch(`${ACCESS_API_URL}/auth/admin/settings`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (typeof data?.settings?.requireListingReview === "boolean") setRequireListingReview(data.settings.requireListingReview);
        if (typeof data?.settings?.supplierFeePercent === "number") {
          setFeePercent(data.settings.supplierFeePercent);
          setFeeText(String(data.settings.supplierFeePercent));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token, canView]);

  async function save(next: boolean) {
    if (!token || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`${ACCESS_API_URL}/auth/admin/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "x-huza-client": "web" },
        body: JSON.stringify({ requireListingReview: next }),
      });
      if (!res.ok) throw new Error();
      setRequireListingReview(next);
      showToast("Settings saved.");
    } catch {
      showToast("Could not save settings.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function saveFee() {
    const value = Number(feeText);
    if (!token || savingFee || !Number.isFinite(value) || value < 0 || value > 50) {
      showToast("Enter a percentage from 0 to 50.", "error");
      return;
    }
    setSavingFee(true);
    try {
      const res = await fetch(`${ACCESS_API_URL}/auth/admin/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "x-huza-client": "web" },
        body: JSON.stringify({ supplierFeePercent: value }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFeePercent(data.settings.supplierFeePercent);
      setFeeText(String(data.settings.supplierFeePercent));
      showToast("Settings saved.");
    } catch {
      showToast("Could not save settings.", "error");
    } finally {
      setSavingFee(false);
    }
  }

  return (
    <PageFrame title="Settings">
      <RequirePermission granted={canView}>
        <Card className="max-w-2xl">
          <h3 className="text-lg font-black text-slate-900">Listing review</h3>
          <p className="mt-1 text-sm text-slate-500">
            When on (the default), a newly submitted listing waits for an administrator or an in-scope organisation
            admin to review and publish it. An organisation can still opt its own countries out of review from its
            own settings page, overriding this default for just those countries.
          </p>
          {requireListingReview === null ? (
            <p className="mt-4 text-sm text-slate-400">Loading…</p>
          ) : (
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={requireListingReview}
                onClick={() => save(!requireListingReview)}
                disabled={saving}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${requireListingReview ? "bg-[#2ec440]" : "bg-slate-300"}`}
              >
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${requireListingReview ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <span className="text-sm font-bold text-slate-900">
                {requireListingReview ? "Review required by default" : "Auto-publish by default"}
              </span>
            </div>
          )}
        </Card>

        <Card className="mt-6 max-w-2xl">
          <h3 className="text-lg font-black text-slate-900">Supplier fee</h3>
          <p className="mt-1 text-sm text-slate-500">The share of each paid furniture order the platform keeps. It is fixed on an order when the order is paid, so a change only affects orders paid after it.</p>
          {feePercent === null ? (
            <p className="mt-4 text-sm text-slate-400">Loading…</p>
          ) : (
            <div className="mt-4 flex items-end gap-3">
              <label className="block text-sm font-bold text-slate-700">
                Percent
                <input className={`${fieldClass} mt-1 !w-32`} inputMode="decimal" value={feeText} onChange={(e) => setFeeText(e.target.value.replace(/[^0-9.]/g, ""))} />
              </label>
              <PrimaryButton type="button" disabled={savingFee || feeText === String(feePercent)} onClick={saveFee}>
                {savingFee ? "Saving…" : "Save"}
              </PrimaryButton>
            </div>
          )}
        </Card>
      </RequirePermission>
    </PageFrame>
  );
}
