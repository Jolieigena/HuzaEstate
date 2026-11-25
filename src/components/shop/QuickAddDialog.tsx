"use client";

import { useId, useState } from "react";
import Link from "next/link";
import Dialog from "@/components/Dialog";
import Select from "@/components/shared/Select";
import QuantityInput from "@/components/shop/QuantityInput";
import { useBasket } from "@/lib/furniture/basket";
import { useDisplayCurrency } from "@/lib/currency/display";
import { useToast } from "@/lib/toast-context";
import type { Product } from "@/lib/furniture/api";

/** Pick the size, colour or type and the quantity of a product, and add it to the cart without leaving the shop. */
export default function QuickAddDialog({ product, open, onClose }: { product: Product; open: boolean; onClose: () => void }) {
  const titleId = useId();
  const money = useDisplayCurrency();
  const cart = useBasket();
  const { showToast } = useToast();
  const options = product.options ?? [];
  const variants = product.variants ?? [];
  const [picked, setPicked] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  // What is shown: the buyer's picks once all are made and valid, otherwise the first combination on sale.
  const valid = picked.length === options.length && picked.every((value, i) => options[i].values.includes(value));
  const shown = valid ? picked : (variants.find((v) => v.quantity !== 0) ?? variants[0])?.values ?? [];
  const variant = variants.find((v) => v.values.every((value, i) => value === shown[i]));
  const soldOut = variant?.quantity === 0;
  const left = variant?.quantity;
  const details = options.map((o, i) => o.details?.find((d) => d.value === shown[i])).filter((d): d is NonNullable<typeof d> => Boolean(d));
  const picture = details.find((d) => d.image)?.image ?? product.images[0];
  const outOfStock = product.stock === "out_of_stock";

  const add = () => {
    if (!variant || soldOut || outOfStock) return;
    cart.add(product, quantity, variant);
    showToast(`${product.name} (${variant.label}) added to your cart.`);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} panelClassName="max-w-lg">
      <div className="p-6 sm:p-7">
        <div className="flex gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {picture ? <img src={picture} alt="" className="h-24 w-24 shrink-0 rounded-xl object-cover" /> : <div className="h-24 w-24 shrink-0 rounded-xl bg-slate-100" />}
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{product.category}</p>
            <h2 id={titleId} className="mt-1 text-lg font-black leading-snug text-slate-900">
              {product.name}
            </h2>
            <p className="mt-1 text-xl font-black text-slate-900">{variant ? money.format(variant.price, product.currency) : money.format(product.price, product.currency)}</p>
            {soldOut && <p className="text-sm font-bold text-red-600">Sold out</p>}
            {!soldOut && left !== undefined && left <= 5 && <p className="text-xs font-bold text-amber-600">Only {left} left</p>}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {options.map((option, index) => (
            <label key={option.name} className="block text-xs font-bold uppercase tracking-wide text-slate-500">
              {option.name}
              <Select
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm normal-case tracking-normal text-slate-800"
                value={shown[index]}
                aria-label={option.name}
                onChange={(e) => {
                  const next = [...shown];
                  next[index] = e.target.value;
                  setPicked(next);
                  setQuantity(1);
                }}
              >
                {option.values.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            </label>
          ))}
        </div>
        {!variant && <p className="mt-3 text-sm font-bold text-red-600">This combination is not available.</p>}
        {details.filter((d) => d.description).map((d) => (
          <p key={d.value} className="mt-3 text-sm leading-6 text-slate-700">
            <span className="font-bold">{d.value}: </span>
            {d.description}
          </p>
        ))}

        <div className="mt-5 flex items-center gap-3">
          <QuantityInput value={quantity} onChange={setQuantity} max={left !== undefined ? Math.max(left, 1) : 9999} />
          <button type="button" disabled={!variant || soldOut || outOfStock} onClick={add} className="min-h-11 flex-1 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition-colors hover:bg-[#2ec440] disabled:opacity-40">
            Add to cart
          </button>
        </div>
        <Link href={`/shop/${product.id}`} className="mt-4 inline-block text-sm font-bold text-[#219b31] hover:underline">
          See the full product page
        </Link>
      </div>
    </Dialog>
  );
}
