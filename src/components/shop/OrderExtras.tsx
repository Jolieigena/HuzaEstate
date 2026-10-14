"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { StarRow } from "@/components/shop/SupplierBadges";
import { FurnitureApi, type Order } from "@/lib/furniture/api";

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(value));
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

/** The steps of an order with the day each was reached: placed, confirmed, on its way, delivered. A declined or cancelled
 *  order shows where it ended instead. */
export function OrderTimeline({ order }: { order: Order }) {
  if (order.status === "declined" || order.status === "cancelled") return null;
  const steps = [
    { label: "Placed", at: order.createdAt },
    { label: "Confirmed", at: order.confirmedAt },
    { label: "On its way", at: order.shippedAt },
    { label: "Delivered", at: order.completedAt },
  ];
  // A step is done once it has a date, or a later step has one (an order can go straight from confirmed to delivered).
  const lastDone = steps.reduce((last, step, i) => (step.at ? i : last), 0);
  return (
    <ol className="mt-4 grid grid-cols-4 gap-2" aria-label="Order progress">
      {steps.map((step, i) => {
        const done = i <= lastDone;
        return (
          <li key={step.label} className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${done ? "bg-[#2ec440] text-white" : "bg-slate-200 text-transparent"}`} aria-hidden="true">
                ✓
              </span>
              <span className={`h-0.5 flex-1 rounded ${i < lastDone ? "bg-[#2ec440]" : "bg-slate-200"} ${i === steps.length - 1 ? "invisible" : ""}`} aria-hidden="true" />
            </div>
            <p className={`mt-1.5 truncate text-xs font-bold ${done ? "text-slate-800" : "text-slate-400"}`}>{step.label}</p>
            {step.at && <p className="text-[11px] text-slate-400">{shortDate(step.at)}</p>}
          </li>
        );
      })}
    </ol>
  );
}

/** The messages between the buyer and the supplier of an order, and a box to write one. Closed until opened. */
export function OrderConversation({ order, viewer, onSent }: { order: Order; viewer: "client" | "supplier"; onSent: () => void }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const count = order.messages?.length ?? 0;
  const other = viewer === "client" ? "supplier" : "buyer";

  const send = async () => {
    if (!token || busy || !text.trim()) return;
    setBusy(true);
    const result = await FurnitureApi.postMessage(token, order.id, text.trim());
    setBusy(false);
    if (!result.ok) {
      showToast(result.error, "error");
      return;
    }
    setText("");
    onSent();
  };

  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="text-sm font-bold text-slate-600 hover:text-slate-900">
        {open ? "Hide messages" : count > 0 ? `Messages (${count})` : `Message the ${other}`}
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          {count > 0 && (
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {order.messages.map((m, i) => (
                <li key={i} className={`flex ${m.from === viewer ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${m.from === viewer ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"}`}>
                    <p className="whitespace-pre-line break-words">{m.text}</p>
                    <p className={`mt-1 text-[10px] ${m.from === viewer ? "text-slate-300" : "text-slate-400"}`}>{dateTime(m.at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#2ec440] focus:ring-2 focus:ring-[#2ec440]/15"
              value={text}
              maxLength={1000}
              placeholder="Write a message"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button type="button" disabled={busy || !text.trim()} onClick={send} className="min-h-10 shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#2ec440] disabled:opacity-50">
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** After delivery the buyer rates the supplier once; afterwards their review and the supplier's reply are shown. */
export function OrderReview({ order, onSent }: { order: Order; onSent: () => void }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  if (order.status !== "completed") return null;

  if (order.review) {
    return (
      <div className="mt-4 rounded-xl bg-slate-50 p-4">
        <div className="flex items-center gap-2">
          <StarRow value={order.review.rating} />
          <span className="text-xs font-bold text-slate-500">Your review</span>
        </div>
        {order.review.comment && <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{order.review.comment}</p>}
        {order.review.reply && (
          <p className="mt-3 border-l-2 border-[#2ec440] pl-3 text-sm text-slate-700">
            <span className="block text-xs font-bold text-slate-500">Reply from {order.supplierName ?? "the supplier"}</span>
            {order.review.reply}
          </p>
        )}
      </div>
    );
  }

  const submit = async () => {
    if (!token || sending) return;
    if (rating < 1) {
      showToast("Choose a rating from 1 to 5 stars.", "error");
      return;
    }
    setSending(true);
    const result = await FurnitureApi.reviewOrder(token, order.id, { rating, comment: comment.trim() || undefined });
    setSending(false);
    if (!result.ok) showToast(result.error, "error");
    else {
      showToast("Thank you for your review.");
      onSent();
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-slate-200 p-4">
      <p className="text-sm font-bold text-slate-800">Rate this order</p>
      <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n === 1 ? "" : "s"}`} onClick={() => setRating(n)} className="rounded p-0.5">
            <svg className={`h-7 w-7 ${n <= rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200 hover:fill-amber-200"}`} viewBox="0 0 20 20" aria-hidden="true">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1500} rows={3} placeholder="Write a review (optional)" className="mt-3 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:border-[#2ec440] focus:outline-none" />
      <button type="button" disabled={sending} onClick={submit} className="mt-3 min-h-11 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2ec440] disabled:opacity-50">
        {sending ? "Sending…" : "Send review"}
      </button>
    </div>
  );
}
