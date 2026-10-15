"use client";

import { useEffect, useState } from "react";
import RequireAuth from "@/components/shared/RequireAuth";
import OrderList from "@/components/shop/OrderList";
import { useAuth } from "@/lib/auth-context";
import { FurnitureApi, type Order, type OrderStatus } from "@/lib/furniture/api";

const FILTERS: { id: string; label: string; match: (status: OrderStatus) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "waiting", label: "Waiting", match: (s) => s === "requested" || s === "confirmed" },
  { id: "shipped", label: "On its way", match: (s) => s === "shipped" },
  { id: "delivered", label: "Delivered", match: (s) => s === "completed" },
  { id: "closed", label: "Cancelled or declined", match: (s) => s === "cancelled" || s === "declined" },
];

export default function MyOrdersPage() {
  return (
    <RequireAuth>
      <Orders />
    </RequireAuth>
  );
}

function Orders() {
  const { token, isAuthReady } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!isAuthReady || !token) return;
    let cancelled = false;
    FurnitureApi.myOrders(token).then((result) => {
      if (cancelled) return;
      if (result.ok) setOrders(result.data.orders);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, reload]);

  const shown = orders === null ? null : orders.filter((o) => (FILTERS.find((f) => f.id === filter) ?? FILTERS[0]).match(o.status));

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">My orders</h1>
      {error && <p className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
      {orders && orders.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Show">
          {FILTERS.map((f) => {
            const count = orders.filter((o) => f.match(o.status)).length;
            if (f.id !== "all" && count === 0 && f.id !== filter) return null;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={f.id === filter}
                onClick={() => setFilter(f.id)}
                className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-bold transition-colors ${f.id === filter ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
              >
                {f.label}
                <span className={`text-xs ${f.id === filter ? "text-white/70" : "text-slate-400"}`}>{count}</span>
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-6">
        {shown !== null && shown.length === 0 && orders !== null && orders.length > 0 ? (
          <p className="rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center text-sm font-bold text-slate-500">Nothing in this view</p>
        ) : (
          <OrderList orders={shown} onChanged={() => setReload((n) => n + 1)} />
        )}
      </div>
    </main>
  );
}
