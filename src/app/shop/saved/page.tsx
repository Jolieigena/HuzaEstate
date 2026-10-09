"use client";

import Link from "next/link";
import { useToast } from "@/lib/toast-context";
import { useBasket } from "@/lib/furniture/basket";
import { useSaved } from "@/lib/furniture/saved";
import { STOCK_LABELS, formatPrice } from "@/lib/furniture/api";

export default function SavedPage() {
  const saved = useSaved();
  const cart = useBasket();
  const { showToast } = useToast();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">Saved</h1>
      {saved.items.length === 0 ? (
        <div className="mt-10 rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
          <p className="font-bold text-slate-500">Nothing saved yet</p>
          <Link href="/shop" className="mt-3 inline-block text-sm font-bold text-[#219b31] hover:underline">
            Browse the shop
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {saved.items.map((item) => {
            const out = item.stock === "out_of_stock";
            return (
              <li key={item.productId} className="flex flex-wrap items-center gap-4 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {item.image ? <img src={item.image} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" /> : <div className="h-20 w-20 shrink-0 rounded-xl bg-slate-100" />}
                <div className="min-w-0 flex-1">
                  <Link href={`/shop/${item.productId}`} className="block truncate font-black text-slate-900 hover:underline">
                    {item.name}
                  </Link>
                  <p className="text-sm text-slate-500">{item.supplierName}</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {formatPrice(item.price, item.currency)} <span className={`font-semibold ${out ? "text-red-600" : "text-slate-400"}`}>· {STOCK_LABELS[item.stock]}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={out}
                    onClick={() => {
                      cart.addLine({ productId: item.productId, name: item.name, image: item.image, price: item.price, currency: item.currency, supplierId: item.supplierId, supplierName: item.supplierName, quantity: 1 });
                      saved.remove(item.productId);
                      showToast(`${item.name} moved to your cart.`);
                    }}
                    className="min-h-10 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition-colors hover:bg-[#2ec440] disabled:opacity-40"
                  >
                    Move to cart
                  </button>
                  <button type="button" onClick={() => saved.remove(item.productId)} className="min-h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition-colors hover:border-red-300 hover:text-red-600">
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
