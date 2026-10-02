"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchMyProfessionalInquiries, markProfessionalInquiryRead, type ProfessionalInquiry } from "@/lib/professional/api";
import { AdminTable, EmptyState, PageFrame, SecondaryButton, formatDateTime } from "./ui";

export default function InquiriesPage() {
  const { token, isAuthReady } = useAuth();
  const [inquiries, setInquiries] = useState<ProfessionalInquiry[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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
                {inquiry.message}
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
                {!inquiry.read && (
                  <SecondaryButton className="min-h-9 px-3 py-1.5 text-xs" disabled={busyId === inquiry.id} onClick={() => markRead(inquiry)}>
                    Mark read
                  </SecondaryButton>
                )}
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
