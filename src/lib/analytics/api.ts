// access-service client for the landing page visitor analytics: the public visit report, and the administrator's reports.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";

/** Visits are kept for this many days, so a report cannot reach further back. */
export const RETENTION_DAYS = 90;

/** The period a report covers: the last N days (today included), or from one day to another (both included). */
export type AnalyticsRange = { days: number } | { from: string; to: string };

export interface MapPoint {
  lat: number;
  lon: number;
  visits: number;
  unique: number;
  city?: string;
  country?: string;
  code?: string;
}

export interface CountryRow {
  code: string;
  country: string;
  visits: number;
  unique: number;
}

export interface CityRow {
  city: string;
  country?: string;
  code?: string;
  visits: number;
  unique: number;
}

export interface AnalyticsSummary {
  /** The period actually covered, which can be shorter than asked for (never beyond the days data is kept). */
  days: number;
  from: string;
  to: string;
  totals: { visits: number; uniqueVisitors: number; countries: number; cities: number; unknownLocation: number };
  countries: CountryRow[];
  cities: CityRow[];
  points: MapPoint[];
  daily: { date: string; visits: number; unique: number }[];
  devices: { mobile?: number; desktop?: number };
  referrers: { host: string; visits: number }[];
  /** Visits that arrived without a usable visitor address and so were not counted: a proxy in front of the server is not passing it on. */
  withoutAddress: number;
}

export interface VisitorRow {
  id: string;
  ip: string;
  /** True once the address has been shortened (last part removed) because the visitor was last seen over 30 days ago. */
  shortened: boolean;
  visits: number;
  firstSeen: string;
  lastSeen: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  device: "mobile" | "desktop";
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function get<T>(path: string, token: string): Promise<Result<T>> {
  try {
    const res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      let message = "Something went wrong. Please try again.";
      try {
        const data = await res.json();
        message = Array.isArray(data?.message) ? data.message.join(" ") : data?.message || data?.error || message;
      } catch {
        // keep the default message
      }
      return { ok: false, error: message };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
  }
}

/** "days=30" or "from=2026-10-01&to=2026-10-20". */
export function rangeParams(range: AnalyticsRange): URLSearchParams {
  return "days" in range ? new URLSearchParams({ days: String(range.days) }) : new URLSearchParams({ from: range.from, to: range.to });
}

export const AnalyticsApi = {
  summary: (token: string, range: AnalyticsRange) => get<AnalyticsSummary>(`/analytics/summary?${rangeParams(range).toString()}`, token),
  visitors: (token: string, query: { range: AnalyticsRange; search?: string; page?: number; limit?: number }) => {
    const params = rangeParams(query.range);
    if (query.search) params.set("search", query.search);
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));
    return get<{ visitors: VisitorRow[]; total: number; page: number; limit: number }>(`/analytics/visitors?${params.toString()}`, token);
  },
};

/** Tells the server this landing page was opened. Never throws and never waits for an answer: the page must not depend on it.
 *  Sends only the page and the site the visitor came from; the server reads the visitor's address itself. */
export function reportLandingVisit(path: "/" | "/home"): void {
  try {
    void fetch(`${API_URL}/analytics/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, referrer: typeof document !== "undefined" ? document.referrer : "" }),
      keepalive: true,
      credentials: "omit",
    }).catch(() => undefined);
  } catch {
    // never affects the page
  }
}
