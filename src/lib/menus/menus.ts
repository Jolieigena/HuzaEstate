"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";

/** The icon on a link the administrator added. */
export const CUSTOM_LINK_ICON = "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1";

export const MENU_IDS = ["main", "footer-explore", "footer-company", "footer-account", "admin", "customer", "owner", "professional", "supplier", "org-admin", "designs-tabs", "professionals-filters", "property-types"] as const;
export type MenuId = (typeof MENU_IDS)[number];

/** One saved line of a menu: a link the site already has (matched by `key`) or a custom link the administrator added. */
export interface MenuEntry {
  key: string;
  label: string;
  href?: string;
  hidden?: boolean;
  custom?: boolean;
}
export type MenuOverrides = Partial<Record<MenuId, MenuEntry[]>>;

/** The footer's own words and links the administrator set (each one optional: a missing one means the site's own is used). */
export interface SiteSettings {
  tagline?: string;
  social?: { instagram?: string; facebook?: string; x?: string; linkedin?: string };
  headings?: { explore?: string; company?: string; account?: string };
}

let cache: MenuOverrides | null = null;
let siteCache: SiteSettings | null = null;
let pending: Promise<void> | null = null;
const listeners = new Set<() => void>();

function publish(next: MenuOverrides) {
  cache = next;
  listeners.forEach((listener) => listener());
}

async function load(): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/menus`);
    if (!res.ok) return;
    const data = await res.json();
    siteCache = (data.site ?? {}) as SiteSettings;
    publish((data.menus ?? {}) as MenuOverrides);
  } catch {
    // The built-in menus are used.
  }
}

/** Called after the administrator saves, so every menu on the page redraws at once. */
export function setMenuOverrides(next: MenuOverrides) {
  publish(next);
}

/** The administrator's edits to the menus (nothing until they have loaded, or if they could not be). Read once and shared. */
export function useMenuOverrides(): MenuOverrides | null {
  const [value, setValue] = useState<MenuOverrides | null>(cache);
  useEffect(() => {
    const update = () => setValue(cache);
    listeners.add(update);
    if (cache) update();
    else {
      pending ??= load().finally(() => {
        pending = null;
      });
    }
    return () => {
      listeners.delete(update);
    };
  }, []);
  return value;
}

/** The footer's words and links the administrator set (nothing until loaded, or if they could not be). */
export function useSiteSettings(): SiteSettings | null {
  useMenuOverrides();
  return siteCache;
}

/** What a menu's code needs from each of its links. */
export interface MenuItemBase {
  key: string;
  label: string;
}

/**
 * The menu to draw: the site's own links with the administrator's edits laid over them.
 * - The saved order wins; a link the site has but the saved list does not know (added to the site later) goes at the end.
 * - A saved name replaces the built-in name; a hidden link is left out (the ones in `locked` can never be hidden).
 * - A custom link is built by `custom` (a menu that cannot show custom links leaves it out).
 */
export function applyMenu<T extends MenuItemBase>(
  items: T[],
  entries: MenuEntry[] | undefined,
  options: { locked?: string[]; custom?: (entry: MenuEntry) => T } = {},
): T[] {
  if (!entries || entries.length === 0) return items;
  const byKey = new Map(items.map((item) => [item.key, item]));
  const used = new Set<string>();
  const out: T[] = [];
  for (const entry of entries) {
    if (entry.custom) {
      if (!entry.hidden && options.custom) out.push(options.custom(entry));
      continue;
    }
    const item = byKey.get(entry.key);
    if (!item) continue;
    used.add(entry.key);
    if (entry.hidden && !options.locked?.includes(entry.key)) continue;
    out.push(entry.label && entry.label !== item.label ? { ...item, label: entry.label } : item);
  }
  for (const item of items) if (!used.has(item.key)) out.push(item);
  return out;
}

/** The entries to start editing from: the saved list laid over the built-in links, shown as editable rows. */
export function editableEntries<T extends MenuItemBase & { href?: string }>(items: T[], saved: MenuEntry[] | undefined): MenuEntry[] {
  const byKey = new Map(items.map((item) => [item.key, item]));
  const used = new Set<string>();
  const rows: MenuEntry[] = [];
  for (const entry of saved ?? []) {
    if (entry.custom) {
      rows.push({ ...entry });
      continue;
    }
    const item = byKey.get(entry.key);
    if (!item) continue;
    used.add(entry.key);
    rows.push({ key: item.key, label: entry.label || item.label, href: item.href, hidden: entry.hidden === true });
  }
  for (const item of items) if (!used.has(item.key)) rows.push({ key: item.key, label: item.label, href: item.href, hidden: false });
  return rows;
}

export function useMenu<T extends MenuItemBase>(id: MenuId, items: T[], options: { locked?: string[]; custom?: (entry: MenuEntry) => T } = {}): T[] {
  const overrides = useMenuOverrides();
  return applyMenu(items, overrides?.[id], options);
}

export type SaveMenusResult = { ok: true; menus: MenuOverrides } | { ok: false; error: string };

/** Administrators only. `null` for a menu puts it back to the site's own links. Every menu on the page redraws at once. */
export async function saveMenus(token: string, menus: Partial<Record<MenuId, MenuEntry[] | null>>): Promise<SaveMenusResult> {
  try {
    const res = await fetch(`${API_URL}/auth/admin/settings/menus`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-huza-client": "web", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ menus }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: data?.message || "Could not save the menu." };
    publish((data.menus ?? {}) as MenuOverrides);
    return { ok: true, menus: data.menus as MenuOverrides };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
  }
}

export type SaveSiteResult = { ok: true; site: SiteSettings } | { ok: false; error: string };

/** Administrators only. A field left empty goes back to the site's own. The footer redraws at once. */
export async function saveSite(token: string, site: SiteSettings): Promise<SaveSiteResult> {
  try {
    const res = await fetch(`${API_URL}/auth/admin/settings/site`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-huza-client": "web", Authorization: `Bearer ${token}` },
      body: JSON.stringify(site),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: data?.message || "Could not save." };
    siteCache = (data.site ?? {}) as SiteSettings;
    publish(cache ?? {});
    return { ok: true, site: siteCache };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
  }
}
