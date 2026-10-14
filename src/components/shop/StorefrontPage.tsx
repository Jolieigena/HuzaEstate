"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BackLink from "@/components/BackLink";
import ProductCard from "@/components/shop/ProductCard";
import { RatingSummary, StarRow, VerifiedBadge } from "@/components/shop/SupplierBadges";
import { FurnitureApi, formatPrice, type Product, type Review, type Storefront } from "@/lib/furniture/api";

const date = (value: string) => new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** A supplier's public shop: who they are, how buyers rate them, and everything they sell. */
export default function StorefrontPage({ supplierId }: { supplierId: string }) {
  const [store, setStore] = useState<Storefront | null>(null);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[] | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [reviewPage, setReviewPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    FurnitureApi.storefront(supplierId).then((result) => {
      if (cancelled) return;
      if (result.ok) setStore(result.data.supplier);
      else setError(result.error);
    });
    // A paused shop is left out of the catalogue, so its products are not listed here either.
    FurnitureApi.list({ supplierId, limit: 60 }).then((result) => {
      if (!cancelled) setProducts(result.ok ? result.data.products : []);
    });
    FurnitureApi.reviews(supplierId, 1).then((result) => {
      if (cancelled || !result.ok) return;
      setReviews(result.data.reviews);
      setReviewTotal(result.data.total);
    });
    return () => {
      cancelled = true;
    };
  }, [supplierId]);

  async function moreReviews() {
    setLoadingMore(true);
    const next = reviewPage + 1;
    const result = await FurnitureApi.reviews(supplierId, next);
    setLoadingMore(false);
    if (result.ok) {
      setReviews((prev) => [...prev, ...result.data.reviews]);
      setReviewPage(next);
    }
  }

  if (error) return <p className="py-24 text-center text-sm font-semibold text-slate-500">{error}</p>;
  if (!store) return <p className="py-24 text-center text-sm font-semibold text-slate-400">Loading…</p>;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <BackLink fallbackHref="/shop" />

      <header className="mt-6 flex flex-wrap items-start gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {store.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.logoUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-2xl font-black text-slate-500">{store.companyName.charAt(0)}</span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">{store.companyName}</h1>
            {store.verified && <VerifiedBadge />}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            {[store.city, store.country].filter(Boolean).length > 0 && <span>{[store.city, store.country].filter(Boolean).join(", ")}</span>}
            {store.memberSince && <span>On HuzaEstate since {new Date(store.memberSince).getFullYear()}</span>}
            <RatingSummary rating={store.rating} />
          </div>
          {store.categories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {store.categories.map((c) => (
                <span key={c} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {c}
                </span>
              ))}
            </div>
          )}
          <p className="mt-3 text-sm text-slate-500">
            {store.delivery.fee > 0 && store.delivery.currency
              ? `Delivery ${formatPrice(store.delivery.fee, store.delivery.currency)} per order${store.delivery.freeOver ? `, free above ${formatPrice(store.delivery.freeOver, store.delivery.currency)}` : ""}`
              : "Free delivery"}
          </p>
        </div>
      </header>

      {store.paused && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">This shop is not taking orders right now.</p>}

      {store.bio && (
        <section className="mt-8">
          <h2 className="text-lg font-black text-slate-900">About</h2>
          <p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-7 text-slate-600">{store.bio}</p>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-black text-slate-900">
          Products <span className="text-slate-400">({store.paused ? 0 : store.productCount})</span>
        </h2>
        {products === null ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading…</p>
        ) : products.length === 0 ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-500">Nothing to order from this shop right now.</p>
        ) : (
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-black text-slate-900">
          Reviews <span className="text-slate-400">({reviewTotal})</span>
        </h2>
        {reviews.length === 0 ? (
          <p className="mt-4 text-sm font-semibold text-slate-500">No reviews yet.</p>
        ) : (
          <ul className="mt-5 space-y-4">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <StarRow value={review.rating} />
                    <span className="text-sm font-bold text-slate-900">{review.clientName}</span>
                  </div>
                  <span className="text-xs text-slate-400">{date(review.createdAt)}</span>
                </div>
                {review.items.length > 0 && <p className="mt-1 text-xs text-slate-400">{review.items.slice(0, 3).join(", ")}</p>}
                {review.comment && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{review.comment}</p>}
                {review.reply && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-bold text-slate-500">Reply from {store.companyName}</p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">{review.reply}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {reviews.length < reviewTotal && (
          <button type="button" disabled={loadingMore} onClick={moreReviews} className="mt-5 min-h-11 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:border-[#2ec440] disabled:opacity-50">
            {loadingMore ? "Loading…" : "Show more"}
          </button>
        )}
      </section>

      <p className="mt-10">
        <Link href="/shop" className="text-sm font-bold text-[#219b31] hover:underline">
          Back to the shop
        </Link>
      </p>
    </main>
  );
}
