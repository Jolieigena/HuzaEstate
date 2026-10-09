"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import RequireAuth from "@/components/shared/RequireAuth";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import OrderList from "@/components/shop/OrderList";
import { FurnitureApi, type Order } from "@/lib/furniture/api";
import { DESIGN_REQUEST_STATUS_LABELS, DesignsApi, formatMoney, type DesignRequest, type DesignRequestStatus, type FurnitureQuote } from "@/lib/designs/api";

const primary = "min-h-10 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#2ec440] disabled:opacity-50";
const secondary = "min-h-10 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:border-[#2ec440] hover:text-[#219b31] disabled:opacity-50";

const STATUS_STYLE: Record<DesignRequestStatus, string> = {
  open: "bg-sky-50 text-sky-700",
  quoted: "bg-amber-50 text-amber-700",
  accepted: "bg-[#2ec440]/10 text-[#219b31]",
  rejected: "bg-slate-100 text-slate-500",
  declined: "bg-red-50 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};

function date(value: string) {
  return new Intl.DateTimeFormat("en-RW", { dateStyle: "medium" }).format(new Date(value));
}

export default function DesignRequestsPage() {
  return (
    <RequireAuth>
      <Suspense fallback={null}>
        <Requests />
      </Suspense>
    </RequireAuth>
  );
}

function Requests() {
  const { token, isAuthReady } = useAuth();
  const initialTab = useSearchParams().get("tab");
  const [tab, setTab] = useState<"designs" | "furniture" | "orders">(initialTab === "orders" ? "orders" : initialTab === "furniture" ? "furniture" : "designs");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [requests, setRequests] = useState<DesignRequest[] | null>(null);
  const [quotes, setQuotes] = useState<FurnitureQuote[] | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!isAuthReady || !token) return;
    let cancelled = false;
    Promise.all([DesignsApi.myRequests(token), DesignsApi.myFurnitureQuotes(token), FurnitureApi.myOrders(token)]).then(([r, q, o]) => {
      if (cancelled) return;
      if (r.ok) setRequests(r.data.requests);
      else setError(r.error);
      if (q.ok) setQuotes(q.data.quotes);
      else setError(q.error);
      if (o.ok) setOrders(o.data.orders);
      else setError(o.error);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, reload]);

  const refresh = () => setReload((n) => n + 1);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">My requests</h1>
      <div className="mt-6 flex gap-2" role="tablist">
        {([["designs", "Design requests"], ["furniture", "Furniture quotes"], ["orders", "Furniture orders"]] as const).map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`rounded-full border px-5 py-2 text-sm font-bold transition-colors ${tab === key ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}>
            {label}
            {key === "designs" && requests ? ` (${requests.length})` : ""}
            {key === "furniture" && quotes ? ` (${quotes.length})` : ""}
            {key === "orders" && orders ? ` (${orders.length})` : ""}
          </button>
        ))}
      </div>

      {error && <p className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

      <div className="mt-6">{tab === "designs" ? <DesignRequestList requests={requests} onChanged={refresh} /> : tab === "furniture" ? <FurnitureQuoteList quotes={quotes} onChanged={refresh} /> : <OrderList orders={orders} onChanged={refresh} />}</div>
    </main>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
      <p className="font-bold text-slate-500">{text}</p>
      <Link href="/designs" className="mt-3 inline-block text-sm font-bold text-[#219b31] hover:underline">
        Browse designs
      </Link>
    </div>
  );
}

function DesignRequestList({ requests, onChanged }: { requests: DesignRequest[] | null; onChanged: () => void }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [busyId, setBusyId] = useState("");

  const act = async (id: string, action: "acceptQuote" | "rejectQuote" | "cancelRequest", message: string) => {
    if (!token) return;
    setBusyId(id);
    const result = await DesignsApi[action](token, id);
    setBusyId("");
    if (!result.ok) showToast(result.error, "error");
    else {
      showToast(message);
      onChanged();
    }
  };

  if (requests === null) return <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading…</p>;
  if (requests.length === 0) return <Empty text="You haven't sent any design requests" />;

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <section key={request.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{request.kind === "custom_price" ? "Price request" : "Custom design"}</p>
              <h2 className="mt-1 font-black text-slate-900">{request.designTitle || "New design for your space"}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {request.designId ? (
                  <Link href={`/designs/${request.designId}`} className="hover:underline">
                    {request.professionalName ?? "Designer"}
                  </Link>
                ) : (
                  (request.professionalName ?? "Designer")
                )}{" "}
                · {date(request.createdAt)}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[request.status]}`}>{DESIGN_REQUEST_STATUS_LABELS[request.status]}</span>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{request.message}</p>
          {request.quote && (
            <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-sm font-black text-slate-900">
                Price: {formatMoney(request.quote.amount, request.quote.currency)}
                {request.quote.validUntil ? <span className="font-semibold text-slate-500"> · valid until {date(request.quote.validUntil)}</span> : null}
              </p>
              {request.quote.note && <p className="mt-1 text-sm text-slate-600">{request.quote.note}</p>}
            </div>
          )}
          {request.declineReason && <p className="mt-3 text-sm text-slate-500">Reason: {request.declineReason}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {request.status === "quoted" && (
              <>
                <button type="button" className={primary} disabled={busyId === request.id} onClick={() => act(request.id, "acceptQuote", "Price accepted.")}>
                  Accept price
                </button>
                <button type="button" className={secondary} disabled={busyId === request.id} onClick={() => act(request.id, "rejectQuote", "Price turned down.")}>
                  Turn down
                </button>
              </>
            )}
            {(request.status === "open" || request.status === "quoted") && (
              <button type="button" className={secondary} disabled={busyId === request.id} onClick={() => act(request.id, "cancelRequest", "Request cancelled.")}>
                Cancel request
              </button>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function FurnitureQuoteList({ quotes, onChanged }: { quotes: FurnitureQuote[] | null; onChanged: () => void }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [busyId, setBusyId] = useState("");

  const accept = async (quote: FurnitureQuote, supplierId: string) => {
    if (!token) return;
    setBusyId(quote.id);
    const result = await DesignsApi.acceptFurnitureQuote(token, quote.id, supplierId);
    setBusyId("");
    if (!result.ok) showToast(result.error, "error");
    else {
      showToast("Quote accepted. The supplier has been told.");
      onChanged();
    }
  };

  const close = async (quote: FurnitureQuote) => {
    if (!token) return;
    setBusyId(quote.id);
    const result = await DesignsApi.closeFurnitureQuote(token, quote.id);
    setBusyId("");
    if (!result.ok) showToast(result.error, "error");
    else {
      showToast("Request closed.");
      onChanged();
    }
  };

  if (quotes === null) return <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading…</p>;
  if (quotes.length === 0) return <Empty text="You haven't asked for any furniture quotes" />;

  return (
    <div className="space-y-4">
      {quotes.map((quote) => {
        const sameCurrency = new Set(quote.responses.map((r) => r.currency)).size <= 1;
        const sorted = [...quote.responses].sort((a, b) => a.total - b.total);
        return (
          <section key={quote.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link href={`/designs/${quote.designId}`} className="font-black text-slate-900 hover:underline">
                  {quote.designTitle}
                </Link>
                <p className="mt-1 text-sm text-slate-500">
                  {quote.items.length} items · {date(quote.createdAt)} · {quote.responseCount} {quote.responseCount === 1 ? "quote" : "quotes"}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${quote.status === "accepted" ? "bg-[#2ec440]/10 text-[#219b31]" : quote.status === "open" ? "bg-sky-50 text-sky-700" : "bg-slate-100 text-slate-500"}`}>
                {quote.status === "open" ? "Collecting quotes" : quote.status === "accepted" ? "Supplier chosen" : "Closed"}
              </span>
            </div>
            <ul className="mt-3 space-y-0.5 text-sm text-slate-600">
              {quote.items.map((item, index) => (
                <li key={index}>
                  {item.quantity} × {item.name}
                </li>
              ))}
            </ul>

            {sorted.length === 0 ? (
              <p className="mt-4 text-sm font-semibold text-slate-400">No supplier has answered yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {sorted.map((response, index) => {
                  const chosen = quote.acceptedSupplierId === response.supplierId;
                  return (
                    <div key={response.supplierId} className={`rounded-xl border p-4 ${chosen ? "border-[#2ec440] bg-[#2ec440]/5" : "border-slate-200"}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold text-slate-900">
                          {response.companyName}
                          {sameCurrency && sorted.length > 1 && index === 0 ? <span className="ml-2 rounded-full bg-[#2ec440]/10 px-2 py-0.5 text-[11px] font-bold text-[#219b31]">Lowest</span> : null}
                          {chosen ? <span className="ml-2 rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-bold text-white">Chosen</span> : null}
                        </p>
                        <p className="text-lg font-black text-slate-900">{formatMoney(response.total, response.currency)}</p>
                      </div>
                      <ul className="mt-2 space-y-0.5 text-sm text-slate-600">
                        {response.lines.map((line, i) => (
                          <li key={i} className="flex justify-between gap-3">
                            <span>
                              {line.quantity} × {line.name}
                              {line.note ? <span className="text-slate-400"> ({line.note})</span> : null}
                            </span>
                            <span className="shrink-0">{line.available && line.unitPrice !== undefined ? `${formatMoney(line.unitPrice, response.currency)} each` : "Not available"}</span>
                          </li>
                        ))}
                      </ul>
                      {(response.leadTimeDays !== undefined || response.note) && (
                        <p className="mt-2 text-sm text-slate-500">
                          {response.leadTimeDays !== undefined ? `Delivery in ${response.leadTimeDays} days. ` : ""}
                          {response.note}
                        </p>
                      )}
                      {quote.status === "open" && (
                        <div className="mt-3">
                          <button type="button" className={primary} disabled={busyId === quote.id} onClick={() => accept(quote, response.supplierId)}>
                            Accept this quote
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {quote.status === "open" && (
              <div className="mt-4">
                <button type="button" className={secondary} disabled={busyId === quote.id} onClick={() => close(quote)}>
                  Close request
                </button>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
