"use client";

import Link from "next/link";
import { useToast } from "@/lib/toast-context";
import { useBasket } from "@/lib/furniture/basket";
import { useSaved } from "@/lib/furniture/saved";
import { STOCK_LABELS, formatPrice, type Product } from "@/lib/furniture/api";

/** The heart that saves a product for later. */
export function SaveButton({ product, className = "" }: { product: Product; className?: string }) {
  const saved = useSaved();
  const { showToast } = useToast();
  const isSaved = saved.has(product.id);
  return (
    <button
      type="button"
      aria-pressed={isSaved}
      aria-label={isSaved ? `Remove ${product.name} from saved` : `Save ${product.name} for later`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        showToast(saved.toggle(product) ? "Saved for later." : "Removed from saved.");
      }}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow transition-colors hover:bg-white ${className}`}
    >
      <svg className={`h-5 w-5 ${isSaved ? "fill-red-500 text-red-500" : "fill-none text-slate-600"}`} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  );
}

/** A product in a grid: photo, price, supplier, a heart, and Add to cart. */
export default function ProductCard({ product }: { product: Product }) {
  const cart = useBasket();
  const { showToast } = useToast();
  const inCart = cart.lines.find((l) => l.productId === product.id)?.quantity ?? 0;
  const out = product.stock === "out_of_stock";

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/shop/${product.id}`} className="block">
        <div className="relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {product.images[0] ? <img src={product.images[0]} alt={product.name} className={`h-52 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] ${out ? "opacity-60" : ""}`} /> : <div className="h-52 w-full bg-slate-100" />}
          <SaveButton product={product} className="absolute right-3 top-3" />
          {product.stock !== "in_stock" && (
            <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-slate-800 shadow">
              {STOCK_LABELS[product.stock]}
              {product.stock === "made_to_order" && product.leadTimeDays ? ` · ${product.leadTimeDays} days` : ""}
            </span>
          )}
        </div>
        <div className="px-4 pt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{product.category}</p>
          <h2 className="mt-1 font-black text-slate-900">{product.name}</h2>
        </div>
      </Link>
      <div className="mt-auto flex items-center justify-between gap-3 p-4 pt-3">
        <div className="min-w-0">
          <p className="font-bold text-slate-900">{formatPrice(product.price, product.currency)}</p>
          {product.supplier && <p className="truncate text-xs text-slate-400">{product.supplier.companyName}</p>}
        </div>
        <button
          type="button"
          disabled={out}
          onClick={() => {
            cart.add(product);
            showToast(`${product.name} added to your cart.`);
          }}
          className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${inCart > 0 ? "border-[#2ec440] bg-[#2ec440]/10 text-[#219b31]" : "border-slate-200 text-slate-700 hover:border-[#2ec440] hover:text-[#219b31]"}`}
        >
          {inCart > 0 ? `In cart (${inCart})` : "Add to cart"}
        </button>
      </div>
    </div>
  );
}
