"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useIsAdministrator } from "@/lib/admin/hooks";
import { useToast } from "@/lib/toast-context";
import { Card, PageFrame, PrimaryButton, RequirePermission, fieldClass } from "../ui";
import Toggle from "../Toggle";
import { ShopCategoriesCard } from "./ShopCategories";
import { FooterTextCard, MenusCard } from "./Menus";

const ACCESS_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";

const TABS = [
  { id: "general", label: "General" },
  { id: "menus", label: "Menus" },
  { id: "footer", label: "Footer" },
  { id: "shop", label: "Shop categories" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function SettingsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const canView = useIsAdministrator();
  const [tab, setTab] = useState<TabId>("general");
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
        <div role="tablist" aria-label="Settings sections" className="mb-8 flex gap-1 overflow-x-auto border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`settings-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`settings-panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`-mb-px shrink-0 border-b-2 px-4 py-3 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2ec440]/20 ${tab === t.id ? "border-[#2ec440] text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`settings-panel-${tab}`} aria-labelledby={`settings-tab-${tab}`} className="max-w-5xl">
          {tab === "general" && (
            <div className="grid items-start gap-6 md:grid-cols-2">
              <Card>
                <h3 className="text-lg font-black text-slate-900">Listing review</h3>
                {requireListingReview === null ? (
                  <p className="mt-5 text-sm text-slate-400">Loading…</p>
                ) : (
                  <div className="mt-5">
                    <Toggle checked={requireListingReview} onChange={save} disabled={saving} label="Review new listings before they go live">
                      {requireListingReview ? "Review required by default" : "Auto-publish by default"}
                    </Toggle>
                  </div>
                )}
              </Card>

              <Card>
                <h3 className="text-lg font-black text-slate-900">Supplier fee</h3>
                {feePercent === null ? (
                  <p className="mt-5 text-sm text-slate-400">Loading…</p>
                ) : (
                  <div className="mt-5 flex items-end gap-3">
                    <label className="block text-sm font-bold text-slate-700">
                      Percent
                      <input className={`${fieldClass} mt-1.5 block !w-28`} inputMode="decimal" value={feeText} onChange={(e) => setFeeText(e.target.value.replace(/[^0-9.]/g, ""))} />
                    </label>
                    <PrimaryButton type="button" disabled={savingFee || feeText === String(feePercent)} onClick={saveFee}>
                      {savingFee ? "Saving…" : "Save"}
                    </PrimaryButton>
                  </div>
                )}
              </Card>
            </div>
          )}

          {tab === "menus" && <MenusCard />}
          {tab === "footer" && <FooterTextCard />}
          {tab === "shop" && <ShopCategoriesCard />}
        </div>
      </RequirePermission>
    </PageFrame>
  );
}
