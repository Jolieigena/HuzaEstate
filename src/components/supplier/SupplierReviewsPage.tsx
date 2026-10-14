"use client";

import { useEffect, useState } from "react";
import { Card, EmptyState, PageFrame, PrimaryButton, fieldClass, formatDate } from "@/components/professional/ui";
import { StarRow } from "@/components/shop/SupplierBadges";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { FurnitureApi, type Rating, type Review } from "@/lib/furniture/api";

interface Data {
  reviews: Review[];
  rating: Rating;
  stars: Record<string, number>;
  unanswered: number;
}

/** What buyers said about delivered orders, with a place to answer each one. */
export default function SupplierReviewsPage() {
  const { token, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    if (!isAuthReady || !token) return;
    let cancelled = false;
    FurnitureApi.reviewsReceived(token).then((result) => {
      if (cancelled) return;
      if (result.ok) setData(result.data);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token]);

  async function reply(review: Review) {
    const text = (drafts[review.id] ?? "").trim();
    if (!token || !text) return;
    setBusyId(review.id);
    const result = await FurnitureApi.replyToReview(token, review.id, text);
    setBusyId("");
    if (!result.ok) {
      showToast(result.error, "error");
      return;
    }
    showToast("Reply sent.");
    setEditing(null);
    setData((prev) => (prev ? { ...prev, reviews: prev.reviews.map((r) => (r.id === review.id ? result.data.review : r)), unanswered: prev.unanswered - (review.reply ? 0 : 1) } : prev));
  }

  return (
    <PageFrame title="Reviews">
      {error ? (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
      ) : !data ? (
        <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading…</p>
      ) : data.reviews.length === 0 ? (
        <EmptyState title="No reviews yet" />
      ) : (
        <div className="space-y-6">
          <Card className="flex flex-wrap items-center gap-8">
            <div>
              <p className="text-4xl font-black text-slate-900">{data.rating.average.toFixed(1)}</p>
              <StarRow value={data.rating.average} className="h-5 w-5" />
              <p className="mt-1 text-xs font-bold text-slate-500">{data.rating.count} review{data.rating.count === 1 ? "" : "s"}</p>
            </div>
            <div className="min-w-[14rem] flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((n) => {
                const count = data.stars[String(n)] ?? 0;
                return (
                  <div key={n} className="flex items-center gap-3 text-xs font-bold text-slate-500">
                    <span className="w-3">{n}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <span className="block h-full rounded-full bg-amber-400" style={{ width: `${data.rating.count ? (count / data.rating.count) * 100 : 0}%` }} />
                    </span>
                    <span className="w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
            {data.unanswered > 0 && <p className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{data.unanswered} to answer</p>}
          </Card>

          <ul className="space-y-4">
            {data.reviews.map((review) => (
              <li key={review.id}>
                <Card>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <StarRow value={review.rating} />
                      <span className="text-sm font-bold text-slate-900">{review.clientName}</span>
                    </div>
                    <span className="text-xs text-slate-400">{formatDate(review.createdAt)}</span>
                  </div>
                  {review.items.length > 0 && <p className="mt-1 text-xs text-slate-400">{review.items.slice(0, 3).join(", ")}</p>}
                  {review.comment && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{review.comment}</p>}

                  {review.reply && editing !== review.id ? (
                    <div className="mt-4 rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-bold text-slate-500">Your reply</p>
                      <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">{review.reply}</p>
                      <button
                        type="button"
                        className="mt-2 text-xs font-bold text-[#219b31] hover:underline"
                        onClick={() => {
                          setDrafts((d) => ({ ...d, [review.id]: review.reply ?? "" }));
                          setEditing(review.id);
                        }}
                      >
                        Edit reply
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <textarea className={fieldClass} rows={2} maxLength={1000} placeholder="Reply" aria-label="Reply" value={drafts[review.id] ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [review.id]: e.target.value }))} />
                      <PrimaryButton type="button" className="mt-2" disabled={busyId === review.id || !(drafts[review.id] ?? "").trim()} onClick={() => reply(review)}>
                        {busyId === review.id ? "Sending…" : "Send reply"}
                      </PrimaryButton>
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}
    </PageFrame>
  );
}
