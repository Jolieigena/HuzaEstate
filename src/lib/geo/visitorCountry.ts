// The rules for remembering and looking up where a visitor is. Kept free of React so they can be tested on their own.

/** v2: the old key held a bare country code that was never refreshed, so a visitor who once opened the site in Rwanda kept
 *  Rwanda for good, whichever country they were in later. */
export const VISITOR_COUNTRY_KEY = "huzaestate_visitor_country_v2";

/** Keys earlier versions wrote. Nothing reads them any more, so they are removed. */
export const LEGACY_COUNTRY_KEYS = ["huzaestate_visitor_country_v1", "huzaestate_selected_country_v1"];

/** How long a remembered country is trusted before the visitor is looked up again. Short enough that someone who travels
 *  sees their new country the same day. */
export const MAX_AGE_MS = 6 * 60 * 60 * 1000;

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface CachedCountry {
  code: string;
  /** Still within MAX_AGE_MS, so no new lookup is needed. */
  fresh: boolean;
}

export function readCachedCountry(storage: StorageLike, now: number = Date.now()): CachedCountry | null {
  try {
    const raw = storage.getItem(VISITOR_COUNTRY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { code?: unknown; at?: unknown };
    if (typeof parsed.code !== "string" || !/^[A-Z]{2}$/.test(parsed.code) || typeof parsed.at !== "number") return null;
    return { code: parsed.code, fresh: now - parsed.at >= 0 && now - parsed.at < MAX_AGE_MS };
  } catch {
    return null;
  }
}

export function writeCachedCountry(storage: StorageLike, code: string, now: number = Date.now()): void {
  try {
    storage.setItem(VISITOR_COUNTRY_KEY, JSON.stringify({ code, at: now }));
  } catch {
    // best effort only
  }
}

export function clearLegacyCountryKeys(storage: StorageLike): void {
  for (const key of LEGACY_COUNTRY_KEYS) {
    try {
      storage.removeItem(key);
    } catch {
      // best effort only
    }
  }
}

const PROVIDERS: { url: string; field: string }[] = [
  { url: "https://ipapi.co/json/", field: "country_code" },
  { url: "https://api.country.is/", field: "country" },
];

/** The two-letter code of the country the visitor is in, from the first lookup service that answers; null when none does.
 *  A second service is tried because the first one limits how often it answers. */
export async function lookupCountryCode(fetchFn: typeof fetch): Promise<string | null> {
  for (const provider of PROVIDERS) {
    try {
      const res = await fetchFn(provider.url);
      if (!res.ok) continue;
      const data = (await res.json()) as Record<string, unknown> | null;
      const code = String(data?.[provider.field] ?? "").toUpperCase();
      if (/^[A-Z]{2}$/.test(code)) return code;
    } catch {
      // try the next service
    }
  }
  return null;
}
