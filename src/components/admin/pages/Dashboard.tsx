"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { mockProperties } from "@/lib/data";
import { useAllBuildProjects, useAllRenovationProjects } from "@/lib/admin/crossModule";
import { useAdminState } from "@/lib/admin/hooks";
import { useProfessionalState } from "@/lib/professional/hooks";
import { Card, EmptyState, PageFrame, fieldClass, formatDateTime } from "../ui";

type RangeKey = "today" | "7d" | "30d" | "custom";

function withinRange(iso: string, range: RangeKey, customFrom: string, customTo: string) {
  const at = new Date(iso).getTime();
  const now = Date.now();
  if (range === "today") return now - at <= 24 * 60 * 60 * 1000;
  if (range === "7d") return now - at <= 7 * 24 * 60 * 60 * 1000;
  if (range === "30d") return now - at <= 30 * 24 * 60 * 60 * 1000;
  const from = customFrom ? new Date(customFrom).getTime() : -Infinity;
  const to = customTo ? new Date(customTo).getTime() + 24 * 60 * 60 * 1000 : Infinity;
  return at >= from && at <= to;
}

const OPEN_SUPPORT: string[] = ["new", "assigned", "waiting_customer", "waiting_professional", "in_progress", "escalated", "reopened"];
const OPEN_DISPUTE: string[] = ["submitted", "screening", "information_required", "under_review", "response_requested", "resolution_proposed"];
const ACTIVE_BUILD: string[] = ["brief_in_progress", "ready_to_generate", "generating", "concepts_ready", "refinement_in_progress", "awaiting_professional_review"];
const ACTIVE_RENOVATE: string[] = ["assessment_in_progress", "ready_to_generate", "generating", "concepts_ready", "refinement_in_progress", "scope_ready", "awaiting_professional_review", "awaiting_quotations", "quotation_received"];
const OPEN_REVIEW: string[] = ["submitted", "viewed", "clarification_requested", "resubmitted", "in_review"];

function isExpiringSoon(licenceExpiry: string | undefined) {
  if (!licenceExpiry) return false;
  return new Date(licenceExpiry).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
}
function isOverdue(expectedResponseDate: string | undefined) {
  if (!expectedResponseDate) return false;
  return new Date(expectedResponseDate).getTime() < Date.now();
}

export default function AdminDashboard() {
  const state = useAdminState();
  const buildProjects = useAllBuildProjects();
  const renovationProjects = useAllRenovationProjects();
  const professionalState = useProfessionalState();
  const [range, setRange] = useState<RangeKey>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const applicationsAwaitingReview = professionalState.profiles.filter((p) => ["submitted", "under_review", "more_information_required"].includes(p.status));
  const listingsAwaitingModeration = Object.values(state.listingModeration).filter((r) => r.status === "awaiting_moderation" || r.status === "reported");
  const openSupportCases = state.supportCases.filter((c) => OPEN_SUPPORT.includes(c.status));
  const openDisputes = state.disputes.filter((d) => OPEN_DISPUTE.includes(d.status));
  const activeBuildProjects = buildProjects.filter((p) => ACTIVE_BUILD.includes(p.status));
  const activeRenovateProjects = renovationProjects.filter((p) => ACTIVE_RENOVATE.includes(p.status));
  const buildReviewsOpen = buildProjects.flatMap((p) => p.reviewRequests).filter((r) => OPEN_REVIEW.includes(r.status));
  const renovateReviewsOpen = renovationProjects.flatMap((p) => p.reviewRequests).filter((r) => OPEN_REVIEW.includes(r.status));
  const quotationsInProgress = renovationProjects.flatMap((p) => p.quotations).filter((q) => !["accepted", "declined", "expired", "withdrawn"].includes(q.status));
  const flaggedAiEvents = state.aiGenerations.filter((g) => g.safetyFlag || g.status === "failed");
  const totalUsers = Object.keys(state.users).length;

  const summaryCards: [string, number, string][] = [
    ["Total active users", totalUsers, "/admin/users"],
    ["Active property listings", mockProperties.length, "/admin/listings"],
    ["Professional applications awaiting review", applicationsAwaitingReview.length, "/admin/professionals"],
    ["Listings awaiting moderation", listingsAwaitingModeration.length, "/admin/listings"],
    ["Open support cases", openSupportCases.length, "/admin/support"],
    ["Open disputes", openDisputes.length, "/admin/disputes"],
    ["Active Build projects", activeBuildProjects.length, "/admin/projects"],
    ["Active Renovate projects", activeRenovateProjects.length, "/admin/projects"],
    ["Professional reviews awaiting action", buildReviewsOpen.length + renovateReviewsOpen.length, "/admin/requests"],
    ["Quotation requests in progress", quotationsInProgress.length, "/admin/quotations"],
    ["Flagged AI events", flaggedAiEvents.length, "/admin/ai"],
  ];

  const expiringCredentials = professionalState.profiles.filter((p) => isExpiringSoon(p.licenceExpiry));
  const overdueReviews = [...buildReviewsOpen, ...renovateReviewsOpen].filter((r) => isOverdue(r.expectedResponseDate));

  const priorityQueues: { label: string; count: number; href: string; description: string }[] = [
    { label: "Professional applications waiting longest", count: applicationsAwaitingReview.length, href: "/admin/professionals", description: applicationsAwaitingReview[0] ? `Oldest: ${applicationsAwaitingReview[0].displayName}` : "None waiting" },
    { label: "Listings awaiting moderation", count: listingsAwaitingModeration.length, href: "/admin/listings", description: "Includes reported listings" },
    { label: "High-priority support cases", count: state.supportCases.filter((c) => (c.priority === "high" || c.priority === "urgent") && OPEN_SUPPORT.includes(c.status)).length, href: "/admin/support", description: "Priority high or urgent" },
    { label: "Disputes requiring response", count: state.disputes.filter((d) => d.status === "response_requested" || d.status === "information_required").length, href: "/admin/disputes", description: "Awaiting a party's response" },
    { label: "Expiring professional credentials", count: expiringCredentials.length, href: "/admin/professionals", description: "Expiring within 30 days" },
    { label: "Flagged or failed AI generations", count: flaggedAiEvents.length, href: "/admin/ai", description: "Safety flag or failure" },
    { label: "Requests overdue for professional response", count: overdueReviews.length, href: "/admin/requests", description: "Past the expected response date" },
  ];

  const filteredAudit = useMemo(() => state.auditLog.filter((entry) => withinRange(entry.at, range, customFrom, customTo)), [state.auditLog, range, customFrom, customTo]);

  return (
    <PageFrame title="Administration overview" description="Platform-wide indicators and priority work across users, professionals, listings, projects and support.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(([name, value, href]) => (
          <Link key={name} href={href}>
            <Card className="p-4 transition-shadow hover:shadow-md">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{name}</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <Card>
          <h3 className="text-lg font-black text-slate-900">Priority work</h3>
          <div className="mt-4 divide-y divide-slate-100">
            {priorityQueues.map((item) => (
              <Link key={item.label} href={item.href} className="flex items-center justify-between gap-4 py-3.5 first:pt-0">
                <div>
                  <p className="font-bold text-slate-800">{item.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
                </div>
                <span className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-black ${item.count ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-400"}`}>{item.count}</span>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-black text-slate-900">Platform activity</h3>
            <Link href="/admin/audit" className="text-sm font-bold text-[#219b31]">View audit log</Link>
          </div>
          <label className="mt-4 block text-xs font-bold text-slate-500">
            Show activity from
            <select className={`${fieldClass} mt-1`} value={range} onChange={(e) => setRange(e.target.value as RangeKey)}>
              <option value="today">Today</option>
              <option value="7d">Last seven days</option>
              <option value="30d">Last thirty days</option>
              <option value="custom">Custom range</option>
            </select>
          </label>
          {range === "custom" && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input type="date" className={fieldClass} value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} aria-label="From date" />
              <input type="date" className={fieldClass} value={customTo} onChange={(e) => setCustomTo(e.target.value)} aria-label="To date" />
            </div>
          )}
          <div className="mt-4 space-y-4">
            {filteredAudit.slice(0, 8).map((entry) => (
              <div key={entry.id} className="border-l-2 border-[#2ec440] pl-3">
                <p className="text-sm font-semibold text-slate-800">{entry.action.replace(/_/g, " ")} · {entry.resourceType}</p>
                {entry.newValueSummary && <p className="mt-0.5 text-xs text-slate-500">{entry.newValueSummary}</p>}
                <p className="mt-1 text-xs text-slate-400">{entry.actorName} · {formatDateTime(entry.at)}</p>
              </div>
            ))}
            {!filteredAudit.length && <p className="text-sm text-slate-500">No platform activity recorded in this range yet. Seeded prototype data appears here as staff take action.</p>}
          </div>
        </Card>
      </div>

      {!state.auditLog.length && !totalUsers && (
        <div className="mt-6">
          <EmptyState title="Prototype data is still light" description="As you review applications, moderate listings and manage cases across the portal, this dashboard fills in with seeded and live prototype activity." />
        </div>
      )}
    </PageFrame>
  );
}
