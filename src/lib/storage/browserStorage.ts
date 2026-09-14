/**
 * Safe accessors for prototype data stored in the browser. Keeping the
 * try/catch behavior here makes feature storage modules small and consistent.
 */
export function canUseBrowserStorage(testKey: string): boolean {
  try {
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function readBrowserJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeBrowserJson<T>(key: string, value: T): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function readBrowserFlag(key: string, fallback = false): boolean {
  try {
    return window.localStorage.getItem(key) === "true";
  } catch {
    return fallback;
  }
}

export function writeBrowserFlag(key: string): void {
  try {
    window.localStorage.setItem(key, "true");
  } catch {
    // Storage is optional in this frontend prototype.
  }
}
