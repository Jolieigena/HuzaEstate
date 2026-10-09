"use client";

import { useEffect, useState } from "react";
import RequireAuth from "@/components/shared/RequireAuth";
import OrderList from "@/components/shop/OrderList";
import { useAuth } from "@/lib/auth-context";
import { FurnitureApi, type Order } from "@/lib/furniture/api";

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

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">My orders</h1>
      {error && <p className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
      <div className="mt-6">
        <OrderList orders={orders} onChanged={() => setReload((n) => n + 1)} />
      </div>
    </main>
  );
}
