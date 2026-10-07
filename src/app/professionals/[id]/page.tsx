"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { fetchProfessionalProfile, fetchProfessionalReviews, submitProfessionalContact, submitProfessionalReview, type ProfessionalReviewList, type RealProfessionalProfile } from "@/lib/professional/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { StarRating } from "@/components/professional/ui";
import { ProfessionalDesignsSection, RequestCustomDesignButton } from "@/components/designs/ProfessionalDesigns";

function ContactCard({ profileId, profileName }: { profileId: string; profileName: string }) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim() || sending) return;
    setSending(true);
    // Emailed to the professional through communication-service.
    const { ok } = await submitProfessionalContact(profileId, { name: name.trim(), email: email.trim(), message: message.trim() });
    setSending(false);
    if (ok) {
      setSent(true);
      showToast(`Message sent to ${profileName}`, "success");
    } else {
      showToast("Something went wrong. Please try again.", "error");
    }
  }

  if (sent) {
    return (
      <div className="bg-[#2ec440]/5 border border-[#2ec440]/30 rounded-3xl p-8 text-center">
        <svg className="w-10 h-10 text-[#2ec440] mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Message sent</h3>
        <p className="text-sm text-slate-500">{profileName} will get back to you at {email}.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8">
      <h3 className="text-lg font-bold text-slate-900 mb-1">Contact {profileName}</h3>
      <p className="text-sm text-slate-500 mb-5">Tell them about your project. They&apos;ll reply directly to your email.</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Your name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Your email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Message</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={4} placeholder="Tell them about your project, timeline and budget..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors resize-none" />
        </div>
        <button type="submit" disabled={sending} className="w-full bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60">
          {sending ? "Sending…" : "Send Message"}
        </button>
      </div>
    </form>
  );
}

function ProjectMedia({ item }: { item: RealProfessionalProfile["portfolio"][number] }) {
  const images = item.images?.length ? item.images : item.imageUrl ? [item.imageUrl] : [];
  const [playingVideo, setPlayingVideo] = useState(false);

  if (playingVideo && item.videoUrl) {
    return (
      <div className="h-40 bg-black">
        <video src={item.videoUrl} controls autoPlay playsInline className="h-full w-full object-contain" />
      </div>
    );
  }

  return (
    <div className="relative h-40 bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center overflow-hidden">
      {images.length > 0 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={images[0]} alt={item.title} className="h-full w-full object-cover" />
      ) : (
        <span className="text-white/70 text-xs font-bold uppercase tracking-wide">Project</span>
      )}
      {images.length > 1 && (
        <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-bold text-white">+{images.length - 1} more</span>
      )}
      {item.videoUrl && (
        <button
          type="button"
          onClick={() => setPlayingVideo(true)}
          aria-label="Play video"
          className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-lg">
            <svg className="ml-0.5 h-5 w-5 text-slate-900" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          </span>
        </button>
      )}
    </div>
  );
}

function ReviewsSection({ profileId, profileName }: { profileId: string; profileName: string }) {
  const { account, token } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<ProfessionalReviewList | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchProfessionalReviews(profileId).then((result) => {
      if (!cancelled) setData(result);
    });
    return () => { cancelled = true; };
  }, [profileId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || rating < 1) return;
    setSubmitting(true);
    const result = await submitProfessionalReview(token, profileId, { rating, comment: comment.trim() || undefined });
    setSubmitting(false);
    if (result.ok) {
      showToast("Review submitted.", "success");
      setRating(0);
      setComment("");
      fetchProfessionalReviews(profileId).then(setData);
    } else {
      showToast(result.error, "error");
    }
  }

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Reviews</h2>
      {data && data.reviewCount > 0 && (
        <div className="flex items-center gap-3 mb-5">
          <span className="text-2xl font-black text-slate-900">{data.averageRating.toFixed(1)}</span>
          <div>
            <StarRating value={data.averageRating} size="md" />
            <p className="text-xs text-slate-500">{data.reviewCount} {data.reviewCount === 1 ? "review" : "reviews"}</p>
          </div>
        </div>
      )}

      {data && data.reviews.length > 0 ? (
        <div className="space-y-4 mb-6">
          {data.reviews.map((review) => (
            <div key={review.id} className="border border-slate-100 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-bold text-slate-900">{review.reviewerName}</p>
                <StarRating value={review.rating} />
              </div>
              {review.comment && <p className="mt-2 text-sm text-slate-600">{review.comment}</p>}
            </div>
          ))}
        </div>
      ) : (
        data && <p className="text-sm text-slate-500 mb-6">No reviews yet.</p>
      )}

      {account ? (
        <form onSubmit={handleSubmit} className="border border-slate-100 rounded-2xl p-4">
          <p className="text-sm font-bold text-slate-900 mb-2">Leave a review</p>
          <p className="text-xs text-slate-500 mb-3">Only people who&apos;ve contacted {profileName} can leave a review.</p>
          <div className="flex items-center gap-1 mb-3" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} onMouseEnter={() => setHoverRating(n)} aria-label={`${n} star${n === 1 ? "" : "s"}`}>
                <svg className={`h-6 w-6 ${n <= (hoverRating || rating) ? "text-amber-400" : "text-slate-200"}`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.446a1 1 0 00-.363 1.118l1.287 3.957c.3.922-.755 1.688-1.539 1.118l-3.367-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.784.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.957 9.385c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.958z" />
                </svg>
              </button>
            ))}
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Optional comment…" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors resize-none" />
          <button type="submit" disabled={rating < 1 || submitting} className="mt-3 bg-slate-900 hover:bg-[#2ec440] text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50">
            {submitting ? "Submitting…" : "Submit review"}
          </button>
        </form>
      ) : (
        <p className="text-sm text-slate-500">
          <Link href="/login" className="font-bold text-[#2ec440] hover:underline">Log in</Link> to leave a review after contacting {profileName}.
        </p>
      )}
    </div>
  );
}

export default function ProfessionalProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loaded, setLoaded] = useState<{ id: string; profile: RealProfessionalProfile | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchProfessionalProfile(id).then((real) => {
      if (!cancelled) setLoaded({ id, profile: real });
    });
    return () => { cancelled = true; };
  }, [id]);

  const profile = loaded && loaded.id === id ? loaded.profile : null;

  if (!loaded || loaded.id !== id) {
    return <div className="min-h-screen flex items-center justify-center text-sm font-semibold text-slate-500">Loading…</div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Professional not found</h1>
        <p className="text-slate-500">This profile may no longer be available.</p>
        <Link href="/professionals" className="font-bold text-[#2ec440] hover:text-[#28b039] transition-colors">Browse professionals</Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-white min-h-screen pb-20">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 pt-12">
        <Link href="/professionals" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold transition-colors mb-8">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
          Back to professionals
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-10">
          <div className="w-20 h-20 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-3xl flex-shrink-0 overflow-hidden">
            {profile.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              profile.displayName.charAt(0)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{profile.displayName}</h1>
            </div>
            {profile.specialisations.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {profile.specialisations.map((item) => (
                  <span key={item} className="rounded-full bg-[#2ec440]/10 px-3 py-1 text-sm font-semibold text-[#219b31]">{item}</span>
                ))}
              </div>
            )}
            <p className="text-slate-500 text-sm">{[profile.city, profile.country].filter(Boolean).join(", ")}{profile.yearsExperience ? ` · ${profile.yearsExperience} years experience` : ""}</p>
            {!!profile.reviewCount && (
              <div className="mt-2 flex items-center gap-1.5">
                <StarRating value={profile.averageRating ?? 0} />
                <span className="text-xs font-semibold text-slate-500">{(profile.averageRating ?? 0).toFixed(1)} ({profile.reviewCount})</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-slate-900 mb-3">About</h2>
            <p className="text-slate-600 leading-relaxed mb-8">{profile.bio}</p>

            <h2 className="text-xl font-bold text-slate-900 mb-4">Services</h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              {profile.services.map((service, index) => (
                <div key={`${service.name}-${index}`} className="border border-slate-100 rounded-2xl p-4">
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{service.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{service.description}</p>
                </div>
              ))}
            </div>

            <ProfessionalDesignsSection profileId={profile.accountId} />

            <h2 className="text-xl font-bold text-slate-900 mb-4">Example projects done</h2>
            {profile.portfolio.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-5">
                {profile.portfolio.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="border border-slate-100 rounded-2xl overflow-hidden">
                    <ProjectMedia item={item} />
                    <div className="p-4">
                      <h3 className="font-bold text-slate-900 text-sm mb-0.5">{item.title}</h3>
                      <p className="text-xs text-slate-500 mb-2">{[profile.city, profile.country].filter(Boolean).join(", ")}{item.year ? ` · ${item.year}` : ""}</p>
                      <p className="text-xs text-slate-600 leading-relaxed mb-2">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No example projects yet.</p>
            )}

            <ReviewsSection profileId={profile.accountId} profileName={profile.displayName} />
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-28">
              <RequestCustomDesignButton profileId={profile.accountId} profileName={profile.displayName} />
              <ContactCard profileId={profile.accountId} profileName={profile.displayName} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
