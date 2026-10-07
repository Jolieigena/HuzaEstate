"use client";

import { useEffect, useId, useState } from "react";
import Dialog from "@/components/Dialog";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { DesignsApi, formatMoney, type FurnitureQuote } from "@/lib/designs/api";
import { Card, EmptyState, PageFrame, PrimaryButton, SecondaryButton, StatusPill, fieldClass, formatDate } from "@/components/professional/ui";

/** Furniture quote requests. "open" lists what a supplier can still answer; "answered" lists what they
 *  have priced already, with its outcome, and lets them revise an answer while the request is open. */
export default function SupplierQuotesPage({ filter }: { filter: "open" | "answered" }) {
  const { token, isAuthReady, account } = useAuth();
  const [quotes, setQuotes] = useState<FurnitureQuote[] | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [answering, setAnswering] = useState<FurnitureQuote | null>(null);
  const supplierId = account?.id ?? "";

  useEffect(() => {
    if (!isAuthReady || !token) return;
    let cancelled = false;
    DesignsApi.supplierFurnitureQuotes(token, filter).then((result) => {
      if (cancelled) return;
      if (result.ok) setQuotes(result.data.quotes);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, filter, reload]);

  return (
    <PageFrame title={filter === "open" ? "Quote requests" : "My quotes"}>
      {error ? (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
      ) : quotes === null ? (
        <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading…</p>
      ) : quotes.length === 0 ? (
        <EmptyState title={filter === "open" ? "No open requests" : "You haven't answered any requests yet"} />
      ) : (
        <div className="space-y-5">
          {quotes.map((quote) => {
            const mine = quote.responses.find((r) => r.supplierId === supplierId);
            const outcome = quote.status === "accepted" ? (quote.acceptedSupplierId === supplierId ? "Accepted" : "Another supplier was chosen") : quote.status === "closed" ? "Closed" : mine ? "Waiting for the client" : "Open";
            return (
              <Card key={quote.id} className="flex flex-col gap-5 sm:flex-row">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {quote.designImage ? <img src={quote.designImage} alt="" className="h-36 w-full shrink-0 rounded-xl object-cover sm:w-52" /> : <div className="h-36 w-full shrink-0 rounded-xl bg-slate-100 sm:w-52" />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-black text-slate-900">{quote.designTitle}</h3>
                    <StatusPill status={outcome} />
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {formatDate(quote.createdAt)}
                    {quote.country ? ` · ${quote.country}` : ""}
                  </p>
                  <ul className="mt-3 space-y-1 text-sm text-slate-700">
                    {quote.items.map((item, index) => (
                      <li key={index}>
                        {item.quantity} × {item.name}
                        {item.notes ? <span className="text-slate-400"> ({item.notes})</span> : null}
                      </li>
                    ))}
                  </ul>
                  {quote.message && <p className="mt-3 text-sm italic text-slate-500">“{quote.message}”</p>}
                  {mine && (
                    <p className="mt-3 text-sm font-bold text-slate-900">
                      Your quote: {formatMoney(mine.total, mine.currency)}
                      {mine.leadTimeDays !== undefined ? ` · ${mine.leadTimeDays} days` : ""}
                    </p>
                  )}
                  {quote.status === "open" && (
                    <div className="mt-4">
                      <PrimaryButton type="button" onClick={() => setAnswering(quote)}>
                        {mine ? "Revise quote" : "Give a quote"}
                      </PrimaryButton>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AnswerDialog
        quote={answering}
        supplierId={supplierId}
        onClose={() => setAnswering(null)}
        onSaved={() => {
          setAnswering(null);
          setReload((n) => n + 1);
        }}
      />
    </PageFrame>
  );
}

function AnswerDialog({ quote, supplierId, onClose, onSaved }: { quote: FurnitureQuote | null; supplierId: string; onClose: () => void; onSaved: () => void }) {
  const titleId = useId();
  return (
    <Dialog open={quote !== null} onClose={onClose} labelledBy={titleId} panelClassName="max-w-2xl">
      {quote && <AnswerForm key={quote.id} titleId={titleId} quote={quote} supplierId={supplierId} onClose={onClose} onSaved={onSaved} />}
    </Dialog>
  );
}

function AnswerForm({ titleId, quote, supplierId, onClose, onSaved }: { titleId: string; quote: FurnitureQuote; supplierId: string; onClose: () => void; onSaved: () => void }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const previous = quote.responses.find((r) => r.supplierId === supplierId);
  const [currency, setCurrency] = useState(previous?.currency ?? "USD");
  const [lines, setLines] = useState(() =>
    quote.items.map((item, index) => {
      const old = previous?.lines[index];
      return { available: old ? old.available : true, price: old?.unitPrice ? String(old.unitPrice) : "", note: old?.note ?? "" };
    }),
  );
  const [leadTime, setLeadTime] = useState(previous?.leadTimeDays !== undefined ? String(previous.leadTimeDays) : "");
  const [note, setNote] = useState(previous?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const patch = (index: number, changes: Partial<(typeof lines)[number]>) => {
    setError("");
    setLines((current) => current.map((l, i) => (i === index ? { ...l, ...changes } : l)));
  };
  const total = lines.reduce((sum, l, i) => sum + (l.available && Number(l.price) > 0 ? Number(l.price) * quote.items[i].quantity : 0), 0);

  const submit = async () => {
    if (!token) return;
    setBusy(true);
    const result = await DesignsApi.respondToFurnitureQuote(token, quote.id, {
      currency: currency.toUpperCase(),
      lines: lines.map((l, index) => ({ index, available: l.available, ...(l.available ? { unitPrice: Number(l.price) } : {}), note: l.note })),
      ...(leadTime !== "" ? { leadTimeDays: Number(leadTime) } : {}),
      note,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    showToast("Quote sent.");
    onSaved();
  };

  return (
    <div className="flex max-h-[88vh] flex-col p-6">
      <h2 id={titleId} className="mb-1 pr-6 text-lg font-semibold text-slate-900">
        Quote for “{quote.designTitle}”
      </h2>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        <div className="space-y-3">
          {quote.items.map((item, index) => (
            <div key={index} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-slate-900">
                  {item.quantity} × {item.name}
                </p>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <input type="checkbox" className="h-4 w-4 accent-[#2ec440]" checked={lines[index].available} onChange={(e) => patch(index, { available: e.target.checked })} />
                  Available
                </label>
              </div>
              {item.notes && <p className="text-xs text-slate-400">{item.notes}</p>}
              {lines[index].available && (
                <div className="mt-2 grid gap-2 sm:grid-cols-[10rem_1fr]">
                  <input className={fieldClass} inputMode="decimal" placeholder="Price each" aria-label={`Price each for ${item.name}`} value={lines[index].price} onChange={(e) => patch(index, { price: e.target.value.replace(/[^\d.]/g, "") })} />
                  <input className={fieldClass} placeholder="Note (optional)" aria-label={`Note for ${item.name}`} maxLength={200} value={lines[index].note} onChange={(e) => patch(index, { note: e.target.value })} />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm font-bold text-slate-700">
            Currency
            <input className={`${fieldClass} mt-1 uppercase`} value={currency} maxLength={3} onChange={(e) => setCurrency(e.target.value.replace(/[^A-Za-z]/g, ""))} />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Delivery (days)
            <input className={`${fieldClass} mt-1`} inputMode="numeric" value={leadTime} onChange={(e) => setLeadTime(e.target.value.replace(/\D/g, ""))} />
          </label>
        </div>
        <label className="block text-sm font-bold text-slate-700">
          Message to the client
          <textarea className={`${fieldClass} mt-1 min-h-20 resize-y font-normal`} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        {error && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-900">Total {formatMoney(total, currency.toUpperCase() || "USD")}</p>
        <div className="flex gap-2">
          <SecondaryButton type="button" onClick={onClose}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="button" disabled={busy || total <= 0} onClick={submit}>
            {busy ? "Sending…" : previous ? "Update quote" : "Send quote"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
