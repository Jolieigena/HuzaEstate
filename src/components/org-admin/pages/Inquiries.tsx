"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { hasOrgPermission } from "@/lib/orgPermissions";
import { PropertyApi } from "@/lib/properties/api";
import type { Inquiry, InquiryStatus } from "@/lib/properties/api";
import { fetchOrgProfessionalInquiries, nudgeProfessionalInquiry, type AdminProfessionalInquiry } from "@/lib/professional/api";
import { useToast } from "@/lib/toast-context";
import { AdminTable, Card, EmptyState, NudgeAction, PageFrame, RequirePermission, StatusPill, fieldClass, formatDateTime } from "@/components/admin/ui";

const STATUS_FILTERS: { key: "all" | InquiryStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "closed", label: "Closed" },
];

type Tab = "property" | "professional";

// Who's actually contacting sellers and professionals in your organisation's countries — a real
// demand signal, not just listing counts. Status changes on property inquiries stay with the
// listing's actual owner (see property-service's updateInquiryStatus), not the org admin — but
// you can leave a note ("nudge") that's recorded on the inquiry and emailed to whoever's
// responsible, same as the platform admin's own Inquiries page.
export function OrgInquiriesListPage() {
  const { token, account, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const canView = (account?.roles.includes("organization_admin") ?? false) && hasOrgPermission(account?.permissions, "view_inquiries");
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
      PropertyApi.orgInquiries(token).then((result) => {
        if (cancelled) return;
        if (result.ok) setInquiries(result.data);
        else setError(result.error);
      });
    } else {
      fetchOrgProfessionalInquiries(token).then((data) => {
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
            <AdminTable headers={["Property", "From", "Owner", "Message", "Status", "Received", "Action"]}>
              {propertyRows.map((inquiry) => (
                <tr key={inquiry.id} className="align-top transition-colors hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <Link href={`/properties/${inquiry.propertyId}`} target="_blank" className="block max-w-45 truncate text-sm font-bold text-slate-900 hover:text-[#219b31]">
                      {inquiry.propertyTitle}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{inquiry.name}</p>
                    <p className="text-xs text-slate-500">{inquiry.email}</p>
                    {inquiry.phone && <p className="text-xs text-slate-500">{inquiry.phone}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{inquiry.ownerName ?? "—"}</p>
                    {inquiry.ownerEmail && <a href={`mailto:${inquiry.ownerEmail}`} className="text-xs text-slate-500 hover:text-[#219b31]">{inquiry.ownerEmail}</a>}
                  </td>
                  <td className="px-6 py-4 max-w-60 text-sm text-slate-600">
                    {inquiry.message}
                    {inquiry.adminNudges.length > 0 && (
                      <p className="mt-1.5 text-xs font-semibold text-amber-600">{inquiry.adminNudges.length} note{inquiry.adminNudges.length === 1 ? "" : "s"} sent</p>
                    )}
                  </td>
                  <td className="px-6 py-4"><StatusPill status={inquiry.status} /></td>
                  <td className="px-6 py-4 text-xs text-slate-500">{formatDateTime(inquiry.createdAt)}</td>
                  <td className="px-6 py-4">
                    <NudgeAction onSend={(message) => nudge(inquiry.id, message)} />
                  </td>
                </tr>
              ))}
            </AdminTable>
          ) : (
            <EmptyState title="No inquiries found" description="Messages about listings in your countries will appear here." />
          )
        ) : !proInquiries ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading inquiries…</p>
        ) : proRows.length ? (
          <AdminTable headers={["Professional", "From", "Message", "Received", "Action"]}>
            {proRows.map((inquiry) => (
              <tr key={inquiry.id} className="align-top transition-colors hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <Link href={`/professionals/${inquiry.professionalId}`} target="_blank" className="block max-w-45 truncate text-sm font-bold text-slate-900 hover:text-[#219b31]">
                    {inquiry.professionalName ?? "—"}
                  </Link>
                  {inquiry.professionalEmail && <a href={`mailto:${inquiry.professionalEmail}`} className="text-xs text-slate-500 hover:text-[#219b31]">{inquiry.professionalEmail}</a>}
                </td>
                <td className="px-6 py-4">
                  <p className="font-semibold text-slate-900">{inquiry.name}</p>
                  <p className="text-xs text-slate-500">{inquiry.email}</p>
                  {inquiry.phone && <p className="text-xs text-slate-500">{inquiry.phone}</p>}
                </td>
                <td className="px-6 py-4 max-w-70 text-sm text-slate-600">
                  {inquiry.message}
                  {inquiry.adminNudges.length > 0 && (
                    <p className="mt-1.5 text-xs font-semibold text-amber-600">{inquiry.adminNudges.length} note{inquiry.adminNudges.length === 1 ? "" : "s"} sent</p>
                  )}
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">{formatDateTime(inquiry.createdAt)}</td>
                <td className="px-6 py-4">
                  <NudgeAction onSend={(message) => nudgePro(inquiry.id, message)} />
                </td>
              </tr>
            ))}
          </AdminTable>
        ) : (
          <EmptyState title="No inquiries found" description="Messages sent to professionals in your countries will appear here." />
        )}
      </RequirePermission>
    </PageFrame>
  );
}
