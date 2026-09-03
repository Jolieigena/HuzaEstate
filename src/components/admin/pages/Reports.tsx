"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useAllBuildProjects, useAllRenovationProjects } from "@/lib/admin/crossModule";
import { useAdminState, useHasPermission } from "@/lib/admin/hooks";
import { useProfessionalState } from "@/lib/professional/hooks";
import { Card, PageFrame, PrimaryButton, RequirePermission, SecondaryButton } from "../ui";

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function BreakdownChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-2.5" role="img" aria-label={data.map((d) => `${d.label}: ${d.value}`).join(", ")}>
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-32 flex-shrink-0 truncate text-xs font-semibold text-slate-600" title={d.label}>{d.label}</span>
          <div className="h-3 flex-grow overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[#2ec440]" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          <span className="w-8 flex-shrink-0 text-right text-xs font-bold text-slate-700">{d.value}</span>
        </div>
      ))}
      {!data.length && <p className="text-sm text-slate-500">No data yet.</p>}
    </div>
  );
}

function ReportSection({ title, data, exportFilename }: { title: string; data: { label: string; value: number }[]; exportFilename: string }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-black text-slate-900">{title}</h3>
        <button type="button" onClick={() => downloadCsv(exportFilename, [["Category", "Count"], ...data.map((d) => [d.label, d.value])])} className="text-xs font-bold text-[#219b31] hover:underline">
          Export CSV
        </button>
      </div>
      <div className="mt-4">
        <BreakdownChart data={data} />
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{title} — accessible data table</caption>
          <thead>
            <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wide text-slate-400">
              <th scope="col" className="py-2">Category</th>
              <th scope="col" className="py-2 text-right">Count</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label} className="border-b border-slate-50">
                <td className="py-2 font-semibold text-slate-700">{d.label}</td>
                <td className="py-2 text-right text-slate-700">{d.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function daysSince(iso: string) {
  return (Date.now() - new Date(iso).getTime()) / 86400000;
}

function countBy<T>(items: T[], key: (item: T) => string): { label: string; value: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([label, value]) => ({ label: label.replace(/_/g, " "), value })).sort((a, b) => b.value - a.value);
}

export function ReportsPage() {
  const { account } = useAuth();
  const state = useAdminState();
  const canView = useHasPermission(account?.id, "reports.view");
  const canExport = useHasPermission(account?.id, "reports.export");
  const professionalState = useProfessionalState();
  const buildProjects = useAllBuildProjects();
  const renovationProjects = useAllRenovationProjects();
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  const rangeDays = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : Infinity;
  const withinRange = (iso: string) => rangeDays === Infinity || daysSince(iso) <= rangeDays;

  const users = Object.values(state.users).filter((u) => withinRange(u.registeredAt));
  const registrationsByType = useMemo(() => countBy(users, (u) => u.accountType), [users]);
  const roleDistribution = useMemo(() => countBy(Object.values(state.users), (u) => u.accountType), [state]);
  const listingsByStatus = useMemo(() => {
    const counts = new Map<string, number>();
    for (const [, record] of Object.entries(state.listingModeration)) counts.set(record.status, (counts.get(record.status) ?? 0) + 1);
    const publishedCount = 80 - Object.keys(state.listingModeration).length + [...counts.entries()].filter(([s]) => s === "published").reduce((sum, [, c]) => sum + c, 0);
    counts.set("published", publishedCount);
    return Array.from(counts.entries()).map(([label, value]) => ({ label: label.replace(/_/g, " "), value })).sort((a, b) => b.value - a.value);
  }, [state]);
  const applicationsByStatus = useMemo(() => countBy(professionalState.profiles, (p) => p.status), [professionalState]);
  const buildByStatus = useMemo(() => countBy(buildProjects, (p) => p.status), [buildProjects]);
  const renovateByStatus = useMemo(() => countBy(renovationProjects, (p) => p.status), [renovationProjects]);
  const reviewsByStatus = useMemo(() => countBy([...buildProjects.flatMap((p) => p.reviewRequests), ...renovationProjects.flatMap((p) => p.reviewRequests)], (r) => r.status), [buildProjects, renovationProjects]);
  const quotationsByStatus = useMemo(() => countBy(renovationProjects.flatMap((p) => p.quotations), (q) => q.status), [renovationProjects]);
  const supportByCategory = useMemo(() => countBy(state.supportCases, (c) => c.category), [state]);
  const disputesByCategory = useMemo(() => countBy(state.disputes, (d) => d.category), [state]);
  const aiByStatus = useMemo(() => countBy(state.aiGenerations, (g) => g.status), [state]);

  const verificationTurnaroundDays = useMemo(() => {
    const decided = professionalState.profiles.filter((p) => ["approved", "rejected"].includes(p.status) && p.applicationSubmittedAt);
    if (!decided.length) return 0;
    const total = decided.reduce((sum, p) => sum + daysSince(p.applicationSubmittedAt as string), 0);
    return Math.round(total / decided.length);
  }, [professionalState]);

  const totalDocuments = buildProjects.reduce((s, p) => s + p.documents.length, 0) + renovationProjects.reduce((s, p) => s + p.documents.length, 0);

  return (
    <PageFrame
      title="Reports"
      description="Platform-wide reporting across users, listings, projects, professionals, support and AI. Seeded prototype records — not production analytics."
      action={
        <div className="flex items-center gap-2">
          <SecondaryButton onClick={() => window.print()}>Printable report</SecondaryButton>
          {canExport && (
            <PrimaryButton
              onClick={() =>
                downloadCsv("huzaestate-summary-report.csv", [
                  ["Metric", "Value"],
                  ["Total users", Object.keys(state.users).length],
                  ["Storage usage (documents)", totalDocuments],
                  ["Average verification turnaround (days)", verificationTurnaroundDays],
                ])
              }
            >
              Export summary (CSV)
            </PrimaryButton>
          )}
        </div>
      }
    >
      <RequirePermission granted={canView}>
        <Card className="mb-6 max-w-xs">
          <label className="text-sm font-bold text-slate-700">
            Date range
            <select className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900" value={range} onChange={(e) => setRange(e.target.value as typeof range)}>
              <option value="7d">Last seven days</option>
              <option value="30d">Last thirty days</option>
              <option value="90d">Last ninety days</option>
              <option value="all">All time</option>
            </select>
          </label>
        </Card>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Registrations in range</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{users.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Avg. verification turnaround</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{verificationTurnaroundDays}d</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Storage usage (documents)</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{totalDocuments}</p>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ReportSection title="User registrations (in range)" data={registrationsByType} exportFilename="registrations-by-type.csv" />
          <ReportSection title="User role distribution" data={roleDistribution} exportFilename="role-distribution.csv" />
          <ReportSection title="Listings by status" data={listingsByStatus} exportFilename="listings-by-status.csv" />
          <ReportSection title="Professional applications by status" data={applicationsByStatus} exportFilename="applications-by-status.csv" />
          <ReportSection title="Build projects by status" data={buildByStatus} exportFilename="build-projects-by-status.csv" />
          <ReportSection title="Renovation projects by status" data={renovateByStatus} exportFilename="renovate-projects-by-status.csv" />
          <ReportSection title="Review requests by status" data={reviewsByStatus} exportFilename="reviews-by-status.csv" />
          <ReportSection title="Quotation requests by status" data={quotationsByStatus} exportFilename="quotations-by-status.csv" />
          <ReportSection title="Support cases by category" data={supportByCategory} exportFilename="support-by-category.csv" />
          <ReportSection title="Disputes by category" data={disputesByCategory} exportFilename="disputes-by-category.csv" />
          <ReportSection title="AI generation success and failure" data={aiByStatus} exportFilename="ai-generations-by-status.csv" />
        </div>
      </RequirePermission>
    </PageFrame>
  );
}
