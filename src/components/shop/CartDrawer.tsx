"use client";

import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useBasket } from "@/lib/furniture/basket";
import { formatPrice } from "@/lib/furniture/api";

const noop = () => () => {};
const useIsClient = () => useSyncExternalStore(noop, () => true, () => false);

/** The cart as a panel that slides in from the right: change quantities, remove items, and go to checkout. */
export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const cart = useBasket();
  const isClient = useIsClient();
  const panel = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    const timer = setTimeout(() => panel.current?.focus(), 0);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      clearTimeout(timer);
    };
  }, [open]);

  if (!open || !isClient) return null;

  // One subtotal per currency: prices in different currencies are never added together.
  const totals = new Map<string, number>();
  for (const line of cart.lines) totals.set(line.currency, (totals.get(line.currency) ?? 0) + line.price * line.quantity);

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" aria-hidden="true" onMouseDown={onClose} />
      <div ref={panel} role="dialog" aria-modal="true" aria-label="Your cart" tabIndex={-1} className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl focus:outline-none">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-black text-slate-900">
            Your cart <span className="font-semibold text-slate-400">({cart.count})</span>
          </h2>
          <button type="button" onClick={onClose} aria-label="Close cart" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {cart.lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="font-bold text-slate-500">Your cart is empty</p>
            <Link href="/shop" onClick={onClose} className="inline-flex min-h-11 items-center rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition-colors hover:bg-[#2ec440]">
              Continue shopping
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto px-5">
              {cart.lines.map((line) => (
                <li key={line.productId} className="flex gap-3 py-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {line.image ? <img src={line.image} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" /> : <div className="h-20 w-20 shrink-0 rounded-xl bg-slate-100" />}
                  <div className="min-w-0 flex-1">
                    <Link href={`/shop/${line.productId}`} onClick={onClose} className="block truncate text-sm font-bold text-slate-900 hover:underline">
                      {line.name}
                    </Link>
                    <p className="truncate text-xs text-slate-400">{line.supplierName}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{formatPrice(line.price * line.quantity, line.currency)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button type="button" aria-label={`Fewer ${line.name}`} onClick={() => (line.quantity > 1 ? cart.setQuantity(line.productId, line.quantity - 1) : cart.remove(line.productId))} className="h-7 w-7 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:border-slate-300">
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-slate-900">{line.quantity}</span>
                      <button type="button" aria-label={`More ${line.name}`} onClick={() => cart.setQuantity(line.productId, line.quantity + 1)} className="h-7 w-7 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:border-slate-300">
                        +
                      </button>
                      <button type="button" onClick={() => cart.remove(line.productId)} className="ml-auto text-xs font-bold text-red-600 hover:text-red-800">
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-slate-100 px-5 py-4">
              {Array.from(totals, ([currency, total]) => (
                <div key={currency} className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-500">Subtotal</span>
                  <span className="text-lg font-black text-slate-900">{formatPrice(total, currency)}</span>
                </div>
              ))}
              <Link href="/shop/checkout" onClick={onClose} className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
                Checkout
              </Link>
              <Link href="/shop/cart" onClick={onClose} className="mt-2 flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition-colors hover:border-[#2ec440]">
                View cart
              </Link>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
