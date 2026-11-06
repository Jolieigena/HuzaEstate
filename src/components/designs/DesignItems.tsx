"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDisplayCurrency } from "@/lib/currency/display";
import type { FurnitureItem } from "@/lib/designs/api";
import { FurnitureApi, type Product } from "@/lib/furniture/api";
import { useBasket } from "@/lib/furniture/basket";

/** What a design is made of, beside the picture: shop products can go straight into the cart, the rest are asked for as a quote. */
export default function DesignItems({
  items,
  onQuote,
}: {
  items: FurnitureItem[];
  onQuote: () => void;
}) {
  const money = useDisplayCurrency();
  const basket = useBasket();
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Record<string, Product | null>>({});
  const ids = Array.from(
    new Set(items.map((i) => i.productId).filter((v): v is string => !!v)),
  );
  const key = ids.join("|");

  useEffect(() => {
    let cancelled = false;
    ids.forEach((id) => {
      FurnitureApi.get(id).then((result) => {
        if (!cancelled)
          setProducts((prev) => ({
            ...prev,
            [id]: result.ok ? result.data.product : null,
          }));
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (items.length === 0) return null;

  return (
    <section className="mt-4 rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-sm font-bold text-slate-800">
          Furniture list{" "}
          <span className="font-semibold text-slate-500">({items.length})</span>
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div className="border-t border-slate-100 p-4">
          <ul className="divide-y divide-slate-100">
            {items.map((item, index) => {
              const product = item.productId
                ? products[item.productId]
                : undefined;
              const buyable =
                !!product &&
                product.stock !== "out_of_stock" &&
                !product.supplier?.paused;
              const inCart = product
                ? (basket.lines.find((l) => l.productId === product.id)
                    ?.quantity ?? 0)
                : 0;
              return (
                <li
                  key={index}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  {product?.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.images[0]}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <span
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400"
                      aria-hidden="true"
                    >
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                        />
                      </svg>
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    {product ? (
                      <Link
                        href={`/shop/${product.id}`}
                        className="block truncate text-sm font-bold text-slate-900 hover:text-[#219b31]"
                      >
                        {product.name}
                      </Link>
                    ) : (
                      <p className="truncate text-sm font-bold text-slate-900">
                        {item.name}
                      </p>
                    )}
                    <p className="truncate text-xs text-slate-500">
                      {[
                        item.notes,
                        item.quantity > 1 ? `× ${item.quantity}` : "",
                      ]
                        .filter(Boolean)
                        .join(" · ") || (product ? product.category : "")}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    {product ? (
                      <>
                        <p className="text-sm font-black text-slate-900">
                          {money.format(product.price, product.currency)}
                        </p>
                        {buyable ? (
                          <button
                            type="button"
                            onClick={() =>
                              basket.add(product, item.quantity || 1)
                            }
                            className="mt-1 min-h-9 rounded-lg bg-slate-900 px-3 text-xs font-bold text-white transition-colors hover:bg-[#2ec440]"
                          >
                            {inCart > 0 ? `In cart (${inCart})` : "Add to cart"}
                          </button>
                        ) : (
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Unavailable
                          </p>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={onQuote}
                        className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 transition-colors hover:border-[#2ec440] hover:text-[#219b31]"
                      >
                        Request a quote
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {items.some(
            (i) =>
              i.productId &&
              basket.lines.some((l) => l.productId === i.productId),
          ) && (
            <Link
              href="/shop/cart"
              className="mt-3 block rounded-xl bg-slate-50 px-4 py-2.5 text-center text-sm font-bold text-slate-800 hover:text-[#219b31]"
            >
              View cart
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
