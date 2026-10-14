"use client";

import { use, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { FurnitureApi, ORDER_STATUS_LABELS, formatPrice, type Order } from "@/lib/furniture/api";
import { SuppliersApi, type SupplierProfile } from "@/lib/suppliers/api";

function longDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

/** A delivery note the supplier prints and sends with the order: what is in it, where it goes, who to call, and a place for
 *  the buyer to sign. The supplier's menus are hidden when printing. */
export default function DeliveryNotePage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const { token, isAuthReady } = useAuth();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [company, setCompany] = useState<SupplierProfile | null>(null);

  useEffect(() => {
    if (!isAuthReady || !token) return;
    let cancelled = false;
    FurnitureApi.incomingOrders(token).then((result) => {
      if (!cancelled) setOrder(result.ok ? (result.data.orders.find((o) => o.id === orderId) ?? null) : null);
    });
    SuppliersApi.getMine(token).then((result) => {
      if (!cancelled && result.ok) setCompany(result.data.profile);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, orderId]);

  if (order === undefined) return <p className="py-16 text-center text-sm font-semibold text-slate-400">Loading…</p>;
  if (order === null) return <p className="py-16 text-center text-sm font-semibold text-slate-500">This order could not be found.</p>;

  const paid = order.paymentStatus === "paid";
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 print:max-w-none print:p-0">
      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <h1 className="text-2xl font-black text-slate-900">Delivery note</h1>
        <button type="button" onClick={() => window.print()} className="min-h-11 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2ec440]">
          Print
        </button>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-xl font-black text-slate-900">{company?.companyName ?? "Delivery note"}</p>
            {company && (
              <p className="mt-1 text-sm text-slate-500">
                {[company.city, company.phone].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <div className="text-right text-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Delivery note</p>
            <p className="font-black text-slate-900">#{order.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-slate-500">{longDate(order.createdAt)}</p>
          </div>
        </header>

        <section className="grid gap-6 py-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Deliver to</p>
            <p className="mt-1 font-black text-slate-900">{order.clientName}</p>
            <p className="text-sm text-slate-700">{[order.address, order.city].filter(Boolean).join(", ")}</p>
            {order.clientPhone && <p className="text-sm font-semibold text-slate-700">{order.clientPhone}</p>}
            {order.mapLink && <p className="mt-1 break-all text-xs text-slate-500">Map: {order.mapLink}</p>}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Order</p>
            <p className="mt-1 text-sm text-slate-700">{ORDER_STATUS_LABELS[order.status]}</p>
            {order.deliveryDays !== undefined && <p className="text-sm text-slate-700">Delivery in about {order.deliveryDays} days</p>}
            {order.trackingNote && <p className="text-sm text-slate-700">{order.trackingNote}</p>}
          </div>
        </section>

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-y border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-400">
              <th className="py-2.5 pr-3">Item</th>
              <th className="px-3 py-2.5 text-right">Qty</th>
              <th className="px-3 py-2.5 text-right">Price</th>
              <th className="py-2.5 pl-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <tr key={item.productId}>
                <td className="py-2.5 pr-3 font-semibold text-slate-800">{item.name}</td>
                <td className="px-3 py-2.5 text-right text-slate-700">{item.quantity}</td>
                <td className="px-3 py-2.5 text-right text-slate-700">{formatPrice(item.unitPrice, order.currency)}</td>
                <td className="py-2.5 pl-3 text-right font-semibold text-slate-900">{formatPrice(item.unitPrice * item.quantity, order.currency)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            {order.deliveryFee > 0 && (
              <tr className="border-t border-slate-200">
                <td colSpan={3} className="py-2.5 pr-3 text-right text-slate-600">
                  Delivery
                </td>
                <td className="py-2.5 pl-3 text-right text-slate-700">{formatPrice(order.deliveryFee, order.currency)}</td>
              </tr>
            )}
            <tr className="border-t border-slate-300">
              <td colSpan={3} className="py-3 pr-3 text-right font-black text-slate-900">
                Total
              </td>
              <td className="py-3 pl-3 text-right text-base font-black text-slate-900">{formatPrice(order.total, order.currency)}</td>
            </tr>
          </tfoot>
        </table>

        <p className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${paid ? "bg-[#2ec440]/10 text-[#219b31]" : "bg-amber-50 text-amber-700"}`}>{paid ? "Paid online" : "Not paid. Collect on delivery"}</p>
        {order.note && <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">Buyer&apos;s note: {order.note}</p>}

        <footer className="mt-10 grid gap-8 sm:grid-cols-2">
          <div>
            <div className="h-14 border-b border-slate-400" />
            <p className="mt-1 text-xs text-slate-500">Received by (name and signature)</p>
          </div>
          <div>
            <div className="h-14 border-b border-slate-400" />
            <p className="mt-1 text-xs text-slate-500">Date</p>
          </div>
        </footer>
      </article>
    </div>
  );
}
