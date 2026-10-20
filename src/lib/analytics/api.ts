// access-service client for the visitor analytics: the public page view report, and the administrator's reports.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";

/** Visits are kept for this many days, so a report cannot reach further back. */
export const RETENTION_DAYS = 90;

/** The period a report covers: the last N days (today included), or from one day to another (both included). */
export type AnalyticsRange = { days: number } | { from: string; to: string };

/** What a report is narrowed to. Every field is optional; together they are how an admin clicks through to the detail. */
export interface AnalyticsFilters {
  /** Two-letter country code. */
  country?: string;
  city?: string;
  device?: "mobile" | "desktop";
  /** A referring site, or "direct". */
  referrer?: string;
  /** A page as stored, for example "/shop" or "/properties/:id". */
  page?: string;
  /** Signed-in visitors or guests. */
  audience?: "member" | "guest";
  /** One day inside the period, "YYYY-MM-DD". */
  day?: string;
}

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

export interface PageRow {
  page: string;
  views: number;
  unique: number;
}

export interface Audience {
  views: number;
  /** Accounts for signed-in visitors, addresses for guests. */
  people: number;
}

export interface AnalyticsSummary {
  /** The period actually covered, which can be shorter than asked for (never beyond the days data is kept). */
  days: number;
  from: string;
  to: string;
  filters: AnalyticsFilters;
  totals: { visits: number; uniqueVisitors: number; countries: number; cities: number; unknownLocation: number };
  /** Signed in and guests, not narrowed by the signed-in choice itself so both stay visible while one is picked. */
  audience: { member: Audience; guest: Audience };
  countries: CountryRow[];
  cities: CityRow[];
  points: MapPoint[];
  pages: PageRow[];
  daily: { date: string; visits: number; unique: number }[];
  devices: { mobile?: number; desktop?: number };
  referrers: { host: string; visits: number }[];
  /** Visits that arrived without a usable visitor address and so were not counted: a proxy in front of the server is not passing it on. */
  withoutAddress: number;
}

export interface AccountRef {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface VisitorRow {
  id: string;
  ip: string;
  /** True once the address has been shortened (last part removed) because the visitor was last seen over 30 days ago. */
  shortened: boolean;
  views: number;
  /** How many of the views were while signed in. */
  memberViews: number;
  firstSeen: string;
  lastSeen: string;
  country?: string;
  countryCode?: string;
  city?: string;
  device: "mobile" | "desktop";
  /** The accounts that were signed in from this address in the period. */
  accounts: AccountRef[];
}

export interface VisitorDetail {
  visitor: { id: string; ip: string; shortened: boolean; country?: string; countryCode?: string; region?: string; city?: string; device: "mobile" | "desktop"; firstSeen: string; lastSeen: string };
  views: { at: string; page: string; referrer?: string; kind: "guest" | "member"; account?: AccountRef }[];
  from: string;
  to: string;
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

/** "days=30" or "from=2026-10-01&to=2026-10-20", then each filter that is set. */
export function reportParams(range: AnalyticsRange, filters: AnalyticsFilters = {}): URLSearchParams {
  const params = "days" in range ? new URLSearchParams({ days: String(range.days) }) : new URLSearchParams({ from: range.from, to: range.to });
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, String(value));
  return params;
}

export const AnalyticsApi = {
  summary: (token: string, range: AnalyticsRange, filters: AnalyticsFilters = {}) => get<AnalyticsSummary>(`/analytics/summary?${reportParams(range, filters).toString()}`, token),
  visitors: (token: string, query: { range: AnalyticsRange; filters?: AnalyticsFilters; search?: string; page?: number; limit?: number }) => {
    const params = reportParams(query.range, query.filters);
    if (query.search) params.set("search", query.search);
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));
    return get<{ visitors: VisitorRow[]; total: number; page: number; limit: number }>(`/analytics/visitors?${params.toString()}`, token);
  },
  visitor: (token: string, id: string, range: AnalyticsRange) => get<VisitorDetail>(`/analytics/visitors/${encodeURIComponent(id)}?${reportParams(range).toString()}`, token),
};

/** Tells the server a public page was opened. Never throws and never waits for an answer: the page must not depend on it. Sends the
 *  page, the site the visitor came from and, when signed in, the sign-in (so the view is counted as a member's); the server reads the
 *  visitor's address itself. */
export function reportPageView(path: string, token?: string | null): void {
  try {
    void fetch(`${API_URL}/analytics/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ path, referrer: typeof document !== "undefined" ? document.referrer : "" }),
      keepalive: true,
      credentials: "omit",
    }).catch(() => undefined);
  } catch {
    // never affects the page
  }
}
