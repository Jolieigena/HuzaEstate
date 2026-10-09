"use client";

import { useState } from "react";
import { useBasket } from "@/lib/furniture/basket";
import CartDrawer from "./CartDrawer";

/** The cart icon for the site header, with how many items are in it. Opens the cart panel. */
export default function CartButton({ className = "" }: { className?: string }) {
  const cart = useBasket();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Open your cart, ${cart.count} ${cart.count === 1 ? "item" : "items"}`}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition-colors hover:border-[#2ec440] hover:text-[#219b31] ${className}`}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        {cart.count > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-[11px] font-bold text-white">{cart.count > 99 ? "99+" : cart.count}</span>}
      </button>
      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
