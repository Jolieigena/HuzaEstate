// Types and pure helpers for the administrator Monitoring page (GET /auth/admin/monitoring on access-service).

export type OverallStatus = "healthy" | "degraded" | "down";

export interface ServiceStatus {
  name: string;
  status: "up" | "down";
  latencyMs: number | null;
  httpStatus: number | null;
  error: string | null;
}

export interface MonitoringAlert {
  name: string;
  severity: string;
  service: string | null;
  summary: string;
  state: string;
  since: string | null;
}

export interface MonitoringStatus {
  generatedAt: string;
  overall: OverallStatus;
  services: ServiceStatus[];
  prometheus: { configured: boolean; reachable: boolean; alerts: MonitoringAlert[]; requestRate: number | null; errorRatio: number | null };
  grafanaUrl: string | null;
}

/** The API's answer, validated: anything unexpected is rejected rather than rendered as "healthy". */
export function parseMonitoringStatus(value: unknown): MonitoringStatus | null {
  const v = value as Partial<MonitoringStatus> | null;
  if (!v || typeof v !== "object") return null;
  if (!["healthy", "degraded", "down"].includes(String(v.overall))) return null;
  if (!Array.isArray(v.services) || !v.prometheus || typeof v.prometheus !== "object" || !Array.isArray(v.prometheus.alerts)) return null;
  return v as MonitoringStatus;
}

export const OVERALL_LABEL: Record<OverallStatus, string> = {
  healthy: "All systems operational",
  degraded: "Degraded",
  down: "Platform down",
};

/** "12 ms", "1.4 s", or a dash when the probe never got an answer. */
export function formatLatency(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms)) return "–";
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(Math.round(ms / 100) / 10).toFixed(1)} s`;
}

/** Requests per second; "No traffic" (idle) is distinct from "Not measured" (null). */
export function formatRate(rate: number | null): string {
  if (rate === null) return "Not measured";
  if (rate === 0) return "No traffic";
  return rate < 0.1 ? "<0.1 req/s" : `${rate.toFixed(1)} req/s`;
}

export function formatErrorRatio(ratio: number | null): string {
  if (ratio === null) return "No traffic";
  return `${(ratio * 100).toFixed(ratio > 0 && ratio < 0.001 ? 2 : 1)}%`;
}

export function severityRank(severity: string): number {
  return ({ critical: 0, warning: 1, info: 2 } as Record<string, number>)[severity] ?? 9;
}
