"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useBasket } from "@/lib/furniture/basket";
import { useSaved } from "@/lib/furniture/saved";
import CartDrawer from "./CartDrawer";

/** The row under the site header on every shop page: the shop, what was saved, past orders and the cart. */
export default function ShopNav() {
  const pathname = usePathname();
  const cart = useBasket();
  const saved = useSaved();
  const [cartOpen, setCartOpen] = useState(false);
  const items = [
    { href: "/shop", label: "Shop", count: 0, active: pathname === "/shop" || (/^\/shop\/[^/]+$/.test(pathname) && !["/shop/cart", "/shop/saved", "/shop/orders"].includes(pathname)) },
    { href: "/shop/saved", label: "Saved", count: saved.count, active: pathname === "/shop/saved" },
    { href: "/shop/orders", label: "My orders", count: 0, active: pathname === "/shop/orders" },
  ];
  return (
    <nav aria-label="Shop" className="border-b border-slate-100 bg-white">
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-8">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={`relative inline-flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-bold transition-colors ${item.active ? "text-slate-900 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-[#2ec440]" : "text-slate-500 hover:text-slate-900"}`}
          >
            {item.label}
            {item.count > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[11px] text-white">{item.count}</span>}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          aria-label={`Open your cart, ${cart.count} ${cart.count === 1 ? "item" : "items"}`}
          className={`ml-auto inline-flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-bold transition-colors ${pathname === "/shop/cart" ? "text-slate-900" : "text-slate-600 hover:text-slate-900"}`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Cart
          {cart.count > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[11px] text-white">{cart.count}</span>}
        </button>
      </div>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </nav>
  );
}
