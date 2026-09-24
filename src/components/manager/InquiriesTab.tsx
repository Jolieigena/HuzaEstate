"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { PropertyApi, type Inquiry, type InquiryStatus } from "@/lib/properties/api";
import { useToast } from "@/lib/toast-context";

const FILTERS: { key: "all" | InquiryStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "closed", label: "Closed" },
];

const STATUS_STYLE: Record<InquiryStatus, string> = {
  new: "bg-blue-50 text-blue-700",
  contacted: "bg-amber-50 text-amber-700",
  closed: "bg-slate-100 text-slate-500",
};

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

/** Messages buyers and renters sent about this seller's listings (property-service /inquiries). */
export default function InquiriesTab({ inquiries, onChanged }: { inquiries: Inquiry[]; onChanged: () => void }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<"all" | InquiryStatus>("all");
  const shown = inquiries.filter((inquiry) => filter === "all" || inquiry.status === filter);

  async function setStatus(inquiry: Inquiry, status: InquiryStatus) {
    if (!token) return;
    const result = await PropertyApi.setInquiryStatus(token, inquiry.id, status);
    if (result.ok) onChanged();
    else showToast(result.error, "error");
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Inquiry status">
        {FILTERS.map((item) => {
          const count = item.key === "all" ? inquiries.length : inquiries.filter((i) => i.status === item.key).length;
          const active = filter === item.key;
          return (
            <button
              key={item.key}
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(item.key)}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
            >
              {item.label} <span className={`ml-1 text-xs ${active ? "text-white/70" : "text-slate-400"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm py-16 px-6 text-center text-slate-500 text-sm">
          {inquiries.length === 0 ? "No inquiries yet. When a buyer or renter messages you about a listing, it will appear here." : "No inquiries in this status."}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {shown.map((inquiry) => (
            <div key={inquiry.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{inquiry.name}</p>
                  <p className="text-xs text-slate-500">
                    <a href={`mailto:${inquiry.email}`} className="hover:text-[#219b31]">{inquiry.email}</a>
                    {inquiry.phone ? <> · <a href={`tel:${inquiry.phone}`} className="hover:text-[#219b31]">{inquiry.phone}</a></> : null}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${STATUS_STYLE[inquiry.status]}`}>{inquiry.status}</span>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{inquiry.message}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-50 pt-3">
                <p className="text-xs text-slate-400">
                  About{" "}
                  <Link href={`/properties/${inquiry.propertyId}`} className="font-semibold text-slate-600 hover:text-[#219b31]">
                    {inquiry.propertyTitle}
                  </Link>{" "}
                  · {dateFormat.format(new Date(inquiry.createdAt))}
                </p>
                <div className="flex gap-2">
                  {inquiry.status !== "contacted" && (
                    <button onClick={() => setStatus(inquiry, "contacted")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                      Mark contacted
                    </button>
                  )}
                  {inquiry.status !== "closed" ? (
                    <button onClick={() => setStatus(inquiry, "closed")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                      Close
                    </button>
                  ) : (
                    <button onClick={() => setStatus(inquiry, "new")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                      Reopen
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
