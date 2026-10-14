"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, EmptyState, PageFrame, StatusPill, formatDate } from "@/components/professional/ui";
import { useAuth } from "@/lib/auth-context";
import { DesignsApi } from "@/lib/designs/api";
import { FurnitureApi, ORDER_STATUS_LABELS, formatPrice, type Earnings, type Order, type Product } from "@/lib/furniture/api";

interface Data {
  orders: Order[];
  earnings: Earnings | null;
  products: Product[];
  openRequests: number;
}

function Tile({ href, label, value, note, attention }: { href: string; label: string; value: string; note?: string; attention?: boolean }) {
  return (
    <Link href={href} className={`block rounded-2xl border bg-white p-5 shadow-sm transition-colors hover:border-[#2ec440] ${attention ? "border-amber-300 bg-amber-50/40" : "border-slate-200"}`}>
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
      {note && <p className="mt-1 truncate text-xs text-slate-500">{note}</p>}
    </Link>
  );
}

/** The supplier's home: what needs doing today, in one place, with the orders that came in last. */
export default function SupplierDashboard() {
  const { token, isAuthReady, account } = useAuth();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthReady || !token) return;
    let cancelled = false;
    Promise.all([FurnitureApi.incomingOrders(token), FurnitureApi.earningsMine(token), FurnitureApi.mine(token), DesignsApi.supplierFurnitureQuotes(token, "open")]).then(([orders, earnings, products, quotes]) => {
      if (cancelled) return;
      if (!orders.ok) {
        setError(orders.error);
        return;
      }
      setData({ orders: orders.data.orders, earnings: earnings.ok ? earnings.data : null, products: products.ok ? products.data.products : [], openRequests: quotes.ok ? quotes.data.quotes.length : 0 });
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token]);

  const toConfirm = data?.orders.filter((o) => o.status === "requested") ?? [];
  const toDeliver = data?.orders.filter((o) => o.status === "confirmed" || o.status === "shipped") ?? [];
  const paidToDeliver = toDeliver.filter((o) => o.paymentStatus === "paid").length;
  const lowStock = (data?.products ?? []).filter((p) => p.status === "published" && p.quantity !== undefined && p.quantity <= (p.lowStockAt ?? 3));
  const ready = (data?.earnings?.totals ?? []).filter((t) => t.ready > 0).map((t) => formatPrice(t.ready, t.currency));
  const recent = (data?.orders ?? []).slice(0, 5);
  const firstName = account?.name?.split(" ")[0];

  return (
    <PageFrame title={firstName ? `Welcome, ${firstName}` : "Overview"}>
      {error ? (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
      ) : data === null ? (
        <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading…</p>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Tile href="/supplier/orders" label="Orders to confirm" value={String(toConfirm.length)} attention={toConfirm.length > 0} note={toConfirm.length > 0 ? "Waiting for your answer" : undefined} />
            <Tile href="/supplier/orders" label="To deliver" value={String(toDeliver.length)} note={toDeliver.length > 0 ? `${paidToDeliver} paid` : undefined} />
            <Tile href="/supplier/payments" label="Ready for payout" value={ready.length ? ready.join(" · ") : "—"} />
            <Tile href="/supplier/requests" label="Quote requests" value={String(data.openRequests)} attention={data.openRequests > 0} note={data.openRequests > 0 ? "Open for your price" : undefined} />
            <Tile href="/supplier/products" label="Running low" value={String(lowStock.length)} attention={lowStock.length > 0} note={lowStock.slice(0, 2).map((p) => `${p.name} (${p.quantity})`).join(", ") || undefined} />
          </div>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-slate-900">Latest orders</h2>
              {data.orders.length > 5 && (
                <Link href="/supplier/orders" className="text-sm font-bold text-[#219b31] hover:underline">
                  See all
                </Link>
              )}
            </div>
            {recent.length === 0 ? (
              <EmptyState title="No orders yet" />
            ) : (
              <Card className="divide-y divide-slate-100 !p-0">
                {recent.map((order) => (
                  <Link key={order.id} href="/supplier/orders" className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="font-black text-slate-900">{formatPrice(order.total, order.currency)}</p>
                      <p className="mt-0.5 truncate text-sm text-slate-500">
                        {order.clientName} · {order.items.length} item{order.items.length === 1 ? "" : "s"} · {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {order.paymentStatus === "paid" && <span className="rounded-full bg-[#2ec440]/10 px-2.5 py-1 text-xs font-bold text-[#219b31]">Paid</span>}
                      <StatusPill status={ORDER_STATUS_LABELS[order.status]} />
                    </div>
                  </Link>
                ))}
              </Card>
            )}
          </section>
        </div>
      )}
    </PageFrame>
  );
}
