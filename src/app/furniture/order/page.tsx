"use client";

import Link from "next/link";
import { useState } from "react";
import RequireAuth from "@/components/shared/RequireAuth";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { useBasket, type BasketLine } from "@/lib/furniture/basket";
import { FurnitureApi, formatPrice } from "@/lib/furniture/api";

const field = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-[#2ec440] focus:ring-2 focus:ring-[#2ec440]/15";
const label = "block text-sm font-bold text-slate-700";

export default function OrderPage() {
  return (
    <RequireAuth>
      <OrderForm />
    </RequireAuth>
  );
}

function Empty() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-8">
      <h1 className="text-2xl font-black text-slate-900">Your order is empty</h1>
      <Link href="/furniture" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition-colors hover:bg-[#2ec440]">
        Browse furniture
      </Link>
    </main>
  );
}

function OrderForm() {
  const { token, account } = useAuth();
  const { showToast } = useToast();
  const basket = useBasket();
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState<string[] | null>(null);

  // One order request goes to each supplier (and currency) in the basket.
  const groups = new Map<string, { supplierName: string; currency: string; lines: BasketLine[] }>();
  for (const line of basket.lines) {
    const key = `${line.supplierId}|${line.currency}`;
    const group = groups.get(key) ?? { supplierName: line.supplierName, currency: line.currency, lines: [] };
    group.lines.push(line);
    groups.set(key, group);
  }

  // Delivery details are asked in order: where, then who to call. Each appears once the one before it is filled.
  const showAddress = city.trim().length > 1;
  const showPhone = showAddress;
  const ready = showPhone && phone.trim().length >= 6;

  const send = async () => {
    if (!token || !ready || busy) return;
    setBusy(true);
    setError("");
    const result = await FurnitureApi.createOrder(token, {
      items: basket.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      city: city.trim(),
      address: address.trim() || undefined,
      phone: phone.trim(),
      note: note.trim() || undefined,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    basket.clear();
    setSentTo(result.data.orders.map((o) => o.supplierName ?? "the supplier"));
    showToast("Order request sent.");
  };

  // Once the request is sent the basket is cleared, so the confirmation has to be checked first.
  if (!sentTo && basket.count === 0) return <Empty />;

  if (sentTo) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-8">
        <h1 className="text-2xl font-black text-slate-900">Order request sent</h1>
        <p className="mt-3 text-sm text-slate-600">{Array.from(new Set(sentTo)).join(", ")} will confirm it. You will get a notification.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/furniture" className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 transition-colors hover:border-[#2ec440]">
            Keep browsing
          </Link>
          <Link href="/design-requests?tab=orders" className="inline-flex min-h-11 items-center rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition-colors hover:bg-[#2ec440]">
            View my orders
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">Your order</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          {Array.from(groups.values()).map((group) => {
            const total = group.lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
            return (
              <section key={`${group.supplierName}|${group.currency}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-black text-slate-900">{group.supplierName}</h2>
                  <p className="text-sm font-bold text-slate-900">{formatPrice(total, group.currency)}</p>
                </div>
                <ul className="mt-3 divide-y divide-slate-100">
                  {group.lines.map((line) => (
                    <li key={line.productId} className="flex items-center gap-4 py-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {line.image ? <img src={line.image} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" /> : <div className="h-16 w-16 shrink-0 rounded-lg bg-slate-100" />}
                      <div className="min-w-0 flex-1">
                        <Link href={`/furniture/${line.productId}`} className="block truncate font-bold text-slate-900 hover:underline">
                          {line.name}
                        </Link>
                        <p className="text-sm text-slate-500">{formatPrice(line.price, line.currency)} each</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" aria-label={`Fewer ${line.name}`} onClick={() => (line.quantity > 1 ? basket.setQuantity(line.productId, line.quantity - 1) : basket.remove(line.productId))} className="h-8 w-8 rounded-lg border border-slate-200 font-bold text-slate-600 hover:border-slate-300">
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-slate-900">{line.quantity}</span>
                        <button type="button" aria-label={`More ${line.name}`} onClick={() => basket.setQuantity(line.productId, line.quantity + 1)} className="h-8 w-8 rounded-lg border border-slate-200 font-bold text-slate-600 hover:border-slate-300">
                          +
                        </button>
                      </div>
                      <button type="button" onClick={() => basket.remove(line.productId)} className="text-xs font-bold text-red-600 hover:text-red-800">
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <h2 className="font-black text-slate-900">Delivery</h2>
          <div className="mt-4 space-y-4">
            <label className={label}>
              City or area
              <input className={`${field} mt-1.5`} value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" autoFocus />
            </label>
            {showAddress && (
              <label className={label}>
                Street address <span className="font-normal text-slate-400">(optional)</span>
                <input className={`${field} mt-1.5`} value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" />
              </label>
            )}
            {showPhone && (
              <label className={label}>
                Phone number
                <input className={`${field} mt-1.5`} type="tel" value={phone} maxLength={20} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
              </label>
            )}
            {ready && (
              <label className={label}>
                Note to the supplier <span className="font-normal text-slate-400">(optional)</span>
                <textarea className={`${field} mt-1.5 min-h-20 resize-none`} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
              </label>
            )}
            {error && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            {ready && (
              <button type="button" disabled={busy} onClick={send} className="min-h-11 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440] disabled:opacity-60">
                {busy ? "Sending…" : `Send order request${groups.size > 1 ? `s (${groups.size})` : ""}`}
              </button>
            )}
            {account && <p className="text-xs text-slate-400">Ordering as {account.name}</p>}
          </div>
        </aside>
      </div>
    </main>
  );
}
