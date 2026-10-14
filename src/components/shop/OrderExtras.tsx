"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
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
