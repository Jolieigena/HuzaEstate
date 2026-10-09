"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import BackLink from "@/components/BackLink";
import Select from "@/components/shared/Select";
import ProductCard, { SaveButton } from "@/components/shop/ProductCard";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { useBasket } from "@/lib/furniture/basket";
import { FurnitureApi, STOCK_LABELS, formatPrice, type Product } from "@/lib/furniture/api";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { token, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const cart = useBasket();
  const [state, setState] = useState<{ product?: Product; error?: string } | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [active, setActive] = useState(0);
  const [quantity, setQuantity] = useState("1");

  useEffect(() => {
    if (!isAuthReady) return;
    let cancelled = false;
    FurnitureApi.get(id, token).then((result) => {
      if (!cancelled) setState(result.ok ? { product: result.data.product } : { error: result.error });
    });
    return () => {
      cancelled = true;
    };
  }, [id, token, isAuthReady]);

  // More to look at: the same category first, topped up with the same supplier's other products.
  const product = state?.product;
  const category = product?.category;
  const supplierId = product?.supplier?.accountId;
  useEffect(() => {
    if (!category) return;
    let cancelled = false;
    Promise.all([FurnitureApi.list({ category, limit: 8 }), supplierId ? FurnitureApi.list({ supplierId, limit: 8 }) : Promise.resolve(null)]).then(([byCategory, bySupplier]) => {
      if (cancelled) return;
      const seen = new Set<string>([id]);
      const picks: Product[] = [];
      for (const list of [byCategory, bySupplier]) {
        if (!list?.ok) continue;
        for (const candidate of list.data.products) {
          if (!seen.has(candidate.id) && picks.length < 4) {
            seen.add(candidate.id);
            picks.push(candidate);
          }
        }
      }
      setRelated(picks);
    });
    return () => {
      cancelled = true;
    };
  }, [id, category, supplierId]);

  if (!state) return <p className="py-24 text-center text-sm font-semibold text-slate-400">Loading…</p>;
  if (!product) return <p className="py-24 text-center text-sm font-semibold text-slate-500">{state.error || "Product not found."}</p>;

  const supplier = product.supplier;
  const orderable = product.status === "published" && product.stock !== "out_of_stock";
  const inCart = cart.lines.find((l) => l.productId === product.id)?.quantity ?? 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <BackLink fallbackHref="/shop" />
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {product.images[active] ? <img src={product.images[active]} alt={product.name} className="h-[420px] w-full rounded-2xl object-cover" /> : <div className="h-[420px] w-full rounded-2xl bg-slate-100" />}
            <SaveButton product={product} className="absolute right-4 top-4 !h-11 !w-11" />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-3">
              {product.images.map((url, index) => (
                <button key={url} type="button" onClick={() => setActive(index)} aria-label={`Show photo ${index + 1}`} className={`overflow-hidden rounded-lg border-2 ${index === active ? "border-[#2ec440]" : "border-transparent"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-20 w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{product.category}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{product.name}</h1>
          <p className="mt-4 text-2xl font-black text-slate-900">{formatPrice(product.price, product.currency)}</p>
          <p className={`mt-2 text-sm font-bold ${product.stock === "out_of_stock" ? "text-red-600" : "text-slate-600"}`}>
            {STOCK_LABELS[product.stock]}
            {product.stock === "made_to_order" && product.leadTimeDays ? ` · ready in about ${product.leadTimeDays} days` : ""}
          </p>
          {product.status !== "published" && <p className="mt-2 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">Draft, only you can see this</p>}
          {product.description && <p className="mt-6 whitespace-pre-line text-sm leading-7 text-slate-600">{product.description}</p>}

          {orderable && (
            <div className="mt-6 space-y-3">
              <div className="flex items-end gap-3">
                <label className="block w-28 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Quantity
                  <Select className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm normal-case tracking-normal text-slate-800" value={quantity} aria-label="Quantity" onChange={(e) => setQuantity(e.target.value)}>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={String(n)}>
                        {n}
                      </option>
                    ))}
                  </Select>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    cart.add(product, Number(quantity));
                    showToast(`${product.name} added to your cart.`);
                  }}
                  className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition-colors hover:border-[#2ec440] hover:text-[#219b31]"
                >
                  Add to cart
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  cart.add(product, Number(quantity));
                  router.push("/shop/cart");
                }}
                className="min-h-11 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]"
              >
                Buy now
              </button>
              {inCart > 0 && (
                <p className="text-sm font-semibold text-slate-500">
                  {inCart} in your cart.{" "}
                  <Link href="/shop/cart" className="font-bold text-[#219b31] hover:underline">
                    View cart
                  </Link>
                </p>
              )}
            </div>
          )}

          {supplier && (
            <div className="mt-8 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
              {supplier.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={supplier.logoUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 font-black text-slate-500">{supplier.companyName.charAt(0)}</span>
              )}
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-900">{supplier.companyName}</p>
                <p className="truncate text-sm text-slate-500">{[supplier.city, supplier.country].filter(Boolean).join(", ")}</p>
              </div>
              <Link href={`/shop?supplier=${supplier.accountId}`} className="ml-auto shrink-0 text-sm font-bold text-[#219b31] hover:underline">
                More from them
              </Link>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-black text-slate-900">You might also like</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
