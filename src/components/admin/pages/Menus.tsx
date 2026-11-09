"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useIsAdministrator } from "@/lib/admin/hooks";
import { editableEntries, saveMenus, saveSite, useMenuOverrides, useSiteSettings, type MenuEntry, type MenuId, type SiteSettings } from "@/lib/menus/menus";
import { MENU_DEFINITIONS } from "@/lib/menus/registry";
import { useToast } from "@/lib/toast-context";
import { Card, DestructiveButton, PrimaryButton, SecondaryButton } from "../ui";
import Toggle from "../Toggle";

const sameRows = (a: MenuEntry[], b: MenuEntry[]) => JSON.stringify(a) === JSON.stringify(b);

/** A compact input for rows and forms inside the editors. */
const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-[#2ec440] focus:ring-4 focus:ring-[#2ec440]/10";
const iconButton =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent";

function Icon({ d }: { d: string }) {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}
const UP = "M5 15l7-7 7 7";
const DOWN = "M19 9l-7 7-7-7";
const CROSS = "M6 6l12 12M18 6L6 18";

const GROUPS: { title: string; ids: MenuId[] }[] = [
  { title: "Site", ids: ["main", "footer-explore", "footer-company", "footer-account"] },
  { title: "Sidebars", ids: ["admin", "customer", "owner", "professional", "supplier", "org-admin"] },
  { title: "Page filters", ids: ["designs-tabs", "professionals-filters", "professionals-categories", "property-types"] },
];

/** The site's menus, in Admin Settings: the main menu, the footer columns, the sidebars and a few page filters. For each, the administrator
 *  shows or hides a link, renames it, moves it and adds their own; the site shows the change at once. A link the site gains later appears at
 *  the end of its menu by itself. Settings can never be hidden from the admin sidebar. */
export function MenusCard() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const canManage = useIsAdministrator();
  const overrides = useMenuOverrides();
  const [menuId, setMenuId] = useState<MenuId>("main");
  const [rows, setRows] = useState<MenuEntry[]>([]);
  const [baseline, setBaseline] = useState<MenuEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newHref, setNewHref] = useState("");
  const [error, setError] = useState("");

  const definition = MENU_DEFINITIONS.find((d) => d.id === menuId)!;
  const loaded = overrides !== null;

  // Starts from what the site shows now: the saved edits over the built-in links. Switching menu (or a save) starts again from that.
  const saved = overrides?.[menuId];
  const source = loaded ? `${menuId}:${JSON.stringify(saved ?? null)}` : "";
  const [seen, setSeen] = useState("");
  if (source !== seen) {
    setSeen(source);
    if (loaded) {
      const start = editableEntries(definition.items, saved);
      setRows(start);
      setBaseline(start);
      setError("");
    }
  }

  if (!canManage) return null;

  const dirty = loaded && !sameRows(rows, baseline);
  const patch = (key: string, change: Partial<MenuEntry>) => setRows((current) => current.map((r) => (r.key === key ? { ...r, ...change } : r)));
  const move = (index: number, by: -1 | 1) =>
    setRows((current) => {
      const target = index + by;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const addLink = () => {
    const label = newLabel.trim();
    const href = newHref.trim();
    if (!label) return setError("Give the link a name.");
    if (!/^(\/(?!\/)|https:\/\/)/.test(href)) return setError("The address must start with / (a page on this site) or https://.");
    setRows((current) => [...current, { key: `custom-${Date.now().toString(36)}`, label, href, custom: true, hidden: false }]);
    setNewLabel("");
    setNewHref("");
    setError("");
  };

  const save = async () => {
    if (!token || saving) return;
    if (rows.some((r) => !r.label.trim())) return setError("Every link needs a name.");
    setSaving(true);
    setError("");
    const entries = rows.map((r) => ({ key: r.key, label: r.label.trim(), ...(r.custom ? { href: r.href, custom: true } : {}), ...(r.hidden ? { hidden: true } : {}) }));
    const result = await saveMenus(token, { [menuId]: entries });
    setSaving(false);
    if (!result.ok) return setError(result.error);
    showToast("Menu saved.");
  };

  const reset = async () => {
    if (!token || saving) return;
    setSaving(true);
    const result = await saveMenus(token, { [menuId]: null });
    setSaving(false);
    if (!result.ok) return setError(result.error);
    showToast("Menu put back to the site's own links.");
  };

  const titleOf = (id: MenuId) => MENU_DEFINITIONS.find((d) => d.id === id)!.title;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
      {/* Which menu: a list on a wide screen, a dropdown on a phone. */}
      <nav aria-label="Menus" className="hidden lg:block">
        {GROUPS.map((group) => (
          <div key={group.title} className="mb-5 last:mb-0">
            <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">{group.title}</p>
            <ul className="space-y-0.5">
              {group.ids.map((id) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setMenuId(id)}
                    aria-current={menuId === id ? "true" : undefined}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${menuId === id ? "bg-[#2ec440]/10 text-[#1f8a2e]" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                  >
                    {titleOf(id)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <select aria-label="Menu" value={menuId} onChange={(e) => setMenuId(e.target.value as MenuId)} className={`${inputClass} lg:hidden`}>
        {GROUPS.map((group) => (
          <optgroup key={group.title} label={group.title}>
            {group.ids.map((id) => (
              <option key={id} value={id}>
                {titleOf(id)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <Card className="!p-0">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h3 className="text-lg font-black text-slate-900">{definition.title}</h3>
          {dirty && <span className="text-sm font-semibold text-amber-600">Unsaved changes</span>}
        </div>

        {!loaded ? (
          <p className="p-5 text-sm text-slate-400">Loading…</p>
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              {rows.map((row, index) => {
                const locked = definition.locked?.includes(row.key);
                return (
                  <li key={row.key} className={`flex items-center gap-3 px-5 py-2.5 transition-opacity ${row.hidden ? "opacity-55" : ""}`}>
                    <Toggle checked={!row.hidden} onChange={(on) => patch(row.key, { hidden: !on })} disabled={locked} label={`Show ${row.label}`} />
                    <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                      <input className={inputClass} value={row.label} maxLength={40} aria-label="Name" onChange={(e) => patch(row.key, { label: e.target.value })} />
                      {row.custom ? (
                        <input className={inputClass} value={row.href ?? ""} maxLength={300} aria-label="Address" onChange={(e) => patch(row.key, { href: e.target.value })} />
                      ) : (
                        <span className="hidden min-w-0 items-center truncate px-1 text-xs text-slate-400 sm:flex">{row.href}</span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up" className={iconButton}>
                        <Icon d={UP} />
                      </button>
                      <button type="button" onClick={() => move(index, 1)} disabled={index === rows.length - 1} aria-label="Move down" className={iconButton}>
                        <Icon d={DOWN} />
                      </button>
                      {row.custom ? (
                        <button type="button" onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))} aria-label="Remove link" className={`${iconButton} !border-red-200 !text-red-600 hover:!bg-red-50`}>
                          <Icon d={CROSS} />
                        </button>
                      ) : (
                        <span className="h-9 w-9 shrink-0" aria-hidden="true" />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {definition.customLinks && (
              <div className="flex flex-wrap items-end gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4">
                <label className="min-w-[8rem] flex-1 text-xs font-bold text-slate-600">
                  Name
                  <input className={`${inputClass} mt-1`} value={newLabel} maxLength={40} onChange={(e) => setNewLabel(e.target.value)} />
                </label>
                <label className="min-w-[10rem] flex-[2] text-xs font-bold text-slate-600">
                  Address
                  <input className={`${inputClass} mt-1`} value={newHref} maxLength={300} placeholder="/page or https://…" onChange={(e) => setNewHref(e.target.value)} />
                </label>
                <SecondaryButton type="button" onClick={addLink}>
                  Add link
                </SecondaryButton>
              </div>
            )}

            {error && (
              <p role="alert" className="border-t border-slate-100 px-5 py-3 text-sm font-semibold text-red-600">
                {error}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-5 py-4">
              <PrimaryButton type="button" disabled={!dirty || saving} onClick={save}>
                {saving ? "Saving…" : "Save changes"}
              </PrimaryButton>
              {saved && saved.length > 0 && (
                <DestructiveButton type="button" disabled={saving} onClick={reset}>
                  Reset to default
                </DestructiveButton>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

const SOCIAL_FIELDS = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "x", label: "X" },
  { key: "linkedin", label: "LinkedIn" },
] as const;
const HEADING_FIELDS = [
  { key: "explore", label: "First column" },
  { key: "company", label: "Second column" },
  { key: "account", label: "Third column" },
] as const;

/** The footer's own words: the line under the logo, the three column headings and the social media links. A field left empty uses the site's own. */
export function FooterTextCard() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const canManage = useIsAdministrator();
  const site = useSiteSettings();
  const [form, setForm] = useState<SiteSettings | null>(null);
  const [seen, setSeen] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  if (site !== seen) {
    setSeen(site);
    if (site) setForm(JSON.parse(JSON.stringify(site)));
  }
  if (!canManage) return null;

  const dirty = form !== null && site !== null && JSON.stringify(form) !== JSON.stringify(site);
  const save = async () => {
    if (!token || !form || saving) return;
    setSaving(true);
    setError("");
    const result = await saveSite(token, form);
    setSaving(false);
    if (!result.ok) return setError(result.error);
    showToast("Footer saved.");
  };

  const label = "block text-xs font-bold text-slate-600";

  return (
    <Card className="!p-0">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h3 className="text-lg font-black text-slate-900">Footer</h3>
        {dirty && <span className="text-sm font-semibold text-amber-600">Unsaved changes</span>}
      </div>
      {!form ? (
        <p className="p-5 text-sm text-slate-400">Loading…</p>
      ) : (
        <>
          <div className="grid gap-x-8 gap-y-6 p-5 md:grid-cols-2">
            <div className="space-y-4">
              <label className={label}>
                Line under the logo
                <textarea className={`${inputClass} mt-1`} rows={3} maxLength={200} value={form.tagline ?? ""} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
              </label>
              <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
                {HEADING_FIELDS.map((f) => (
                  <label key={f.key} className={label}>
                    {f.label}
                    <input className={`${inputClass} mt-1`} maxLength={30} value={form.headings?.[f.key] ?? ""} onChange={(e) => setForm({ ...form, headings: { ...form.headings, [f.key]: e.target.value } })} />
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {SOCIAL_FIELDS.map((f) => (
                <label key={f.key} className={label}>
                  {f.label}
                  <input className={`${inputClass} mt-1`} maxLength={300} placeholder="https://…" value={form.social?.[f.key] ?? ""} onChange={(e) => setForm({ ...form, social: { ...form.social, [f.key]: e.target.value } })} />
                </label>
              ))}
            </div>
          </div>
          {error && (
            <p role="alert" className="border-t border-slate-100 px-5 py-3 text-sm font-semibold text-red-600">
              {error}
            </p>
          )}
          <div className="flex items-center gap-3 border-t border-slate-100 px-5 py-4">
            <PrimaryButton type="button" disabled={!dirty || saving} onClick={save}>
              {saving ? "Saving…" : "Save changes"}
            </PrimaryButton>
          </div>
        </>
      )}
    </Card>
  );
}
