"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { FurnitureApi, ORDER_STATUS_LABELS, formatPrice, paymentMethodLabel, type Order, type OrderStatus } from "@/lib/furniture/api";

const primary = "min-h-10 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#2ec440] disabled:opacity-50";
const secondary = "min-h-10 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:border-[#2ec440] hover:text-[#219b31] disabled:opacity-50";

function date(value: string) {
  return new Intl.DateTimeFormat("en-RW", { dateStyle: "medium" }).format(new Date(value));
}

const ORDER_STYLE: Record<OrderStatus, string> = {
  requested: "bg-sky-50 text-sky-700",
  confirmed: "bg-amber-50 text-amber-700",
  completed: "bg-[#2ec440]/10 text-[#219b31]",
  declined: "bg-red-50 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};

export default function OrderList({ orders, onChanged }: { orders: Order[] | null; onChanged: () => void }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [busyId, setBusyId] = useState("");

  // Payment happens on IremboPay's own page, which has no way of sending the person back here. So whenever they
  // return to this tab, any order that was sent off to be paid is asked about, and updated if it was.
  useEffect(() => {
    if (!token || !orders?.some((o) => o.paymentStatus === "pending")) return;
    const check = async () => {
      const pending = orders.filter((o) => o.paymentStatus === "pending");
      const results = await Promise.all(pending.map((o) => FurnitureApi.refreshPayment(token, o.id)));
      if (results.some((r) => r.ok && r.data.paymentStatus === "paid")) onChanged();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [token, orders, onChanged]);

  const pay = async (order: Order) => {
    if (!token) return;
    setBusyId(order.id);
    const result = await FurnitureApi.payOrder(token, order.id);
    setBusyId("");
    if (!result.ok) {
      showToast(result.error, "error");
      return;
    }
    // Opens IremboPay's checkout (mobile money, bank or card) in a new tab, so this page stays here to be updated.
    window.open(result.data.paymentLinkUrl, "_blank", "noopener");
    onChanged();
  };

  const checkPayment = async (order: Order) => {
    if (!token) return;
    setBusyId(order.id);
    const result = await FurnitureApi.refreshPayment(token, order.id);
    setBusyId("");
    if (!result.ok) showToast(result.error, "error");
    else if (result.data.paymentStatus === "paid") {
      showToast("Payment received.");
      onChanged();
    } else showToast("No payment yet. If you have just paid, wait a moment and check again.");
  };

  const cancel = async (order: Order) => {
    if (!token) return;
    setBusyId(order.id);
    const result = await FurnitureApi.cancelOrder(token, order.id);
    setBusyId("");
    if (!result.ok) showToast(result.error, "error");
    else {
      showToast("Order cancelled.");
      onChanged();
    }
  };

  if (orders === null) return <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading…</p>;
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
        <p className="font-bold text-slate-500">You haven&apos;t ordered any furniture</p>
        <Link href="/shop" className="mt-3 inline-block text-sm font-bold text-[#219b31] hover:underline">
          Browse furniture
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <section key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-black text-slate-900">{order.supplierName ?? "Supplier"}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {formatPrice(order.total, order.currency)} · {date(order.createdAt)}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${ORDER_STYLE[order.status]}`}>{ORDER_STATUS_LABELS[order.status]}</span>
          </div>
          <ul className="mt-3 divide-y divide-slate-100">
            {order.items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3 py-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {item.image ? <img src={item.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" /> : <div className="h-12 w-12 shrink-0 rounded-lg bg-slate-100" />}
                <Link href={`/shop/${item.productId}`} className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800 hover:underline">
                  {item.name}
                </Link>
                <span className="shrink-0 text-sm text-slate-600">
                  {item.quantity} × {formatPrice(item.unitPrice, order.currency)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-slate-500">Deliver to {[order.address, order.city].filter(Boolean).join(", ")}</p>
          {order.reply && <p className="mt-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{order.reply}</p>}
          {order.status === "confirmed" && order.deliveryDays !== undefined && <p className="mt-2 text-sm font-semibold text-slate-700">Delivery in about {order.deliveryDays} days</p>}
          {order.paymentStatus === "paid" && (
            <p className="mt-3 inline-flex rounded-full bg-[#2ec440]/10 px-3 py-1 text-xs font-bold text-[#219b31]">Paid{order.paymentMethod ? ` with ${paymentMethodLabel(order.paymentMethod)}` : ""}</p>
          )}
          {(order.status === "requested" || order.status === "confirmed") && (
            <div className="mt-4 flex flex-wrap gap-2">
              {order.payable && (
                <button type="button" className={primary} disabled={busyId === order.id} onClick={() => pay(order)}>
                  {order.paymentStatus === "pending" ? "Open payment page" : `Pay ${formatPrice(order.total, order.currency)}`}
                </button>
              )}
              {order.paymentStatus === "pending" && (
                <button type="button" className={secondary} disabled={busyId === order.id} onClick={() => checkPayment(order)}>
                  I have paid
                </button>
              )}
              {order.paymentStatus !== "paid" && (
                <button type="button" className={secondary} disabled={busyId === order.id} onClick={() => cancel(order)}>
                  Cancel order
                </button>
              )}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
