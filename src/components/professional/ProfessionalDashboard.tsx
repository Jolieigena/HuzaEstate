"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { fetchMyProfessionalInquiries, fetchProfessionalReviews } from "@/lib/professional/api";
import { Card, PageFrame, PrimaryLink } from "./ui";

function StatCard({ href, label, value }: { href: string; label: string; value: string }) {
  return (
    <Link href={href} className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-[#2ec440]">
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-500">{label}</p>
    </Link>
  );
}

// Shown to a professional after login: quick stats, profile-completion status, and a way to
// their public profile.
export default function ProfessionalDashboard() {
  const { account, token, isAuthReady } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [rating, setRating] = useState<{ averageRating: number; reviewCount: number } | null>(null);

  useEffect(() => {
    if (!isAuthReady || !token || !account?.id) return;
    let cancelled = false;
    fetchMyProfessionalInquiries(token).then((inquiries) => {
      if (!cancelled) setUnreadCount(inquiries.filter((i) => !i.read).length);
    });
    fetchProfessionalReviews(account.id).then((result) => {
      if (!cancelled) setRating({ averageRating: result.averageRating, reviewCount: result.reviewCount });
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, account?.id]);

  return (
    <PageFrame title={`Welcome, ${account?.name ?? "there"}`}>
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard href="/professional/inquiries" label="Unread inquiries" value={unreadCount === null ? "—" : String(unreadCount)} />
        <StatCard href="/professional/reviews" label="Average rating" value={rating === null ? "—" : rating.reviewCount === 0 ? "No reviews yet" : `${rating.averageRating.toFixed(1)} (${rating.reviewCount})`} />
      </div>
      <Card className="max-w-xl">
        {account?.profileCompleted ? (
          <>
            <p className="font-bold text-slate-900">Your profile is live</p>
            <p className="mt-1 text-sm text-slate-500">Clients can find and contact you on the public professionals directory.</p>
            <div className="mt-5 flex gap-3">
              <PrimaryLink href="/professional/profile">Edit profile</PrimaryLink>
              {account?.id && (
                <a href={`/professionals/${account.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  View public profile
                </a>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="font-bold text-slate-900">Complete your profile</p>
            <p className="mt-1 text-sm text-slate-500">Add your bio, specialisation, services and example projects so clients can find and contact you.</p>
            <div className="mt-5"><PrimaryLink href="/professional/profile">Complete your profile</PrimaryLink></div>
          </>
        )}
      </Card>
    </PageFrame>
  );
}
