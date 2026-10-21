// The accounts signed in on this device, so someone can switch between them without signing in again (like Google's account menu).
// Kept in this browser only. A saved account holds its sign-in token while that is valid; once it has expired or the server
// refuses it, the account is "locked" (name and email only) and asks for the password again. No password is ever stored.

export const ACCOUNTS_STORAGE_KEY = "huzaestate_accounts";
export const MAX_SAVED_ACCOUNTS = 5;

export interface SavedAccount {
  id: string;
  name: string;
  email: string;
  /** The sign-in token, or null once it has expired or the account was locked. */
  token: string | null;
  lastUsed: number;
}

/** What the screens get: never the token. */
export interface SavedAccountView {
  id: string;
  name: string;
  email: string;
  active: boolean;
  locked: boolean;
}

/** When a token expires, read from its payload. Only a convenience for tidying up: the server decides whether a token is valid. */
export function tokenExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

const isExpired = (token: string) => {
  const exp = tokenExpiry(token);
  return exp !== null && exp <= Date.now();
};

export function readSaved(): SavedAccount[] {
  try {
    const raw = JSON.parse(localStorage.getItem(ACCOUNTS_STORAGE_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    const list: SavedAccount[] = [];
    for (const item of raw) {
      if (!item || typeof item.id !== "string" || typeof item.email !== "string" || typeof item.name !== "string") continue;
      const token = typeof item.token === "string" && item.token && !isExpired(item.token) ? item.token : null;
      list.push({ id: item.id, name: item.name.slice(0, 160), email: item.email.slice(0, 254), token, lastUsed: Number(item.lastUsed) || 0 });
    }
    return list.slice(0, MAX_SAVED_ACCOUNTS);
  } catch {
    return [];
  }
}

export function writeSaved(list: SavedAccount[]): void {
  try {
    if (list.length === 0) localStorage.removeItem(ACCOUNTS_STORAGE_KEY);
    else localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // saving accounts is a convenience; signing in still works without it
  }
}

/** Adds the account, or refreshes it when already saved. When the list is full the least recently used account that is not this one is dropped. */
export function upsertSaved(list: SavedAccount[], who: { id: string; name: string; email: string }, token: string): SavedAccount[] {
  const entry: SavedAccount = { id: who.id, name: who.name, email: who.email, token, lastUsed: Date.now() };
  const rest = list.filter((a) => a.id !== who.id);
  while (rest.length >= MAX_SAVED_ACCOUNTS) {
    const oldest = rest.reduce((a, b) => (a.lastUsed <= b.lastUsed ? a : b));
    rest.splice(rest.indexOf(oldest), 1);
  }
  return [entry, ...rest];
}

export const lockSaved = (list: SavedAccount[], id: string): SavedAccount[] => list.map((a) => (a.id === id ? { ...a, token: null } : a));
export const lockSavedByToken = (list: SavedAccount[], token: string): SavedAccount[] => list.map((a) => (a.token === token ? { ...a, token: null } : a));
export const removeSaved = (list: SavedAccount[], id: string): SavedAccount[] => list.filter((a) => a.id !== id);

export const viewOf = (list: SavedAccount[], activeId: string | undefined): SavedAccountView[] =>
  list.map((a) => ({ id: a.id, name: a.name, email: a.email, active: a.id === activeId, locked: a.token === null }));
