"use client";

import { useEffect, useId, useState } from "react";
import Dialog from "@/components/Dialog";
import { DaysSelect } from "@/components/designs/fields";
import { Card, EmptyState, PageFrame, PrimaryButton, SecondaryButton, StatusPill, fieldClass, formatDate } from "@/components/professional/ui";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { FurnitureApi, ORDER_STATUS_LABELS, formatPrice, type Order } from "@/lib/furniture/api";

type Action = { order: Order; kind: "confirm" | "decline" };

/** Order requests from clients for the supplier's products: confirm or decline them, then mark them delivered. */
export default function SupplierOrdersPage() {
  const { token, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [action, setAction] = useState<Action | null>(null);

  useEffect(() => {
    if (!isAuthReady || !token) return;
    let cancelled = false;
    FurnitureApi.incomingOrders(token).then((result) => {
      if (cancelled) return;
      if (result.ok) setOrders(result.data.orders);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, reload]);

  const complete = async (order: Order) => {
    if (!token) return;
    const result = await FurnitureApi.completeOrder(token, order.id);
    if (!result.ok) showToast(result.error, "error");
    else {
      showToast("Marked as delivered.");
      setReload((n) => n + 1);
    }
  };

  return (
    <PageFrame title="Orders">
      {error ? (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
      ) : orders === null ? (
        <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading…</p>
      ) : orders.length === 0 ? (
        <EmptyState title="No orders yet" />
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <Card key={order.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-900">{formatPrice(order.total, order.currency)}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {order.clientName} · {formatDate(order.createdAt)}
                  </p>
                </div>
                <StatusPill status={ORDER_STATUS_LABELS[order.status]} />
              </div>
              <ul className="mt-4 divide-y divide-slate-100">
                {order.items.map((item) => (
                  <li key={item.productId} className="flex items-center gap-3 py-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {item.image ? <img src={item.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" /> : <div className="h-12 w-12 shrink-0 rounded-lg bg-slate-100" />}
                    <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800">{item.name}</p>
                    <p className="shrink-0 text-sm text-slate-600">
                      {item.quantity} × {formatPrice(item.unitPrice, order.currency)}
                    </p>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Deliver to</dt>
                  <dd className="font-semibold text-slate-800">{[order.address, order.city].filter(Boolean).join(", ")}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Contact</dt>
                  <dd className="font-semibold text-slate-800">
                    {order.clientPhone && (
                      <a href={`tel:${order.clientPhone}`} className="hover:text-[#219b31]">
                        {order.clientPhone}
                      </a>
                    )}
                    {order.clientEmail && (
                      <a href={`mailto:${order.clientEmail}`} className="block break-all hover:text-[#219b31]">
                        {order.clientEmail}
                      </a>
                    )}
                  </dd>
                </div>
              </dl>
              {order.note && <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">“{order.note}”</p>}
              {order.reply && <p className="mt-3 text-sm text-slate-500">Your reply: {order.reply}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {order.status === "requested" && (
                  <>
                    <PrimaryButton type="button" onClick={() => setAction({ order, kind: "confirm" })}>
                      Confirm
                    </PrimaryButton>
                    <SecondaryButton type="button" onClick={() => setAction({ order, kind: "decline" })}>
                      Decline
                    </SecondaryButton>
                  </>
                )}
                {order.status === "confirmed" && (
                  <PrimaryButton type="button" onClick={() => complete(order)}>
                    Mark as delivered
                  </PrimaryButton>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ReplyDialog
        action={action}
        onClose={() => setAction(null)}
        onDone={() => {
          setAction(null);
          setReload((n) => n + 1);
        }}
      />
    </PageFrame>
  );
}

function ReplyDialog({ action, onClose, onDone }: { action: Action | null; onClose: () => void; onDone: () => void }) {
  const titleId = useId();
  return (
    <Dialog open={action !== null} onClose={onClose} labelledBy={titleId} panelClassName="max-w-md">
      {action && <ReplyForm key={`${action.order.id}-${action.kind}`} titleId={titleId} action={action} onClose={onClose} onDone={onDone} />}
    </Dialog>
  );
}

function ReplyForm({ titleId, action, onClose, onDone }: { titleId: string; action: Action; onClose: () => void; onDone: () => void }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const confirming = action.kind === "confirm";
  const [days, setDays] = useState("7");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!token) return;
    setBusy(true);
    const result = confirming
      ? await FurnitureApi.confirmOrder(token, action.order.id, { deliveryDays: Number(days), message: message.trim() || undefined })
      : await FurnitureApi.declineOrder(token, action.order.id, message.trim() || undefined);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    showToast(confirming ? "Order confirmed." : "Order declined.");
    onDone();
  };

  return (
    <div className="p-6">
      <h2 id={titleId} className="mb-4 pr-6 text-lg font-semibold text-slate-900">
        {confirming ? "Confirm this order" : "Decline this order"}
      </h2>
      <div className="space-y-4">
        {confirming && (
          <label className="block text-sm font-bold text-slate-700">
            Delivery in
            <DaysSelect className={`${fieldClass} mt-1`} ariaLabel="Delivery in" value={days} onChange={setDays} options={[{ value: "0", label: "Same day" }, ...[2, 3, 5, 7, 14, 21, 30].map((d) => ({ value: String(d), label: `${d} days` }))]} />
          </label>
        )}
        <label className="block text-sm font-bold text-slate-700">
          Message to the client <span className="font-normal text-slate-400">(optional)</span>
          <textarea className={`${fieldClass} mt-1 min-h-24 resize-none font-normal`} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} />
        </label>
        {error && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <SecondaryButton type="button" onClick={onClose}>
          Cancel
        </SecondaryButton>
        <PrimaryButton type="button" disabled={busy} onClick={submit}>
          {busy ? "Saving…" : confirming ? "Confirm order" : "Decline order"}
        </PrimaryButton>
      </div>
    </div>
  );
}
