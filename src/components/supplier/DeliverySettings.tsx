"use client";

import { useEffect, useState } from "react";
import { CurrencySelect, useCurrencyChoice } from "@/components/designs/fields";
import { Card, PrimaryButton, SecondaryButton, fieldClass } from "@/components/professional/ui";
import Select from "@/components/shared/Select";
import { useAuth } from "@/lib/auth-context";
import { COUNTRY_OPTIONS, DEFAULT_COUNTRY } from "@/lib/countries";
import { districtsForCountry } from "@/lib/regions";
import { SuppliersApi, type Delivery } from "@/lib/suppliers/api";
import { useToast } from "@/lib/toast-context";
import { useLanguage } from "@/lib/i18n/language";

/** One place with its own cost: a country, and a city or area in it (empty: the whole country), charged as a flat fee or a percentage of the order. */
interface Place {
  country: string;
  place: string;
  kind: "fee" | "percent";
  value: string;
  currency: string;
  days: string;
}

const toPlaces = (d: Delivery, own: string): Place[] =>
  (d.areas ?? []).map((a) => ({
    country: a.country || own,
    place: a.place ?? "",
    kind: a.percent !== undefined ? "percent" : "fee",
    value: a.percent !== undefined ? String(a.percent) : String(a.fee ?? 0),
    currency: a.currency ?? "",
    days: a.days ? String(a.days) : "",
  }));
const snapshot = (fee: string, freeOver: string, currency: string, days: string, places: Place[]) => JSON.stringify([fee, freeOver, currency, days, places]);

/** What the supplier charges for delivery: a fee and a time for most places in their own country, and a fee or a percentage of the
 *  order value, with a time, for each country or city they list. A country they do not list is not delivered to. Free above an order
 *  value. Zero means delivery is free. Buyers see it before they order, and it is added to their total. */
export default function DeliverySettings() {
  const { t } = useLanguage();
  const { token, isAuthReady, account } = useAuth();
  const { showToast } = useToast();
  const ownCountry = account?.country || DEFAULT_COUNTRY.name;
  const [loaded, setLoaded] = useState(false);
  const [feeText, setFeeText] = useState("");
  const [freeOverText, setFreeOverText] = useState("");
  const [daysText, setDaysText] = useState("");
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
      const list = toPlaces(d, ownCountry);
      setFeeText(fee);
      setFreeOverText(freeOver);
      setDaysText(d.days ? String(d.days) : "");
      setPlaces(list);
      if (d.currency) setCurrency(d.currency);
      setSaved(snapshot(fee, freeOver, d.currency ?? "", d.days ? String(d.days) : "", list));
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
    // setCurrency is stable for this component's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthReady, token]);

  const fee = Number(feeText);
  const chargingFlat = (Number.isFinite(fee) && fee > 0) || places.some((p) => p.kind === "fee" && Number(p.value) > 0 && !p.currency);
  const changed = snapshot(feeText, freeOverText, chargingFlat ? currency : saved ? (JSON.parse(saved)[2] as string) : "", daysText, places) !== saved;

  const setPlace = (index: number, patch: Partial<Place>) => setPlaces((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  const label = (p: Place) => [p.place.trim(), p.country].filter(Boolean).join(", ");

  const save = async () => {
    if (!token || saving) return;
    if (!Number.isFinite(fee) || fee < 0) {
      setError(t("Enter the delivery fee, or 0 if delivery is free."));
      return;
    }
    const wholeDays = (text: string) => text.trim() === "" || (Number.isInteger(Number(text)) && Number(text) >= 1 && Number(text) <= 60);
    if (!wholeDays(daysText)) {
      setError(t("Delivery days must be a whole number from 1 to 60."));
      return;
    }
    for (const p of places) {
      if (!wholeDays(p.days)) {
        setError(t("Delivery days for {place} must be a whole number from 1 to 60.", { place: label(p) }));
        return;
      }
      const v = Number(p.value);
      if (p.value.trim() === "" || !Number.isFinite(v) || v < 0 || (p.kind === "percent" && v > 100)) {
        setError(p.kind === "percent" ? t("The percentage for {place} must be from 0 to 100.", { place: label(p) }) : t("Enter the delivery fee for {place}, or 0 if it is free.", { place: label(p) }));
        return;
      }
    }
    setSaving(true);
    setError("");
    const result = await SuppliersApi.saveDelivery(token, {
      fee: Number.isFinite(fee) ? fee : 0,
      ...(chargingFlat || fee > 0 ? { currency } : {}),
      freeOver: fee > 0 && freeOverText.trim() ? Number(freeOverText) : null,
      days: daysText.trim() ? Number(daysText) : null,
      areas: places.map((p) => ({
        country: p.country,
        ...(p.place.trim() ? { place: p.place.trim() } : {}),
        ...(p.kind === "percent" ? { percent: Number(p.value) } : { fee: Number(p.value), ...(p.currency ? { currency: p.currency } : {}) }),
        ...(p.days.trim() ? { days: Number(p.days) } : {}),
      })),
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const d = result.data.delivery;
    const list = toPlaces(d, ownCountry);
    setPlaces(list);
    setSaved(snapshot(d.fee > 0 ? String(d.fee) : "0", d.freeOver ? String(d.freeOver) : "", d.currency ?? "", d.days ? String(d.days) : "", list));
    showToast(t("Delivery settings saved."));
  };

  if (!loaded) return null;
  return (
    <section className="mt-8 max-w-3xl">
      <h2 className="mb-3 text-lg font-black text-slate-900">{t("Delivery")}</h2>
      <Card className="space-y-5">
        {error && <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-bold text-slate-700">
            {places.length > 0 ? t("Fee for other places in {country}", { country: ownCountry }) : t("Delivery fee per order")}
            <input className={`${fieldClass} mt-1`} inputMode="decimal" value={feeText} onChange={(e) => setFeeText(e.target.value.replace(/[^\d.]/g, ""))} />
          </label>
          {(fee > 0 || chargingFlat) && (
            <label className="block text-sm font-bold text-slate-700">
              {t("Currency")}
              <CurrencySelect className={`${fieldClass} mt-1`} value={currency} onChange={setCurrency} />
            </label>
          )}
          <label className="block text-sm font-bold text-slate-700">
            {t("Delivery time (days)")} <span className="font-normal text-slate-400">({t("optional")})</span>
            <input className={`${fieldClass} mt-1`} inputMode="numeric" value={daysText} placeholder="e.g. 3" onChange={(e) => setDaysText(e.target.value.replace(/[^\d]/g, ""))} />
          </label>
        </div>

        <div>
          <p className="mb-2 text-sm font-bold text-slate-700">{t("Countries and places with their own delivery cost")}</p>
          {places.length > 0 && (
            <ul className="space-y-3">
              {places.map((p, i) => (
                <li key={i} className="rounded-2xl border border-slate-200 p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Select className={fieldClass} value={p.country} aria-label={t("Country")} onChange={(e) => setPlace(i, { country: e.target.value, place: "" })}>
                      {COUNTRY_OPTIONS.map((c) => (
                        <option key={c.code} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                    <div>
                      <input className={fieldClass} list={`districts-${i}`} value={p.place} maxLength={60} placeholder={t("City or area (empty: the whole country)")} aria-label={t("Place")} onChange={(e) => setPlace(i, { place: e.target.value })} />
                      <datalist id={`districts-${i}`}>
                        {districtsForCountry(p.country).map((d) => (
                          <option key={d} value={d} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-[10rem_7rem_8rem_6rem_auto] sm:items-center">
                    <Select className={fieldClass} value={p.kind} aria-label={t("How it is charged")} onChange={(e) => setPlace(i, { kind: e.target.value as Place["kind"] })}>
                      <option value="fee">{t("Fee per order")}</option>
                      <option value="percent">{t("% of the order")}</option>
                    </Select>
                    <input className={fieldClass} inputMode="decimal" value={p.value} aria-label={p.kind === "percent" ? t("Percentage") : t("Fee")} placeholder={p.kind === "percent" ? "%" : t("Fee")} onChange={(e) => setPlace(i, { value: e.target.value.replace(/[^\d.]/g, "") })} />
                    {p.kind === "fee" ? <CurrencySelect className={fieldClass} value={p.currency || currency} onChange={(c) => setPlace(i, { currency: c })} /> : <span />}
                    <input className={fieldClass} inputMode="numeric" value={p.days} aria-label={t("Days")} placeholder={t("Days")} onChange={(e) => setPlace(i, { days: e.target.value.replace(/[^\d]/g, "") })} />
                    <button type="button" onClick={() => setPlaces((prev) => prev.filter((_, j) => j !== i))} className="min-h-11 justify-self-start px-2 text-sm font-bold text-red-600 hover:text-red-800">
                      {t("Remove")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <SecondaryButton type="button" className={places.length > 0 ? "mt-3" : ""} onClick={() => setPlaces((prev) => [...prev, { country: ownCountry, place: "", kind: "fee", value: "", currency: "", days: "" }])}>
            {t("Add a country or place")}
          </SecondaryButton>
        </div>

        {fee > 0 && (
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
