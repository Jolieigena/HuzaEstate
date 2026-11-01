"use client";

import { useEffect, useState } from "react";
import { CurrencySelect, useCurrencyChoice } from "@/components/designs/fields";
import { Card, EmptyState, PageFrame, PrimaryButton, SecondaryButton, StatusPill, fieldClass, formatDate, formatMoney } from "@/components/professional/ui";
import { useAuth } from "@/lib/auth-context";
import { DesignBriefsApi, DESIGN_BRIEF_STATUS_LABELS, type DesignBrief } from "@/lib/designBriefs/api";
import { DESIGN_CATEGORY_LABELS, DESIGN_PART_KIND_LABELS } from "@/lib/designs/api";
import { useToast } from "@/lib/toast-context";

function ReplyForm({ brief, onSaved }: { brief: DesignBrief; onSaved: (brief: DesignBrief) => void }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const { currency, setCurrency } = useCurrencyChoice();
  const mine = brief.myReply;
  const [price, setPrice] = useState(mine ? String(mine.price) : "");
  const [days, setDays] = useState(mine?.leadTimeDays !== undefined ? String(mine.leadTimeDays) : "");
  const [note, setNote] = useState(mine?.note ?? "");
  const [chosenCurrency, setChosenCurrency] = useState(mine?.currency ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!token || busy) return;
    setBusy(true);
    setError("");
    const result = await DesignBriefsApi.reply(token, brief.id, { price: Number(price), currency: chosenCurrency || currency, ...(days !== "" ? { leadTimeDays: Number(days) } : {}), note: note.trim() });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    showToast(mine ? "Price updated." : "Price sent.");
    onSaved(result.data);
  };

  return (
    <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
      <p className="text-sm font-bold text-slate-800">{mine ? "Your price (you can change it while the brief is open)" : "Your price"}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm font-bold text-slate-700">
          Total price
          <input className={`${fieldClass} mt-1`} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))} />
        </label>
        <label className="block text-sm font-bold text-slate-700">
          Currency
          <CurrencySelect className={`${fieldClass} mt-1`} value={chosenCurrency || currency} onChange={(c) => { setChosenCurrency(c); setCurrency(c); }} />
        </label>
        <label className="block text-sm font-bold text-slate-700">
          Lead time (days)
          <input className={`${fieldClass} mt-1`} inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ""))} />
        </label>
      </div>
      <label className="block text-sm font-bold text-slate-700">
        Note <span className="font-normal text-slate-400">(each part&apos;s price, materials and finishes)</span>
        <textarea className={`${fieldClass} mt-1 min-h-24 resize-y font-normal`} value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} />
      </label>
      {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}
      <div className="flex justify-end">
        <PrimaryButton type="button" disabled={busy || !(Number(price) > 0)} onClick={submit}>
          {busy ? "Sending…" : mine ? "Update price" : "Send price"}
        </PrimaryButton>
      </div>
    </div>
  );
}

/** Designs HuzaEstate sent to this supplier or builder to price. Each can be answered with one price and a lead time. */
export default function DesignBriefsInbox() {
  const { token, isAuthReady } = useAuth();
  const [briefs, setBriefs] = useState<DesignBrief[] | null>(null);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthReady || !token) return;
    let cancelled = false;
    DesignBriefsApi.inbox(token).then((result) => {
      if (cancelled) return;
      if (result.ok) setBriefs(result.data);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token]);

  const replace = (next: DesignBrief) => setBriefs((list) => (list ? list.map((b) => (b.id === next.id ? next : b)) : list));

  return (
    <PageFrame title="Design briefs">
      {error ? (
        <Card className="border-red-100 bg-red-50/60 text-sm text-red-700">{error}</Card>
      ) : briefs === null ? (
        <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading…</p>
      ) : briefs.length === 0 ? (
        <EmptyState title="No design briefs yet" description="Designs HuzaEstate wants priced will appear here." />
      ) : (
        <div className="space-y-5">
          {briefs.map((brief) => {
            const open = openId === brief.id;
            return (
              <Card key={brief.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {DESIGN_CATEGORY_LABELS[brief.category]}
                      {brief.spaceType ? ` · ${brief.spaceType}` : ""}
                      {brief.sentAt ? ` · sent ${formatDate(brief.sentAt)}` : ""}
                    </p>
                    <h3 className="mt-1 text-lg font-black text-slate-900">{brief.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {brief.won && <StatusPill status="Accepted" />}
                    {brief.myReply && !brief.won && <StatusPill status={`Priced ${formatMoney(brief.myReply.price, brief.myReply.currency)}`} />}
                    <StatusPill status={DESIGN_BRIEF_STATUS_LABELS[brief.status]} />
                  </div>
                </div>

                {brief.images.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
                    {brief.images.map((url) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={url} src={url} alt="" className="h-24 w-full rounded-lg object-cover" />
                    ))}
                  </div>
                )}
                {brief.description && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{brief.description}</p>}
                {brief.parts.length > 0 && (
                  <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {brief.parts.map((part) => (
                      <li key={part.id ?? part.name} className="px-4 py-2.5 text-sm">
                        <span className="font-semibold text-slate-800">{part.name}</span>
                        <span className="ml-2 text-xs text-slate-400">{DESIGN_PART_KIND_LABELS[part.kind]}</span>
                        {part.description && <p className="text-xs text-slate-500">{part.description}</p>}
                      </li>
                    ))}
                  </ul>
                )}
                {brief.instructions && <p className="mt-3 whitespace-pre-line rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{brief.instructions}</p>}

                {brief.status === "sent" && (open ? <ReplyForm brief={brief} onSaved={(next) => { replace(next); setOpenId(null); }} /> : (
                  <div className="mt-4 flex justify-end">
                    <SecondaryButton type="button" onClick={() => setOpenId(brief.id)}>
                      {brief.myReply ? "Change my price" : "Send a price"}
                    </SecondaryButton>
                  </div>
                ))}
              </Card>
            );
          })}
        </div>
      )}
    </PageFrame>
  );
}
