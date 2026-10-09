"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBasket } from "@/lib/furniture/basket";
import { useSaved } from "@/lib/furniture/saved";

/** The row under the site header on every shop page: the shop, what was saved, past orders and the cart. */
export default function ShopNav() {
  const pathname = usePathname();
  const cart = useBasket();
  const saved = useSaved();
  const items = [
    { href: "/shop", label: "Shop", count: 0, active: pathname === "/shop" || (/^\/shop\/[^/]+$/.test(pathname) && !["/shop/cart", "/shop/saved", "/shop/orders"].includes(pathname)) },
    { href: "/shop/saved", label: "Saved", count: saved.count, active: pathname === "/shop/saved" },
    { href: "/shop/orders", label: "My orders", count: 0, active: pathname === "/shop/orders" },
    { href: "/shop/cart", label: "Cart", count: cart.count, red: true, active: pathname === "/shop/cart" },
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
            {item.count > 0 && <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] text-white ${"red" in item ? "bg-red-600" : "bg-slate-900"}`}>{item.count}</span>}
          </Link>
        ))}
      </div>
    </nav>
  );
}
