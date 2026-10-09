"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { useBasket, type BasketLine } from "@/lib/furniture/basket";
import { useSaved } from "@/lib/furniture/saved";
import PhoneInput, { cleanPhone, phoneProblem } from "@/components/shared/PhoneInput";
import { FurnitureApi, formatPrice } from "@/lib/furniture/api";

const field = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-[#2ec440] focus:ring-2 focus:ring-[#2ec440]/15";
const label = "block text-sm font-bold text-slate-700";

export default function CartPage() {
  const { token, isLoggedIn, account } = useAuth();
  const { showToast } = useToast();
  const cart = useBasket();
  const saved = useSaved();
  const [city, setCity] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<string[] | null>(null);

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
        setLocationError("Could not get your location. Allow location access, or describe the place instead.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
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
    setPlaced(Array.from(new Set(result.data.orders.map((o) => o.supplierName ?? "the supplier"))));
    showToast("Order placed.");
  };

  if (placed) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-8">
        <h1 className="text-2xl font-black text-slate-900">Order placed</h1>
        <p className="mt-3 text-sm text-slate-600">{placed.join(", ")} will confirm it. You will get a notification, and can pay once it is confirmed.</p>
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
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/shop" className="inline-flex min-h-11 items-center rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition-colors hover:bg-[#2ec440]">
            Continue shopping
          </Link>
          {saved.count > 0 && (
            <Link href="/shop/saved" className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 transition-colors hover:border-[#2ec440]">
              View saved ({saved.count})
            </Link>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Your cart</h1>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Remove everything from your cart?")) cart.clear();
          }}
          className="text-sm font-bold text-slate-500 underline hover:text-red-600"
        >
          Clear cart
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {Array.from(groups.values()).map((group) => {
            const subtotal = group.lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
            return (
              <section key={`${group.supplierName}|${group.currency}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-black text-slate-900">{group.supplierName}</h2>
                  <p className="text-sm font-bold text-slate-900">{formatPrice(subtotal, group.currency)}</p>
                </div>
                <ul className="mt-3 divide-y divide-slate-100">
                  {group.lines.map((line) => (
                    <li key={line.productId} className="flex flex-wrap items-center gap-4 py-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {line.image ? <img src={line.image} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" /> : <div className="h-20 w-20 shrink-0 rounded-xl bg-slate-100" />}
                      <div className="min-w-0 flex-1">
                        <Link href={`/shop/${line.productId}`} className="block truncate font-bold text-slate-900 hover:underline">
                          {line.name}
                        </Link>
                        <p className="text-sm text-slate-500">{formatPrice(line.price, line.currency)} each</p>
                        <div className="mt-2 flex items-center gap-3 text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => {
                              saved.saveItem({ productId: line.productId, name: line.name, image: line.image, price: line.price, currency: line.currency, stock: "in_stock", supplierId: line.supplierId, supplierName: line.supplierName });
                              cart.remove(line.productId);
                              showToast(`${line.name} saved for later.`);
                            }}
                            className="text-slate-500 hover:text-slate-900"
                          >
                            Save for later
                          </button>
                          <button type="button" onClick={() => cart.remove(line.productId)} className="text-red-600 hover:text-red-800">
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" aria-label={`Fewer ${line.name}`} onClick={() => (line.quantity > 1 ? cart.setQuantity(line.productId, line.quantity - 1) : cart.remove(line.productId))} className="h-8 w-8 rounded-lg border border-slate-200 font-bold text-slate-600 hover:border-slate-300">
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-slate-900">{line.quantity}</span>
                        <button type="button" aria-label={`More ${line.name}`} onClick={() => cart.setQuantity(line.productId, line.quantity + 1)} className="h-8 w-8 rounded-lg border border-slate-200 font-bold text-slate-600 hover:border-slate-300">
                          +
                        </button>
                      </div>
                      <p className="w-24 shrink-0 text-right text-sm font-bold text-slate-900">{formatPrice(line.price * line.quantity, line.currency)}</p>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
          <Link href="/shop" className="inline-block text-sm font-bold text-[#219b31] hover:underline">
            ← Continue shopping
          </Link>
        </div>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <h2 className="font-black text-slate-900">Summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Items</dt>
              <dd className="font-bold text-slate-900">{cart.count}</dd>
            </div>
            {Array.from(totals, ([currency, total]) => (
              <div key={currency} className="flex justify-between border-t border-slate-100 pt-2">
                <dt className="font-bold text-slate-900">Total</dt>
                <dd className="text-lg font-black text-slate-900">{formatPrice(total, currency)}</dd>
              </div>
            ))}
          </dl>

          {!isLoggedIn ? (
            <Link href={`/login?redirect=${encodeURIComponent("/shop/cart")}`} className="mt-5 flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
              Sign in to check out
            </Link>
          ) : (
            <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
              <h3 className="font-black text-slate-900">Delivery</h3>
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
                  <div className="mt-1.5"><PhoneInput value={phone} onChange={setPhone} required /></div>
                </label>
              )}
              {error && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
              {ready && (
                <button type="button" disabled={busy} onClick={placeOrder} className="min-h-11 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440] disabled:opacity-60">
                  {busy ? "Placing order…" : groups.size > 1 ? `Place ${groups.size} orders` : "Place order"}
                </button>
              )}
              {account && <p className="text-xs text-slate-400">Ordering as {account.name}</p>}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
