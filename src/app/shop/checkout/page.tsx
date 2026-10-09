"use client";

import Link from "next/link";
import { useState } from "react";
import RequireAuth from "@/components/shared/RequireAuth";
import PhoneInput, { cleanPhone, phoneProblem } from "@/components/shared/PhoneInput";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { useBasket, type BasketLine } from "@/lib/furniture/basket";
import { FurnitureApi, formatPrice, type Order } from "@/lib/furniture/api";

const field = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-[#2ec440] focus:ring-2 focus:ring-[#2ec440]/15";
const label = "block text-sm font-bold text-slate-700";

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <Checkout />
    </RequireAuth>
  );
}

function Checkout() {
  const { token, account } = useAuth();
  const { showToast } = useToast();
  const cart = useBasket();
  const [city, setCity] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<{ suppliers: string[]; payable: Order[] } | null>(null);
  const [payingId, setPayingId] = useState("");

  // One order goes to each supplier (and currency) in the cart.
  const groups = new Map<string, { supplierName: string; currency: string; lines: BasketLine[] }>();
  for (const line of cart.lines) {
    const key = `${line.supplierId}|${line.currency}`;
    const group = groups.get(key) ?? { supplierName: line.supplierName, currency: line.currency, lines: [] };
    group.lines.push(line);
    groups.set(key, group);
  }
  const totals = new Map<string, number>();
  for (const line of cart.lines) totals.set(line.currency, (totals.get(line.currency) ?? 0) + line.price * line.quantity);

  // Delivery details are asked in order: where, then who to call. Each appears once the one before it is filled.
  const showMore = city.trim().length > 1;
  const ready = showMore && phoneProblem(phone) === null && cleanPhone(phone) !== "";

  const shareLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Your browser cannot share a location.");
      return;
    }
    setLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocationError("Could not get your location. Allow location access and try again.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const pay = async (id: string) => {
    if (!token) return;
    setPayingId(id);
    const result = await FurnitureApi.payOrder(token, id);
    if (result.ok) {
      window.location.href = result.data.paymentLinkUrl;
      return;
    }
    setPayingId("");
    setError(result.error);
  };

  const placeOrder = async () => {
    if (!token || !ready || busy) return;
    setBusy(true);
    setError("");
    const result = await FurnitureApi.createOrder(token, {
      items: cart.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      city: city.trim(),
      location: location ?? undefined,
      phone: cleanPhone(phone),
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    cart.clear();
    const orders = result.data.orders;
    setPlaced({ suppliers: Array.from(new Set(orders.map((o) => o.supplierName ?? "the supplier"))), payable: orders.filter((o) => o.payable) });
    showToast("Order placed.");
    // A single order goes straight to payment.
    if (orders.length === 1 && orders[0].payable) await pay(orders[0].id);
  };

  if (placed) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-8">
        <h1 className="text-2xl font-black text-slate-900">Order placed</h1>
        <p className="mt-3 text-sm text-slate-600">{placed.suppliers.join(", ")} will confirm it. You will get a notification.</p>
        {error && <p className="mx-auto mt-4 max-w-md rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        {placed.payable.length > 0 && (
          <div className="mx-auto mt-6 max-w-md space-y-2">
            {placed.payable.map((order) => (
              <button key={order.id} type="button" disabled={!!payingId} onClick={() => pay(order.id)} className="min-h-12 w-full rounded-xl bg-[#2ec440] px-4 py-3 text-sm font-black text-white shadow-lg transition-colors hover:bg-[#219b31] disabled:opacity-60">
                {payingId === order.id ? "Opening payment…" : `Pay ${formatPrice(order.total, order.currency)} to ${order.supplierName ?? "the supplier"}`}
              </button>
            ))}
          </div>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/shop" className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 transition-colors hover:border-[#2ec440]">
            Keep shopping
          </Link>
          <Link href="/shop/orders" className="inline-flex min-h-11 items-center rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition-colors hover:bg-[#2ec440]">
            View my orders
          </Link>
        </div>
      </main>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-8">
        <h1 className="text-2xl font-black text-slate-900">Your cart is empty</h1>
        <div className="mt-6 flex justify-center">
          <Link href="/shop" className="inline-flex min-h-11 items-center rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition-colors hover:bg-[#2ec440]">
            Continue shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Secure Checkout</h1>
          <div className="mt-8 space-y-5">
            <label className={label}>
              City
              <input className={`${field} mt-1.5`} value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
            </label>
            {showMore && (
              <div>
                {location ? (
                  <p className="flex items-center justify-between gap-3 rounded-xl border border-[#2ec440]/30 bg-[#2ec440]/5 px-3.5 py-2.5 text-sm font-bold text-slate-800">
                    Location shared
                    <button type="button" onClick={() => setLocation(null)} className="text-xs font-bold text-slate-500 underline hover:text-red-600">
                      Remove
                    </button>
                  </p>
                ) : (
                  <button type="button" disabled={locating} onClick={shareLocation} className="min-h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition-colors hover:border-[#2ec440] disabled:opacity-60">
                    {locating ? "Finding you…" : "Share my location"}
                  </button>
                )}
                {locationError && <p className="mt-2 text-sm text-red-600">{locationError}</p>}
              </div>
            )}
            {showMore && (
              <label className={label}>
                Phone number
                <div className="mt-1.5">
                  <PhoneInput value={phone} onChange={setPhone} required />
                </div>
              </label>
            )}
          </div>
          {error && <p className="mt-5 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <button type="button" disabled={!ready || busy} onClick={placeOrder} className="mt-6 min-h-12 w-full rounded-xl bg-[#2ec440] px-4 py-3 text-sm font-black text-white shadow-lg transition-colors hover:bg-[#219b31] disabled:opacity-50">
            {busy ? "Please wait…" : groups.size > 1 ? `Place ${groups.size} orders` : "Place order and pay"}
          </button>
          <Link href="/shop/cart" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
            <span aria-hidden>←</span> Back to cart
          </Link>
          {account && <p className="mt-4 text-xs text-slate-400">Ordering as {account.name}</p>}
        </section>

        <aside className="h-fit rounded-3xl bg-slate-900 p-6 text-white shadow-xl sm:p-8 lg:sticky lg:top-24">
          <h2 className="text-xl font-black">Order Summary</h2>
          <div className="mt-6 space-y-5">
            {Array.from(groups.values()).map((group) => (
              <div key={`${group.supplierName}|${group.currency}`}>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{group.supplierName}</p>
                <ul className="mt-2 divide-y divide-white/10">
                  {group.lines.map((line) => (
                    <li key={line.productId} className="flex items-center justify-between gap-4 py-3 text-sm">
                      <span className="min-w-0 truncate text-slate-300">
                        {line.name} <span className="text-slate-500">× {line.quantity}</span>
                      </span>
                      <span className="shrink-0 font-bold">{formatPrice(line.price * line.quantity, line.currency)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {Array.from(totals, ([currency, total]) => (
            <div key={currency} className="mt-4 flex items-baseline justify-between border-t border-white/10 pt-5">
              <span className="font-black">Total due</span>
              <span className="text-2xl font-black">{formatPrice(total, currency)}</span>
            </div>
          ))}
        </aside>
      </div>
    </main>
  );
}
