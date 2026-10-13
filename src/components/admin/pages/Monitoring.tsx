"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useIsAdministrator } from "@/lib/admin/hooks";
import {
  formatErrorRatio, formatLatency, formatRate, MonitoringStatus, OVERALL_LABEL, parseMonitoringStatus, severityRank,
} from "@/lib/admin/monitoring";
import { Card, EmptyState, PageFrame, RequirePermission, SecondaryButton, StatusPill } from "../ui";

const ACCESS_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";
const REFRESH_MS = 30_000;

const OVERALL_STYLE = {
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-800",
  degraded: "border-amber-200 bg-amber-50 text-amber-800",
  down: "border-red-200 bg-red-50 text-red-800",
} as const;

export function MonitoringPage() {
  const { token } = useAuth();
  const canView = useIsAdministrator();
  const [status, setStatus] = useState<MonitoringStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0); // bumped by the Refresh button and every REFRESH_MS

  useEffect(() => {
    if (!token || !canView) return;
    let cancelled = false;
    fetch(`${ACCESS_API_URL}/auth/admin/monitoring`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        const parsed = res.ok ? parseMonitoringStatus(body) : null;
        if (!parsed) throw new Error(body?.message || body?.error || `Monitoring status unavailable (${res.status}).`);
        return parsed;
      })
      .then((parsed) => {
        if (cancelled) return;
        setStatus(parsed);
        setError(null);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Monitoring status unavailable.");
      });
    return () => {
      cancelled = true;
    };
  }, [token, canView, tick]);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  const prom = status?.prometheus;
  const alerts = [...(prom?.alerts || [])].sort((a, b) => severityRank(a.severity) - severityRank(b.severity));

  return (
    <PageFrame
      title="Monitoring"
      description="Live health of every backend service, firing alerts and headline traffic. Detailed dashboards, logs and request lookup are in Grafana."
      action={
        <div className="flex gap-3">
          <SecondaryButton type="button" onClick={() => setTick((t) => t + 1)}>Refresh</SecondaryButton>
          {status?.grafanaUrl && (
            <a href={status.grafanaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-slate-800">
              Open Grafana
            </a>
          )}
        </div>
      }
    >
      <RequirePermission granted={canView}>
        {error && (
          <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {error}
          </p>
        )}
        {!status && !error && <p className="text-sm text-slate-400">Loading…</p>}
        {status && (
          <div className="space-y-6">
            <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-6 py-5 ${OVERALL_STYLE[status.overall]}`}>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-70">Platform status</p>
                <p className="text-2xl font-black">{OVERALL_LABEL[status.overall]}</p>
              </div>
              <p className="text-xs opacity-70">Updated {new Date(status.generatedAt).toLocaleTimeString()}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Card><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Services up</p>
                <p className="mt-1 text-3xl font-black text-slate-900">{status.services.filter((s) => s.status === "up").length} / {status.services.length}</p></Card>
              <Card><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Traffic</p>
                <p className="mt-1 text-3xl font-black text-slate-900">{prom?.reachable ? formatRate(prom.requestRate) : "Not measured"}</p></Card>
              <Card><p className="text-xs font-bold uppercase tracking-wider text-slate-400">5xx ratio (5 min)</p>
                <p className="mt-1 text-3xl font-black text-slate-900">{prom?.reachable ? formatErrorRatio(prom.errorRatio) : "Not measured"}</p></Card>
            </div>

            <Card>
              <h3 className="text-lg font-black text-slate-900">Services</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400">
                    <th className="py-2 pr-4">Service</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Latency</th><th className="py-2">Detail</th>
                  </tr></thead>
                  <tbody>
                    {status.services.map((s) => (
                      <tr key={s.name} className="border-b border-slate-100 last:border-0">
                        <td className="py-3 pr-4 font-bold text-slate-900">{s.name}</td>
                        <td className="py-3 pr-4"><StatusPill status={s.status === "up" ? "Up" : "Down"} /></td>
                        <td className="py-3 pr-4 text-slate-600">{formatLatency(s.latencyMs)}</td>
                        <td className="py-3 text-slate-500">{s.error || "Healthy"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-black text-slate-900">Alerts</h3>
              {!prom?.configured && (
                <p className="mt-3 text-sm text-slate-500">Prometheus is not configured (<code>PROMETHEUS_URL</code>), so alerts and traffic figures are not available. Service health above is still live.</p>
              )}
              {prom?.configured && !prom.reachable && (
                <p role="alert" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                  Prometheus cannot be reached, so alerts are <strong>not measured</strong> (this is not the same as no alerts). Start the monitoring stack with <code>./scripts/monitoring-up.sh</code>.
                </p>
              )}
              {prom?.reachable && alerts.length === 0 && <div className="mt-3"><EmptyState title="No alerts firing" description="Prometheus is reachable and nothing is currently wrong." /></div>}
              {alerts.length > 0 && (
                <ul className="mt-4 divide-y divide-slate-100">
                  {alerts.map((a, i) => (
                    <li key={`${a.name}-${a.service}-${i}`} className="flex flex-wrap items-center gap-3 py-3">
                      <StatusPill status={a.severity} />
                      <span className="font-bold text-slate-900">{a.name}</span>
                      {a.service && <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{a.service}</span>}
                      <span className="text-sm text-slate-500">{a.summary}</span>
                      {a.state === "pending" && <span className="text-xs font-bold uppercase text-amber-600">pending</span>}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}
      </RequirePermission>
    </PageFrame>
  );
}
