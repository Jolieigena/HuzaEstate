// Singleton store engine for a buyer's saved property searches, mirroring
// src/lib/tours/store.ts. Everyone's list lives in the browser; a signed-in account's list is also kept on the server
// (property-service /saved-searches) so it follows them across devices and so they can be told when a new listing matches.

import { PROPERTY_TYPE_OPTIONS } from "@/lib/properties/types";
import { SavedSearchesStorageService } from "./storage";
import type { SavedSearch, SavedSearchCriteria } from "./types";

const PROPERTY_API_URL = process.env.NEXT_PUBLIC_PROPERTY_API_URL || "http://localhost:8081/api/property-service";

type Listener = () => void;

/** Soft cap so the list can't grow unbounded in localStorage — oldest drops first. */
const MAX_SAVED_SEARCHES = 20;

let searches: SavedSearch[] | null = null;
let loadedFor: string | null = null;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

function ensureLoaded(): SavedSearch[] {
  if (searches !== null) return searches;
  searches = SavedSearchesStorageService.load();
  return searches;
}

function persist() {
  if (searches) SavedSearchesStorageService.save(searches);
}

function isEmptyCriteria(c: SavedSearchCriteria): boolean {
  return (
    !c.searchTerm &&
    c.filterType === "all" &&
    c.propertyTypeFilter === "all" &&
    !c.minPrice &&
    !c.maxPrice &&
    !c.bedsFilter &&
    !c.bathsFilter &&
    !c.minSqm &&
    !c.maxSqm &&
    !c.city &&
    !c.keywords
  );
}

function sameCriteria(a: SavedSearchCriteria, b: SavedSearchCriteria): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** The four kinds of home a search asks for, for the server to match on. Older searches only have the typed labels, so they are mapped here. */
function bucketsOf(c: SavedSearchCriteria): string[] {
  if (c.propertyTypes) return c.propertyTypes;
  if (!c.propertyTypeFilter || c.propertyTypeFilter === "all") return [];
  const labels = c.propertyTypeFilter.split(", ").filter(Boolean);
  return Array.from(new Set(labels.map((l) => PROPERTY_TYPE_OPTIONS.find((o) => o.label === l)?.bucket).filter((b): b is NonNullable<typeof b> => Boolean(b))));
}

/** Builds a short human-readable label from filter criteria, e.g.
 *  "Kigali · For sale · 3+ beds". Falls back to "All properties". */
export function describeCriteria(c: SavedSearchCriteria): string {
  const parts: string[] = [];
  if (c.searchTerm) parts.push(c.searchTerm);
  if (c.filterType !== "all") parts.push(c.filterType === "sale" ? "For sale" : "For rent");
  if (c.propertyTypeFilter !== "all") parts.push(c.propertyTypeFilter.charAt(0).toUpperCase() + c.propertyTypeFilter.slice(1));
  if (c.minPrice || c.maxPrice) parts.push(`$${c.minPrice || "0"}–$${c.maxPrice || "any"}`);
  if (c.bedsFilter) parts.push(`${c.bedsFilter}+ beds`);
  if (c.bathsFilter) parts.push(`${c.bathsFilter}+ baths`);
  if (c.minSqm || c.maxSqm) parts.push(`${c.minSqm || "0"}–${c.maxSqm || "any"} sqm`);
  if (c.city) parts.push(c.city);
  if (c.keywords) parts.push(c.keywords);
  return parts.length ? parts.join(" · ") : "All properties";
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" });

/** Sends one search to the account (idempotent). True when the server accepted it. */
async function pushToServer(token: string, s: SavedSearch): Promise<boolean> {
  try {
    const res = await fetch(`${PROPERTY_API_URL}/saved-searches/${encodeURIComponent(s.id)}`, {
      method: "PUT",
      headers: auth(token),
      body: JSON.stringify({ label: s.label, criteria: { ...s.criteria, propertyTypes: bucketsOf(s.criteria) }, priceCurrency: s.priceCurrency ?? "USD", alerts: s.alerts === true, createdAt: s.createdAt }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function markSynced(id: string) {
  const current = ensureLoaded();
  searches = current.map((s) => (s.id === id ? { ...s, synced: true } : s));
  persist();
  notifyListeners();
}

export const SavedSearchesStoreEngine = {
  getAll(): SavedSearch[] {
    return ensureLoaded();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** Brings the browser's list and the signed-in account's list together, and drops the account's searches from this browser on sign-out. */
  async sync(token: string | null): Promise<void> {
    const local = ensureLoaded();
    if (!token) {
      if (loadedFor) {
        loadedFor = null;
        searches = local.filter((s) => !s.synced);
        persist();
        notifyListeners();
      }
      return;
    }
    if (loadedFor === token) return;
    loadedFor = token;
    try {
      const res = await fetch(`${PROPERTY_API_URL}/saved-searches`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok || loadedFor !== token) {
        if (!res.ok) loadedFor = null;
        return;
      }
      const remote = ((await res.json()).searches as SavedSearch[]) ?? [];
      const remoteIds = new Set(remote.map((r) => r.id));
      const current = ensureLoaded();
      // Searches saved here while signed out are sent up (with alerts off: nobody asked for them); ones the account no longer has were deleted elsewhere.
      const toPush = current.filter((s) => !s.synced && !remoteIds.has(s.id));
      const kept = toPush.map((s) => ({ ...s, alerts: false, synced: true }));
      const fromAccount = remote.map((r) => ({ ...r, synced: true }));
      searches = [...fromAccount, ...kept].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, MAX_SAVED_SEARCHES);
      persist();
      notifyListeners();
      for (const s of toPush) {
        const ok = await pushToServer(token, { ...s, alerts: false });
        if (!ok) {
          // Not accepted: keep it local-only so the next sync tries again.
          searches = (searches ?? []).map((x) => (x.id === s.id ? { ...x, synced: false } : x));
        }
      }
      persist();
      notifyListeners();
    } catch {
      loadedFor = null;
    }
  },

  /** Saves the current criteria unless it's empty or already saved. When signed in it is also saved to the account, with alerts on.
   *  Returns the outcome so the caller can show the right feedback. */
  save(criteria: SavedSearchCriteria, options: { token?: string | null; priceCurrency?: string } = {}): "saved" | "duplicate" | "empty" {
    if (isEmptyCriteria(criteria)) return "empty";
    const current = ensureLoaded();
    if (current.some((s) => sameCriteria(s.criteria, criteria))) return "duplicate";

    const entry: SavedSearch = {
      id: `search_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      label: describeCriteria(criteria),
      criteria,
      createdAt: new Date().toISOString(),
      priceCurrency: options.priceCurrency ?? "USD",
      alerts: !!options.token,
    };
    searches = [entry, ...current].slice(0, MAX_SAVED_SEARCHES);
    persist();
    notifyListeners();
    if (options.token) void pushToServer(options.token, entry).then((ok) => ok && markSynced(entry.id));
    return "saved";
  },

  remove(id: string, token?: string | null): void {
    const current = ensureLoaded();
    const target = current.find((s) => s.id === id);
    if (!target) return;
    searches = current.filter((s) => s.id !== id);
    persist();
    notifyListeners();
    if (token && target.synced) {
      void fetch(`${PROPERTY_API_URL}/saved-searches/${encodeURIComponent(id)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }).catch(() => undefined);
    }
  },

  /** Turns the alert for one search on or off, updating the list at once and rolling back if the account refuses. */
  async setAlerts(id: string, alerts: boolean, token: string): Promise<boolean> {
    const current = ensureLoaded();
    const target = current.find((s) => s.id === id);
    if (!target) return false;
    const before = target.alerts === true;
    const apply = (value: boolean) => {
      searches = ensureLoaded().map((s) => (s.id === id ? { ...s, alerts: value } : s));
      persist();
      notifyListeners();
    };
    apply(alerts);
    // A search that never reached the account is sent first (with the alert setting), and the change counts as done once it is there.
    const ok = target.synced
      ? await fetch(`${PROPERTY_API_URL}/saved-searches/${encodeURIComponent(id)}`, { method: "PATCH", headers: auth(token), body: JSON.stringify({ alerts }) }).then((r) => r.ok).catch(() => false)
      : await pushToServer(token, { ...target, alerts });
    if (!ok) {
      apply(before);
      return false;
    }
    if (!target.synced) markSynced(id);
    return true;
  },
};
