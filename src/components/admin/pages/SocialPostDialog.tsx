"use client";

import { useEffect, useId, useState } from "react";
import InfiniteSentinel from "@/components/shared/InfiniteSentinel";
import { useInfinitePages } from "@/lib/useInfinitePages";
import Dialog from "@/components/Dialog";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { SocialApi, type SocialChannel, type SocialListing, type SocialListingList } from "@/lib/social/api";
import { PrimaryButton, SecondaryButton, fieldClass } from "../ui";

const PAGE_SIZE = 8;

/** Roughly how a network counts a post: every link counts as 23, other characters as 1 (2 for emoji and
 *  most non-Latin text). The server makes the final check. */
export function weightedLength(text: string): number {
  let length = 0;
  const rest = text.replace(/https?:\/\/\S+/g, () => {
    length += 23;
    return "";
  });
  for (const char of rest) length += (char.codePointAt(0) as number) <= 0x10ff ? 1 : 2;
  return length;
}

function priceLabel(listing: SocialListing): string {
  if (!listing.price) return "";
  const code = (listing.currency || "USD").replace(/\/.*$/, "").toUpperCase();
  const amount = Math.round(listing.price).toLocaleString("en-US");
  return `${code === "USD" ? "$" : `${code} `}${amount}${listing.type === "rent" ? "/mo" : ""}`;
}

/** Pick listings from the catalogue to post to one network, by hand. With a single listing selected the
 *  text can be edited before it is sent. */
export default function SocialPostDialog({ channel, open, onClose, onQueued }: { channel: SocialChannel; open: boolean; onClose: () => void; onQueued: () => void }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const titleId = useId();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedIds = Object.keys(selected);
  const single = selectedIds.length === 1 ? selectedIds[0] : "";

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // The listings keep loading as you scroll, so there are no page buttons.
  const feed = useInfinitePages<SocialListingList["listings"][number]>(
    `${channel.id}|${search}|${open}`,
    (pageNumber) =>
      !open || !token
        ? new Promise(() => {})
        : SocialApi.listListings(token, { channel: channel.id, search, page: pageNumber, limit: PAGE_SIZE }).then((result) =>
            result.ok ? { ok: true as const, items: result.data.listings, total: result.data.total } : { ok: false as const, error: result.error },
          ),
    (listing) => listing.id,
  );

  // With exactly one listing selected, show the text the system would write so it can be changed.
  useEffect(() => {
    if (!open || !token || !single) return;
    let cancelled = false;
    SocialApi.preview(token, channel.id, single).then((result) => {
      if (cancelled || !result.ok) return;
      setPreview(result.data.text);
      setText(result.data.text);
    });
    return () => {
      cancelled = true;
    };
  }, [open, token, channel.id, single]);

  const close = () => {
    setSelected({});
    setSearchInput("");
    setSearch("");
    setText("");
    setPreview("");
    onClose();
  };

  const toggle = (listing: SocialListing) => {
    setSelected((current) => {
      const next = { ...current };
      if (next[listing.id]) delete next[listing.id];
      else next[listing.id] = listing.title || "Listing";
      return next;
    });
    if (selectedIds.length >= 1) {
      setText("");
      setPreview("");
    }
  };

  const edited = !!single && text.trim() !== "" && text.trim() !== preview.trim();
  const tooLong = !!single && weightedLength(text) > channel.postLimit;
  const live = channel.settings.mode === "live";

  const submit = async () => {
    if (!token || selectedIds.length === 0 || tooLong) return;
    setBusy(true);
    const result = await SocialApi.createPosts(token, { channel: channel.id, propertyIds: selectedIds, ...(edited ? { text: text.trim() } : {}) });
    setBusy(false);
    if (!result.ok) {
      showToast(result.error, "error");
      return;
    }
    const { queued, skipped } = result.data;
    if (queued > 0) showToast(queued === 1 ? "Queued. It goes out within a minute." : `${queued} queued. They go out within a minute.`);
    if (skipped.length > 0) showToast(skipped.map((s) => `${s.title || "Listing"}: ${s.reason}`).join(" "), queued > 0 ? "success" : "error");
    if (queued > 0) {
      onQueued();
      close();
    }
  };

  const loading = feed.loading;

  return (
    <Dialog open={open} onClose={close} labelledBy={titleId} panelClassName="max-w-3xl">
      <div className="flex max-h-[85vh] flex-col p-6">
        <h2 id={titleId} className="mb-4 pr-6 text-lg font-semibold text-slate-900">
          Post a listing to {channel.label}
        </h2>
        <input className={fieldClass} placeholder="Search by title or place" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} aria-label="Search listings" />

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {feed.error && feed.items.length === 0 ? (
            <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{feed.error}</p>
          ) : !loading && feed.items.length === 0 ? (
            <p className="py-10 text-center text-sm font-semibold text-slate-400">No published listings found</p>
          ) : (
            <ul className="space-y-2">
              {feed.items.map((listing) => {
                const taken = listing.postStatus === "posted" || listing.postStatus === "pending";
                const checked = !!selected[listing.id];
                return (
                  <li key={listing.id}>
                    <label className={`flex items-center gap-4 rounded-xl border p-3 transition-colors ${taken ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-60" : checked ? "cursor-pointer border-[#2ec440] bg-emerald-50/50" : "cursor-pointer border-slate-200 hover:border-slate-300"}`}>
                      <input type="checkbox" className="h-4 w-4 accent-[#2ec440]" checked={checked} disabled={taken} onChange={() => toggle(listing)} />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {listing.imageUrl ? <img src={listing.imageUrl} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" /> : <div className="h-14 w-20 shrink-0 rounded-lg bg-slate-100" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-slate-900">{listing.title}</p>
                        <p className="truncate text-sm text-slate-500">{[listing.location, listing.city, listing.country].filter(Boolean).join(", ")}</p>
                      </div>
                      <div className="shrink-0 text-right text-sm font-semibold text-slate-700">
                        {priceLabel(listing)}
                        {taken && <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{listing.postStatus === "posted" ? "Posted" : "Queued"}</p>}
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
          <InfiniteSentinel onVisible={feed.loadMore} hasMore={feed.hasMore} loading={feed.loadingMore || (loading && feed.items.length > 0)} />
        </div>

        {single && (
          <label className="mt-4 block text-sm font-bold text-slate-700">
            Post text
            <textarea className={`${fieldClass} mt-1 min-h-32 resize-y font-normal`} value={text} onChange={(e) => setText(e.target.value)} />
            <span className={`mt-1 block text-right text-xs font-semibold ${tooLong ? "text-red-600" : "text-slate-400"}`}>
              {weightedLength(text)} / {channel.postLimit}
            </span>
          </label>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-slate-500">{selectedIds.length === 0 ? "Nothing selected" : `${selectedIds.length} selected`}</span>
          <div className="flex gap-2">
            <SecondaryButton type="button" onClick={close}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="button" disabled={busy || selectedIds.length === 0 || tooLong} onClick={submit}>
              {busy ? "Queuing..." : live ? "Post now" : "Rehearse"}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
