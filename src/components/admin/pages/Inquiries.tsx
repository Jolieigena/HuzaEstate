"use client";

import { useEffect, useId, useState } from "react";
import Dialog from "@/components/Dialog";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useIsAdministrator } from "@/lib/admin/hooks";
import { PropertyApi } from "@/lib/properties/api";
import type { Inquiry, InquiryStatus } from "@/lib/properties/api";
import { fetchAllProfessionalInquiries, nudgeProfessionalInquiry, type AdminProfessionalInquiry } from "@/lib/professional/api";
import { useToast } from "@/lib/toast-context";
import { Card, EmptyState, NudgeAction, PageFrame, PrimaryButton, RequirePermission, SecondaryButton, StatusPill, fieldClass, formatDateTime } from "../ui";

const STATUS_FILTERS: { key: "all" | InquiryStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "closed", label: "Closed" },
];

type Tab = "property" | "professional";

// US homes belong to the platform itself, so the administrators answer those buyers directly.
const PLATFORM_OWNER = "platform";

function Person({ name, email, phone }: { name: string; email: string; phone?: string }) {
  return (
    <div className="min-w-0 text-sm">
      <p className="font-semibold text-slate-900">{name}</p>
      {email && <a href={`mailto:${email}`} className="block truncate text-xs text-slate-500 hover:text-[#219b31]">{email}</a>}
      {phone && <a href={`tel:${phone}`} className="block text-xs text-slate-500 hover:text-[#219b31]">{phone}</a>}
    </div>
  );
}

function ReplyAction({ onSend }: { onSend: (message: string) => Promise<boolean> }) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  async function send() {
    if (!message.trim() || sending) return;
    setSending(true);
    const ok = await onSend(message.trim());
    setSending(false);
    if (ok) {
      setOpen(false);
      setMessage("");
    }
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#2ec440]">
        Reply
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} labelledBy={titleId} panelClassName="max-w-md p-6">
        <h2 id={titleId} className="text-lg font-bold text-slate-900">Reply</h2>
        <textarea autoFocus rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className={`${fieldClass} mt-4`} />
        <div className="mt-4 flex justify-end gap-3">
          <SecondaryButton type="button" className="min-h-10 px-4 py-2 text-sm" onClick={() => setOpen(false)}>Cancel</SecondaryButton>
          <PrimaryButton type="button" className="min-h-10 px-4 py-2 text-sm" disabled={sending || !message.trim()} onClick={send}>{sending ? "Sending…" : "Send reply"}</PrimaryButton>
        </div>
      </Dialog>
    </>
  );
}

// Every buyer/renter message about a listing, AND every contact-form message to a professional,
// across the whole platform, unscoped — mirrors org-admin's own Inquiries page
// (components/org-admin/pages/Inquiries.tsx), just without the country filter. Status changes on
// property inquiries stay with the listing's actual owner (see property-service's
// updateInquiryStatus), not the platform admin — but any admin can leave a note ("nudge") that's
// recorded on the inquiry and emailed to whoever's responsible.
export function InquiriesListPage() {
  const { token, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const canView = useIsAdministrator();
  const [tab, setTab] = useState<Tab>("property");

  const [inquiries, setInquiries] = useState<Inquiry[] | null>(null);
  const [proInquiries, setProInquiries] = useState<AdminProfessionalInquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | InquiryStatus>("all");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!isAuthReady || !token || !canView) return;
    let cancelled = false;
    if (tab === "property") {
      PropertyApi.allInquiries(token).then((result) => {
        if (cancelled) return;
        if (result.ok) setInquiries(result.data);
        else setError(result.error);
      });
    } else {
      fetchAllProfessionalInquiries(token).then((data) => {
        if (!cancelled) setProInquiries(data);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, canView, tab, reload]);

  async function nudge(id: string, message: string): Promise<boolean> {
    if (!token) return false;
    const result = await PropertyApi.nudgeInquiry(token, id, message);
    if (result.ok) {
      showToast(result.delivered ? "Note sent." : "Note saved, but the email couldn't be delivered.", result.delivered ? "success" : "error");
      setReload((n) => n + 1);
      return true;
    }
    showToast(result.error, "error");
    return false;
  }

  async function nudgePro(id: string, message: string): Promise<boolean> {
    if (!token) return false;
    const result = await nudgeProfessionalInquiry(token, id, message);
    if (result.ok) {
      showToast(result.delivered ? "Note sent." : "Note saved, but the email couldn't be delivered.", result.delivered ? "success" : "error");
      setReload((n) => n + 1);
      return true;
    }
    showToast(result.error, "error");
    return false;
  }

  async function reply(id: string, message: string): Promise<boolean> {
    if (!token) return false;
    const result = await PropertyApi.replyToInquiry(token, id, message);
    if (result.ok) {
      showToast(result.delivered ? "Reply sent." : "Reply saved, but the email couldn't be delivered.", result.delivered ? "success" : "error");
      setReload((n) => n + 1);
      return true;
    }
    showToast(result.error, "error");
    return false;
  }

  async function setInquiryStatus(id: string, next: InquiryStatus) {
    if (!token) return;
    const result = await PropertyApi.setInquiryStatus(token, id, next);
    if (result.ok) setReload((n) => n + 1);
    else showToast(result.error, "error");
  }

  const q = search.trim().toLowerCase();
  const propertyRows = (inquiries ?? []).filter((i) => {
    const matchesSearch = !q || `${i.name} ${i.email} ${i.propertyTitle} ${i.ownerName ?? ""}`.toLowerCase().includes(q);
    return matchesSearch && (status === "all" || i.status === status);
  });
  const proRows = (proInquiries ?? []).filter((i) => !q || `${i.name} ${i.email} ${i.professionalName ?? ""}`.toLowerCase().includes(q));

  return (
    <PageFrame title="Inquiries">
      <RequirePermission granted={canView}>
        <div role="tablist" aria-label="Inquiry type" className="mb-5 flex flex-wrap gap-2">
          {([["property", "Property"], ["professional", "Professional"]] as const).map(([key, label]) => {
            const active = tab === key;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(key)}
                className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {tab === "property" && (
          <div role="tablist" aria-label="Inquiry status" className="mb-5 flex flex-wrap gap-2">
            {STATUS_FILTERS.map((item) => {
              const active = status === item.key;
              return (
                <button
                  key={item.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStatus(item.key)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${active ? "border-slate-700 bg-slate-700 text-white" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        )}

        <Card className="mb-5">
          <label className="text-sm font-bold text-slate-700">
            Search
            <input className={`${fieldClass} mt-1`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tab === "property" ? "Name, email, property, or owner" : "Name, email, or professional"} />
          </label>
        </Card>

        {tab === "property" ? (
          error ? (
            <Card className="border-red-100 bg-red-50/60 text-sm text-red-700">{error}</Card>
          ) : !inquiries ? (
            <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading inquiries…</p>
          ) : propertyRows.length ? (
            <ul className="space-y-4">
              {propertyRows.map((inquiry) => {
                const platform = inquiry.ownerId === PLATFORM_OWNER;
                return (
                  <li key={inquiry.id}>
                    <Card>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link href={`/properties/${inquiry.propertyId}`} target="_blank" className="block truncate text-base font-bold text-slate-900 hover:text-[#219b31]">
                            {inquiry.propertyTitle}
                          </Link>
                          <p className="mt-0.5 text-xs text-slate-500">{formatDateTime(inquiry.createdAt)}</p>
                        </div>
                        <StatusPill status={inquiry.status} />
                      </div>

                      <p className="mt-4 whitespace-pre-line rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{inquiry.message}</p>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">From</p>
                          <Person name={inquiry.name} email={inquiry.email} phone={inquiry.phone} />
                        </div>
                        <div>
                          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Owner</p>
                          {inquiry.ownerName ? <Person name={inquiry.ownerName} email={inquiry.ownerEmail ?? ""} /> : <p className="text-sm text-slate-400">—</p>}
                        </div>
                      </div>

                      {inquiry.replies.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {inquiry.replies.map((r, i) => (
                            <p key={i} className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-sm text-slate-700">
                              <span className="mb-1 block text-xs font-bold text-emerald-700">Replied · {formatDateTime(r.createdAt)}</span>
                              <span className="whitespace-pre-line">{r.message}</span>
                            </p>
                          ))}
                        </div>
                      )}
                      {inquiry.adminNudges.length > 0 && (
                        <p className="mt-3 text-xs font-semibold text-amber-600">{inquiry.adminNudges.length} note{inquiry.adminNudges.length === 1 ? "" : "s"} sent</p>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                        {platform ? (
                          <>
                            <ReplyAction onSend={(message) => reply(inquiry.id, message)} />
                            {inquiry.status !== "contacted" && (
                              <button type="button" onClick={() => setInquiryStatus(inquiry.id, "contacted")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">Mark contacted</button>
                            )}
                            {inquiry.status !== "closed" && (
                              <button type="button" onClick={() => setInquiryStatus(inquiry.id, "closed")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">Close</button>
                            )}
                          </>
                        ) : (
                          <NudgeAction onSend={(message) => nudge(inquiry.id, message)} />
                        )}
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState title="No inquiries found" description="Messages about listings will appear here." />
          )
        ) : !proInquiries ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading inquiries…</p>
        ) : proRows.length ? (
          <ul className="space-y-4">
            {proRows.map((inquiry) => (
              <li key={inquiry.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/professionals/${inquiry.professionalId}`} target="_blank" className="block truncate text-base font-bold text-slate-900 hover:text-[#219b31]">
                        {inquiry.professionalName ?? "—"}
                      </Link>
                      {inquiry.professionalEmail && <a href={`mailto:${inquiry.professionalEmail}`} className="text-xs text-slate-500 hover:text-[#219b31]">{inquiry.professionalEmail}</a>}
                    </div>
                    <p className="text-xs text-slate-500">{formatDateTime(inquiry.createdAt)}</p>
                  </div>
                  <p className="mt-4 whitespace-pre-line rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{inquiry.message}</p>
                  <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">From</p>
                      <Person name={inquiry.name} email={inquiry.email} phone={inquiry.phone} />
                    </div>
                    <div className="flex items-center gap-3">
                      {inquiry.adminNudges.length > 0 && <p className="text-xs font-semibold text-amber-600">{inquiry.adminNudges.length} note{inquiry.adminNudges.length === 1 ? "" : "s"} sent</p>}
                      <NudgeAction onSend={(message) => nudgePro(inquiry.id, message)} />
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No inquiries found" description="Messages sent to professionals will appear here." />
        )}
      </RequirePermission>
    </PageFrame>
  );
}
