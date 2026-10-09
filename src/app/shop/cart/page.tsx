"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { useBasket, type BasketLine } from "@/lib/furniture/basket";
import { useSaved } from "@/lib/furniture/saved";
import { formatPrice } from "@/lib/furniture/api";

export default function CartPage() {
  const { isLoggedIn } = useAuth();
  const { showToast } = useToast();
  const cart = useBasket();
  const saved = useSaved();
  // Grouped by supplier (and currency), since each gets its own order.
  const groups = new Map<string, { supplierName: string; currency: string; lines: BasketLine[] }>();
  for (const line of cart.lines) {
    const key = `${line.supplierId}|${line.currency}`;
    const group = groups.get(key) ?? { supplierName: line.supplierName, currency: line.currency, lines: [] };
    group.lines.push(line);
    groups.set(key, group);
  }
  const totals = new Map<string, number>();
  for (const line of cart.lines) totals.set(line.currency, (totals.get(line.currency) ?? 0) + line.price * line.quantity);

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

          <Link href={isLoggedIn ? "/shop/checkout" : `/login?redirect=${encodeURIComponent("/shop/checkout")}`} className="mt-5 flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
            {isLoggedIn ? "Checkout" : "Sign in to check out"}
          </Link>
        </aside>
      </div>
    </main>
  );
}
