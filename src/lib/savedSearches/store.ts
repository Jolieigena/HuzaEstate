// Singleton store engine for a buyer's saved property searches, mirroring
// src/lib/tours/store.ts.

import { SavedSearchesStorageService } from "./storage";
import type { SavedSearch, SavedSearchCriteria } from "./types";

type Listener = () => void;

/** Soft cap so the list can't grow unbounded in localStorage — oldest drops first. */
const MAX_SAVED_SEARCHES = 20;

let searches: SavedSearch[] | null = null;
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

export const SavedSearchesStoreEngine = {
  getAll(): SavedSearch[] {
    return ensureLoaded();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** Saves the current criteria unless it's empty or already saved.
   *  Returns the outcome so the caller can show the right feedback. */
  save(criteria: SavedSearchCriteria): "saved" | "duplicate" | "empty" {
    if (isEmptyCriteria(criteria)) return "empty";
    const current = ensureLoaded();
    if (current.some((s) => sameCriteria(s.criteria, criteria))) return "duplicate";

    const entry: SavedSearch = {
      id: `search_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      label: describeCriteria(criteria),
      criteria,
      createdAt: new Date().toISOString(),
    };
    searches = [entry, ...current].slice(0, MAX_SAVED_SEARCHES);
    persist();
    notifyListeners();
    return "saved";
  },

  remove(id: string): void {
    const current = ensureLoaded();
    if (!current.some((s) => s.id === id)) return;
    searches = current.filter((s) => s.id !== id);
    persist();
    notifyListeners();
  },
};
