"use client";

import { useEffect, useId, useState } from "react";
import Dialog from "@/components/Dialog";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { DESIGN_REQUEST_STATUS_LABELS, DesignsApi, formatMoney, type DesignRequest } from "@/lib/designs/api";
import { Card, EmptyState, PageFrame, PrimaryButton, SecondaryButton, StatusPill, fieldClass, formatDate } from "./ui";

/** Requests clients sent the professional: a price on one of their designs, or a custom design. */
export default function DesignRequestsPage() {
  const { token, isAuthReady } = useAuth();
  const [requests, setRequests] = useState<DesignRequest[] | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [pricing, setPricing] = useState<DesignRequest | null>(null);
  const [declining, setDeclining] = useState<DesignRequest | null>(null);

  useEffect(() => {
    if (!isAuthReady || !token) return;
    let cancelled = false;
    DesignsApi.incomingRequests(token).then((result) => {
      if (cancelled) return;
      if (result.ok) setRequests(result.data.requests);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, reload]);

  const done = () => {
    setPricing(null);
    setDeclining(null);
    setReload((n) => n + 1);
  };

  return (
    <PageFrame title="Requests">
      {error ? (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
      ) : requests === null ? (
        <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading…</p>
      ) : requests.length === 0 ? (
        <EmptyState title="No requests yet" />
      ) : (
        <div className="space-y-5">
          {requests.map((request) => (
            <Card key={request.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{request.kind === "custom_price" ? "Price request" : "Custom design"}</p>
                  <h3 className="mt-1 font-black text-slate-900">{request.designTitle || "New design for a client's space"}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {request.clientName} · {request.clientEmail} · {formatDate(request.createdAt)}
                  </p>
                </div>
                <StatusPill status={DESIGN_REQUEST_STATUS_LABELS[request.status]} />
              </div>
              <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                {request.spaceType && (
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Space</dt>
                    <dd className="font-semibold text-slate-800">{request.spaceType}</dd>
                  </div>
                )}
                {request.areaSqm && (
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Area</dt>
                    <dd className="font-semibold text-slate-800">{request.areaSqm} m²</dd>
                  </div>
                )}
                {request.budget && (
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Budget</dt>
                    <dd className="font-semibold text-slate-800">{formatMoney(request.budget, request.budgetCurrency || "USD")}</dd>
                  </div>
                )}
              </dl>
              <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-700">{request.message}</p>
              {request.quote && (
                <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <span className="font-bold text-slate-900">Your price: {formatMoney(request.quote.amount, request.quote.currency)}</span>
                  {request.quote.validUntil ? ` · valid until ${formatDate(request.quote.validUntil)}` : ""}
                  {request.quote.note ? <span className="mt-1 block text-slate-500">{request.quote.note}</span> : null}
                </p>
              )}
              {request.declineReason && <p className="mt-3 text-sm text-slate-500">Reason given: {request.declineReason}</p>}
              {(request.status === "open" || request.status === "quoted") && (
                <div className="mt-5 flex flex-wrap gap-2">
                  <PrimaryButton type="button" onClick={() => setPricing(request)}>
                    {request.status === "quoted" ? "Change price" : "Send a price"}
                  </PrimaryButton>
                  <SecondaryButton type="button" onClick={() => setDeclining(request)}>
                    Decline
                  </SecondaryButton>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <PriceDialog request={pricing} onClose={() => setPricing(null)} onDone={done} />
      <DeclineDialog request={declining} onClose={() => setDeclining(null)} onDone={done} />
    </PageFrame>
  );
}

function PriceDialog({ request, onClose, onDone }: { request: DesignRequest | null; onClose: () => void; onDone: () => void }) {
  const titleId = useId();
  return (
    <Dialog open={request !== null} onClose={onClose} labelledBy={titleId} panelClassName="max-w-md">
      {request && <PriceForm key={request.id} titleId={titleId} request={request} onClose={onClose} onDone={onDone} />}
    </Dialog>
  );
}

function PriceForm({ titleId, request, onClose, onDone }: { titleId: string; request: DesignRequest; onClose: () => void; onDone: () => void }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [amount, setAmount] = useState(request.quote ? String(request.quote.amount) : "");
  const [currency, setCurrency] = useState(request.quote?.currency ?? request.budgetCurrency ?? "USD");
  const [note, setNote] = useState(request.quote?.note ?? "");
  const [days, setDays] = useState("14");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!token) return;
    setBusy(true);
    const result = await DesignsApi.quoteRequest(token, request.id, { amount: Number(amount), currency: currency.toUpperCase(), note, ...(days ? { validDays: Number(days) } : {}) });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    showToast("Price sent.");
    onDone();
  };

  return (
    <div className="p-6">
      <h2 id={titleId} className="mb-4 pr-6 text-lg font-semibold text-slate-900">
        Send a price to {request.clientName}
      </h2>
      <div className="space-y-4">
        <div className="grid grid-cols-[1fr_6rem] gap-3">
          <label className="block text-sm font-bold text-slate-700">
            Price
            <input className={`${fieldClass} mt-1`} inputMode="decimal" autoFocus value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Currency
            <input className={`${fieldClass} mt-1 uppercase`} value={currency} maxLength={3} onChange={(e) => setCurrency(e.target.value.replace(/[^A-Za-z]/g, ""))} />
          </label>
        </div>
        <label className="block text-sm font-bold text-slate-700">
          Valid for (days)
          <input className={`${fieldClass} mt-1`} inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ""))} />
        </label>
        <label className="block text-sm font-bold text-slate-700">
          What the price includes
          <textarea className={`${fieldClass} mt-1 min-h-24 resize-y font-normal`} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        {error && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <SecondaryButton type="button" onClick={onClose}>
          Cancel
        </SecondaryButton>
        <PrimaryButton type="button" disabled={busy || !(Number(amount) > 0)} onClick={submit}>
          {busy ? "Sending…" : "Send price"}
        </PrimaryButton>
      </div>
    </div>
  );
}

function DeclineDialog({ request, onClose, onDone }: { request: DesignRequest | null; onClose: () => void; onDone: () => void }) {
  const titleId = useId();
  return (
    <Dialog open={request !== null} onClose={onClose} labelledBy={titleId} panelClassName="max-w-md">
      {request && <DeclineForm key={request.id} titleId={titleId} request={request} onClose={onClose} onDone={onDone} />}
    </Dialog>
  );
}

function DeclineForm({ titleId, request, onClose, onDone }: { titleId: string; request: DesignRequest; onClose: () => void; onDone: () => void }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!token) return;
    setBusy(true);
    const result = await DesignsApi.declineRequest(token, request.id, reason.trim() || undefined);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    showToast("Request declined.");
    onDone();
  };

  return (
    <div className="p-6">
      <h2 id={titleId} className="mb-4 pr-6 text-lg font-semibold text-slate-900">
        Decline this request?
      </h2>
      <label className="block text-sm font-bold text-slate-700">
        Reason (optional, the client will see it)
        <textarea className={`${fieldClass} mt-1 min-h-24 resize-y font-normal`} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      {error && <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <SecondaryButton type="button" onClick={onClose}>
          Cancel
        </SecondaryButton>
        <PrimaryButton type="button" disabled={busy} onClick={submit}>
          {busy ? "Declining…" : "Decline"}
        </PrimaryButton>
      </div>
    </div>
  );
}
