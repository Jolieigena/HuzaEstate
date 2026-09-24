// A signed-in user's saved listings, kept on the server (property-service /favorites) so they
// follow the account across devices. This module only holds the in-memory copy and talks to
// the API; hooks.ts wires it to the current session.

const PROPERTY_API_URL = process.env.NEXT_PUBLIC_PROPERTY_API_URL || "http://localhost:8081/api/property-service";

type Listener = () => void;

let ids: string[] = [];
let loadedFor: string | null = null;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

export const FavoritesStoreEngine = {
  getAll(): string[] {
    return ids;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** Loads (or clears, when signed out) the saved ids for the current session. */
  async sync(token: string | null): Promise<void> {
    if (!token) {
      if (ids.length || loadedFor) {
        ids = [];
        loadedFor = null;
        notify();
      }
      return;
    }
    if (loadedFor === token) return;
    loadedFor = token;
    try {
      const res = await fetch(`${PROPERTY_API_URL}/favorites`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok && loadedFor === token) {
        ids = ((await res.json()).propertyIds as string[]) ?? [];
        notify();
      }
    } catch {
      loadedFor = null;
    }
  },

  /** Saves or unsaves, updating the UI immediately and rolling back if the server refuses. */
  async toggle(token: string, propertyId: string): Promise<{ ok: true; saved: boolean } | { ok: false; error: string }> {
    const wasSaved = ids.includes(propertyId);
    ids = wasSaved ? ids.filter((id) => id !== propertyId) : [propertyId, ...ids];
    notify();
    try {
      const res = await fetch(`${PROPERTY_API_URL}/favorites/${encodeURIComponent(propertyId)}`, {
        method: wasSaved ? "DELETE" : "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("rejected");
      return { ok: true, saved: !wasSaved };
    } catch {
      ids = wasSaved ? [propertyId, ...ids] : ids.filter((id) => id !== propertyId);
      notify();
      return { ok: false, error: "Could not update your saved homes. Please try again." };
    }
  },
};
