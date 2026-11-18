// The homes a visitor has ticked to compare (up to four), kept in the browser so the choice survives moving between pages. No account needed.
// Ids are listing ids; a home from the USA has the id "us-<number>" like its page (see lib/zillow/property.ts).

const STORE_KEY = "huzaestate_compare_v1";
export const MAX_COMPARE = 4;

type Listener = () => void;

let ids: string[] | null = null;
const listeners = new Set<Listener>();

function load(): string[] {
  if (ids !== null) return ids;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    ids = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(0, MAX_COMPARE) : [];
  } catch {
    ids = [];
  }
  return ids;
}

function commit(next: string[]) {
  ids = next;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
  } catch {
    // The choice just will not survive a page change.
  }
  listeners.forEach((l) => l());
}

export const CompareStoreEngine = {
  getAll(): string[] {
    return load();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** Ticks or unticks a home. "full" when four are already chosen. */
  toggle(id: string): "added" | "removed" | "full" {
    const current = load();
    if (current.includes(id)) {
      commit(current.filter((x) => x !== id));
      return "removed";
    }
    if (current.length >= MAX_COMPARE) return "full";
    commit([...current, id]);
    return "added";
  },

  remove(id: string): void {
    const current = load();
    if (current.includes(id)) commit(current.filter((x) => x !== id));
  },

  clear(): void {
    if (load().length > 0) commit([]);
  },
};
