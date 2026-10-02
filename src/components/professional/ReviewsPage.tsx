"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchProfessionalReviews, type ProfessionalReviewList } from "@/lib/professional/api";
import { Card, EmptyState, PageFrame, StarRating, formatDate } from "./ui";

export default function ReviewsPage() {
  const { account, isAuthReady } = useAuth();
  const [data, setData] = useState<ProfessionalReviewList | null>(null);

  useEffect(() => {
    if (!isAuthReady || !account?.id) return;
    let cancelled = false;
    fetchProfessionalReviews(account.id).then((result) => {
      if (!cancelled) setData(result);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, account?.id]);

  return (
    <PageFrame title="Reviews">
      {!data ? (
        <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading reviews…</p>
      ) : data.reviewCount === 0 ? (
        <EmptyState title="No reviews yet" description="Reviews left by clients you've been in contact with will appear here." />
      ) : (
        <div className="space-y-5">
          <Card className="flex items-center gap-4">
            <span className="text-3xl font-black text-slate-900">{data.averageRating.toFixed(1)}</span>
            <div>
              <StarRating value={data.averageRating} size="md" />
              <p className="mt-1 text-sm text-slate-500">{data.reviewCount} {data.reviewCount === 1 ? "review" : "reviews"}</p>
            </div>
          </Card>
          <div className="space-y-4">
            {data.reviews.map((review) => (
              <Card key={review.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{review.reviewerName}</p>
                    <StarRating value={review.rating} />
                  </div>
                  <p className="text-xs text-slate-400">{formatDate(review.createdAt)}</p>
                </div>
                {review.comment && <p className="mt-3 text-sm text-slate-600">{review.comment}</p>}
              </Card>
            ))}
          </div>
        </div>
      )}
    </PageFrame>
  );
}
