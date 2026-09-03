// Low-level singleton store engine shared by every finance domain service.
// Mirrors the module-level `let projects` + `Set<Listener>` pattern used by
// src/lib/execution/executionService.ts, generalised to the whole
// FinanceStore blob.

import { FinanceStorageService } from "./storage";
import { financeSeed } from "./seed";
import { newId } from "./ids";
import type { FinanceStore, FinanceAuditEvent, FinanceAuditAction, FinanceNotification, FinanceNotificationAudience } from "./types";

type Listener = () => void;

let store: FinanceStore | null = null;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

function ensureLoaded(): FinanceStore {
  if (store !== null) return store;
  if (FinanceStorageService.hasSeeded()) {
    store = FinanceStorageService.loadStore() ?? financeSeed();
  } else {
    const seeded = financeSeed();
    FinanceStorageService.saveStore(seeded);
    FinanceStorageService.markSeeded();
    store = seeded;
  }
  return store;
}

function persist() {
  if (store) FinanceStorageService.saveStore(store);
}

export const FinanceStoreEngine = {
  getStore(): FinanceStore {
    return ensureLoaded();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /**
   * Runs a synchronous mutator against a fresh deep clone of the store, then
   * swaps it in, persists and notifies. Domain services are written in an
   * in-place-mutation style (`record.status = "..."`) for readability, so
   * without cloning first, a changed record would keep the SAME object
   * identity it had before the change — `useSyncExternalStore`-based hooks
   * (see finance/hooks.ts) rely on identity changing exactly when content
   * changes to know a re-render is needed, and a UI reading a record via a
   * hook that captured it before the mutation would silently never see the
   * update. Cloning here is the single place that guarantee is made, so no
   * individual service function has to worry about it.
   */
  mutate<T>(fn: (s: FinanceStore) => T): T {
    const current = ensureLoaded();
    const draft: FinanceStore = JSON.parse(JSON.stringify(current));
    const result = fn(draft);
    store = draft;
    persist();
    notifyListeners();
    return result;
  },

  appendAudit(
    action: FinanceAuditAction,
    actorAccountId: string,
    resourceType: FinanceAuditEvent["resourceType"],
    resourceId: string,
    summary: string,
    reason?: string
  ): FinanceAuditEvent {
    const s = ensureLoaded();
    const event: FinanceAuditEvent = { id: newId("faudit"), action, actorAccountId, resourceType, resourceId, summary, reason, at: new Date().toISOString() };
    // Append-only: never mutate or remove existing entries.
    s.auditEvents = [...s.auditEvents, event];
    persist();
    notifyListeners();
    return event;
  },

  notifyAccount(audience: FinanceNotificationAudience, accountId: string, title: string, body: string, linkHref: string): FinanceNotification {
    const s = ensureLoaded();
    const notification: FinanceNotification = { id: newId("fnotif"), audience, accountId, title, body, linkHref, read: false, createdAt: new Date().toISOString() };
    s.notifications = [...s.notifications, notification];
    persist();
    notifyListeners();
    return notification;
  },
};
