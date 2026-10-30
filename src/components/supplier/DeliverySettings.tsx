"use client";

import { useEffect, useState } from "react";
import { CurrencySelect, useCurrencyChoice } from "@/components/designs/fields";
import { Card, PrimaryButton, fieldClass } from "@/components/professional/ui";
import { useAuth } from "@/lib/auth-context";
import { SuppliersApi } from "@/lib/suppliers/api";
import { useToast } from "@/lib/toast-context";
import { useLanguage } from "@/lib/i18n/language";

/** What the supplier charges for delivery: a flat fee per order, free above an order value. Zero means delivery is free.
 *  Buyers see it before they order, and it is added to their total. */
export default function DeliverySettings() {
  const { t } = useLanguage();
  const { token, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const [loaded, setLoaded] = useState(false);
  const [feeText, setFeeText] = useState("");
  const [freeOverText, setFreeOverText] = useState("");
  const { currency, setCurrency } = useCurrencyChoice("");
  const [saved, setSaved] = useState({ fee: "", freeOver: "", currency: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthReady || !token) return;
    let cancelled = false;
    SuppliersApi.getDelivery(token).then((result) => {
      if (cancelled || !result.ok) return;
      const d = result.data.delivery;
      const fee = d.fee > 0 ? String(d.fee) : "0";
      const freeOver = d.freeOver ? String(d.freeOver) : "";
      setFeeText(fee);
      setFreeOverText(freeOver);
      if (d.currency) setCurrency(d.currency);
      setSaved({ fee, freeOver, currency: d.currency ?? "" });
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
    // setCurrency is stable for this component's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthReady, token]);

  const fee = Number(feeText);
  const charging = Number.isFinite(fee) && fee > 0;
  const changed = feeText !== saved.fee || (charging && (freeOverText !== saved.freeOver || currency !== saved.currency));

  const save = async () => {
    if (!token || saving) return;
    if (!Number.isFinite(fee) || fee < 0) {
      setError(t("Enter the delivery fee, or 0 if delivery is free."));
      return;
    }
    setSaving(true);
    setError("");
    const result = await SuppliersApi.saveDelivery(token, charging ? { fee, currency, freeOver: freeOverText.trim() ? Number(freeOverText) : null } : { fee: 0 });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const d = result.data.delivery;
    setSaved({ fee: d.fee > 0 ? String(d.fee) : "0", freeOver: d.freeOver ? String(d.freeOver) : "", currency: d.currency ?? "" });
    showToast(t("Delivery settings saved."));
  };

  if (!loaded) return null;
  return (
    <section className="mt-8 max-w-2xl">
      <h2 className="mb-3 text-lg font-black text-slate-900">{t("Delivery")}</h2>
      <Card className="space-y-5">
        {error && <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-bold text-slate-700">
            {t("Delivery fee per order")}
            <input className={`${fieldClass} mt-1`} inputMode="decimal" value={feeText} onChange={(e) => setFeeText(e.target.value.replace(/[^\d.]/g, ""))} />
          </label>
          {charging && (
            <label className="block text-sm font-bold text-slate-700">
              {t("Currency")}
              <CurrencySelect className={`${fieldClass} mt-1`} value={currency} onChange={setCurrency} />
            </label>
          )}
        </div>
        {charging && (
          <label className="block text-sm font-bold text-slate-700 sm:max-w-xs">
            Free delivery above <span className="font-normal text-slate-400">(optional)</span>
            <input className={`${fieldClass} mt-1`} inputMode="decimal" value={freeOverText} onChange={(e) => setFreeOverText(e.target.value.replace(/[^\d.]/g, ""))} />
          </label>
        )}
        <PrimaryButton type="button" disabled={saving || !changed} onClick={save}>
          {saving ? t("Saving…") : t("Save delivery settings")}
        </PrimaryButton>
      </Card>
    </section>
  );
}
