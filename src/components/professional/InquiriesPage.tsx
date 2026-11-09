"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchMyProfessionalInquiries, markProfessionalInquiryRead, replyToProfessionalInquiry, type ProfessionalInquiry } from "@/lib/professional/api";
import { useToast } from "@/lib/toast-context";
import { AdminTable, EmptyState, PageFrame, SecondaryButton, formatDateTime } from "./ui";

export default function InquiriesPage() {
  const { token, isAuthReady } = useAuth();
  const [inquiries, setInquiries] = useState<ProfessionalInquiry[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { showToast } = useToast();
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [replyError, setReplyError] = useState("");

  useEffect(() => {
    if (!isAuthReady || !token) return;
    let cancelled = false;
    fetchMyProfessionalInquiries(token).then((result) => {
      if (!cancelled) setInquiries(result);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token]);

  async function markRead(inquiry: ProfessionalInquiry) {
    if (!token) return;
    setBusyId(inquiry.id);
    const ok = await markProfessionalInquiryRead(token, inquiry.id);
    setBusyId(null);
    if (ok) setInquiries((prev) => prev?.map((i) => (i.id === inquiry.id ? { ...i, read: true } : i)) ?? null);
  }

  async function sendReply(inquiry: ProfessionalInquiry) {
    if (!token || busyId) return;
    const message = draft.trim();
    if (!message) return setReplyError("Write your reply first.");
    setBusyId(inquiry.id);
    setReplyError("");
    const result = await replyToProfessionalInquiry(token, inquiry.id, message);
    setBusyId(null);
    if (!result.ok) return setReplyError(result.error);
    setInquiries((prev) => prev?.map((i) => (i.id === inquiry.id ? result.inquiry : i)) ?? null);
    setReplyingId(null);
    setDraft("");
    showToast("Reply sent.");
  }

  return (
    <PageFrame title="Inquiries">
      {!inquiries ? (
        <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading inquiries…</p>
      ) : inquiries.length ? (
        <AdminTable headers={["From", "Message", "Received", "Actions"]}>
          {inquiries.map((inquiry) => (
            <tr key={inquiry.id} className={`align-top transition-colors hover:bg-slate-50/50 ${!inquiry.read ? "bg-[#2ec440]/5" : ""}`}>
              <td className="px-6 py-4">
                <p className="font-bold text-slate-900">{inquiry.name}</p>
                <p className="text-xs text-slate-500">{inquiry.email}</p>
                {inquiry.phone && <p className="text-xs text-slate-500">{inquiry.phone}</p>}
              </td>
              <td className="max-w-md px-6 py-4 text-sm text-slate-600">
                <span className="block whitespace-pre-line">{inquiry.message}</span>
                {inquiry.replies?.length > 0 && (
                  <div className="mt-2 flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
                    {inquiry.replies.map((reply, i) => (
                      <div key={i}>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Your reply · {formatDateTime(reply.createdAt)}</p>
                        <p className="mt-0.5 whitespace-pre-line text-xs text-emerald-900">{reply.message}</p>
                      </div>
                    ))}
                  </div>
                )}
                {replyingId === inquiry.id && (
                  <div className="mt-3">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={4}
                      maxLength={4000}
                      aria-label={`Reply to ${inquiry.name}`}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#2ec440] focus:ring-4 focus:ring-[#2ec440]/10"
                    />
                    {replyError && (
                      <p role="alert" className="mt-1 text-xs font-semibold text-red-600">
                        {replyError}
                      </p>
                    )}
                    <div className="mt-2 flex gap-2">
                      <SecondaryButton className="min-h-9 px-3 py-1.5 text-xs" disabled={busyId === inquiry.id} onClick={() => sendReply(inquiry)}>
                        {busyId === inquiry.id ? "Sending…" : "Send reply"}
                      </SecondaryButton>
                      <SecondaryButton className="min-h-9 px-3 py-1.5 text-xs" onClick={() => { setReplyingId(null); setDraft(""); setReplyError(""); }}>
                        Cancel
                      </SecondaryButton>
                    </div>
                  </div>
                )}
                {inquiry.adminNudges.length > 0 && (
                  <div className="mt-2 flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5">
                    {inquiry.adminNudges.map((nudge, i) => (
                      <div key={i}>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Note from Huza Estate</p>
                        <p className="mt-0.5 whitespace-pre-line text-xs text-amber-900">{nudge.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 text-xs text-slate-500">{formatDateTime(inquiry.createdAt)}</td>
              <td className="px-6 py-4">
                <div className="flex flex-col items-start gap-2">
                  <SecondaryButton className="min-h-9 px-3 py-1.5 text-xs" onClick={() => { setReplyingId(inquiry.id); setDraft(""); setReplyError(""); }}>
                    Reply
                  </SecondaryButton>
                  {!inquiry.read && (
                    <SecondaryButton className="min-h-9 px-3 py-1.5 text-xs" disabled={busyId === inquiry.id} onClick={() => markRead(inquiry)}>
                      Mark read
                    </SecondaryButton>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      ) : (
        <EmptyState title="No inquiries yet" description="When someone contacts you through your public profile, their message shows up here." />
      )}
    </PageFrame>
  );
}
