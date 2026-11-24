"use client";

import { useEffect, useState } from "react";
import { CurrencySelect, useCurrencyChoice } from "@/components/designs/fields";
import { Card, PrimaryButton, SecondaryButton, fieldClass } from "@/components/professional/ui";
import Select from "@/components/shared/Select";
import { useAuth } from "@/lib/auth-context";
import { SuppliersApi, type Delivery } from "@/lib/suppliers/api";
import { useToast } from "@/lib/toast-context";
import { useLanguage } from "@/lib/i18n/language";

/** One place with its own cost: a flat fee, or a percentage of the order value. */
interface Place {
  place: string;
  kind: "fee" | "percent";
  value: string;
}

const toPlaces = (d: Delivery): Place[] => (d.areas ?? []).map((a) => (a.percent !== undefined ? { place: a.place, kind: "percent", value: String(a.percent) } : { place: a.place, kind: "fee", value: String(a.fee ?? 0) }));
const snapshot = (fee: string, freeOver: string, currency: string, places: Place[]) => JSON.stringify([fee, freeOver, currency, places]);

/** What the supplier charges for delivery: a fee for most places, and a fee or a percentage of the order value for the places they list
 *  (a city or an area). Free above an order value. Zero means delivery is free. Buyers see it before they order, and it is added to their total. */
export default function DeliverySettings() {
  const { t } = useLanguage();
  const { token, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const [loaded, setLoaded] = useState(false);
  const [feeText, setFeeText] = useState("");
  const [freeOverText, setFreeOverText] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const { currency, setCurrency } = useCurrencyChoice("");
  const [saved, setSaved] = useState("");
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
      const list = toPlaces(d);
      setFeeText(fee);
      setFreeOverText(freeOver);
      setPlaces(list);
      if (d.currency) setCurrency(d.currency);
      setSaved(snapshot(fee, freeOver, d.currency ?? "", list));
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
    // setCurrency is stable for this component's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthReady, token]);

  const fee = Number(feeText);
  const chargingFlat = (Number.isFinite(fee) && fee > 0) || places.some((p) => p.kind === "fee" && Number(p.value) > 0);
  const changed = snapshot(feeText, freeOverText, chargingFlat ? currency : saved ? (JSON.parse(saved)[2] as string) : "", places) !== saved;

  const setPlace = (index: number, patch: Partial<Place>) => setPlaces((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));

  const save = async () => {
    if (!token || saving) return;
    if (!Number.isFinite(fee) || fee < 0) {
      setError(t("Enter the delivery fee, or 0 if delivery is free."));
      return;
    }
    for (const p of places) {
      if (!p.place.trim()) {
        setError(t("Give each place a name."));
        return;
      }
      const v = Number(p.value);
      if (p.value.trim() === "" || !Number.isFinite(v) || v < 0 || (p.kind === "percent" && v > 100)) {
        setError(p.kind === "percent" ? t("The percentage for {place} must be from 0 to 100.", { place: p.place.trim() }) : t("Enter the delivery fee for {place}, or 0 if it is free.", { place: p.place.trim() }));
        return;
      }
    }
    setSaving(true);
    setError("");
    const result = await SuppliersApi.saveDelivery(token, {
      fee: Number.isFinite(fee) ? fee : 0,
      ...(chargingFlat ? { currency } : {}),
      freeOver: chargingFlat && freeOverText.trim() ? Number(freeOverText) : null,
      areas: places.map((p) => ({ place: p.place.trim(), ...(p.kind === "percent" ? { percent: Number(p.value) } : { fee: Number(p.value) }) })),
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const d = result.data.delivery;
    const list = toPlaces(d);
    setPlaces(list);
    setSaved(snapshot(d.fee > 0 ? String(d.fee) : "0", d.freeOver ? String(d.freeOver) : "", d.currency ?? "", list));
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
            {places.length > 0 ? t("Delivery fee for other places") : t("Delivery fee per order")}
            <input className={`${fieldClass} mt-1`} inputMode="decimal" value={feeText} onChange={(e) => setFeeText(e.target.value.replace(/[^\d.]/g, ""))} />
          </label>
          {chargingFlat && (
            <label className="block text-sm font-bold text-slate-700">
              {t("Currency")}
              <CurrencySelect className={`${fieldClass} mt-1`} value={currency} onChange={setCurrency} />
            </label>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-bold text-slate-700">{t("Places with their own delivery cost")}</p>
          {places.length > 0 && (
            <ul className="space-y-2">
              {places.map((p, i) => (
                <li key={i} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_7rem_auto] sm:items-center">
                  <input className={fieldClass} value={p.place} maxLength={60} placeholder={t("Place, for example Kigali")} aria-label={t("Place")} onChange={(e) => setPlace(i, { place: e.target.value })} />
                  <Select className={fieldClass} value={p.kind} aria-label={t("How it is charged")} onChange={(e) => setPlace(i, { kind: e.target.value as Place["kind"] })}>
                    <option value="fee">{t("Fee per order")}</option>
                    <option value="percent">{t("% of the order")}</option>
                  </Select>
                  <input className={fieldClass} inputMode="decimal" value={p.value} aria-label={p.kind === "percent" ? t("Percentage") : t("Fee")} placeholder={p.kind === "percent" ? "%" : t("Fee")} onChange={(e) => setPlace(i, { value: e.target.value.replace(/[^\d.]/g, "") })} />
                  <button type="button" onClick={() => setPlaces((prev) => prev.filter((_, j) => j !== i))} className="min-h-11 justify-self-start px-2 text-sm font-bold text-red-600 hover:text-red-800">
                    {t("Remove")}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <SecondaryButton type="button" className={places.length > 0 ? "mt-3" : ""} onClick={() => setPlaces((prev) => [...prev, { place: "", kind: "fee", value: "" }])}>
            {t("Add a place")}
          </SecondaryButton>
        </div>

        {chargingFlat && (
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
