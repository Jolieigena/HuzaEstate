"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useIsAdministrator } from "@/lib/admin/hooks";
import { editableEntries, saveMenus, saveSite, useMenuOverrides, useSiteSettings, type MenuEntry, type MenuId, type SiteSettings } from "@/lib/menus/menus";
import { MENU_DEFINITIONS } from "@/lib/menus/registry";
import { useToast } from "@/lib/toast-context";
import { Card, DestructiveButton, PrimaryButton, SecondaryButton, fieldClass } from "../ui";

const sameRows = (a: MenuEntry[], b: MenuEntry[]) => JSON.stringify(a) === JSON.stringify(b);

/** The site's menus, in Admin Settings: the main menu, the footer columns and the sidebars. For each, the administrator shows or hides a
 *  link, renames it, moves it and adds their own; the site shows the change at once. A link the site gains later appears at the end of its
 *  menu by itself. Settings can never be hidden from the admin sidebar. */
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

  return (
    <Card className="mt-6 max-w-2xl">
      <h3 className="text-lg font-black text-slate-900">Menus</h3>

      <div className="mt-4 flex flex-wrap gap-2">
        {MENU_DEFINITIONS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setMenuId(d.id)}
            className={`min-h-9 rounded-full border px-3 text-xs font-bold transition-colors ${menuId === d.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-[#2ec440]"}`}
          >
            {d.title}
          </button>
        ))}
      </div>

      {!loaded ? (
        <p className="mt-6 text-sm text-slate-400">Loading…</p>
      ) : (
        <>
          <ul className="mt-5 divide-y divide-slate-100 rounded-2xl border border-slate-200">
            {rows.map((row, index) => {
              const locked = definition.locked?.includes(row.key);
              return (
                <li key={row.key} className="flex items-center gap-2 p-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!row.hidden}
                    aria-label={`Show ${row.label}`}
                    disabled={locked}
                    onClick={() => patch(row.key, { hidden: !row.hidden })}
                    className={`relative h-6 w-10 shrink-0 rounded-full transition-colors disabled:opacity-40 ${row.hidden ? "bg-slate-300" : "bg-[#2ec440]"}`}
                  >
                    <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${row.hidden ? "translate-x-1" : "translate-x-5"}`} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <input className={`${fieldClass} !py-2`} value={row.label} maxLength={40} aria-label="Name" onChange={(e) => patch(row.key, { label: e.target.value })} />
                    {row.custom ? (
                      <input className={`${fieldClass} mt-1 !py-2 !text-xs`} value={row.href ?? ""} maxLength={300} aria-label="Address" onChange={(e) => patch(row.key, { href: e.target.value })} />
                    ) : (
                      row.href && <p className="mt-1 truncate px-1 text-xs text-slate-400">{row.href}</p>
                    )}
                  </div>
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up" className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30">
                    ↑
                  </button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === rows.length - 1} aria-label="Move down" className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30">
                    ↓
                  </button>
                  {row.custom ? (
                    <button type="button" onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))} aria-label="Remove link" className="h-9 w-9 shrink-0 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                      ×
                    </button>
                  ) : (
                    <span className="h-9 w-9 shrink-0" aria-hidden="true" />
                  )}
                </li>
              );
            })}
          </ul>

          {definition.customLinks && (
            <div className="mt-4 flex flex-wrap items-end gap-2">
              <label className="min-w-[8rem] flex-1 text-xs font-bold text-slate-600">
                Name
                <input className={`${fieldClass} mt-1 !py-2`} value={newLabel} maxLength={40} onChange={(e) => setNewLabel(e.target.value)} />
              </label>
              <label className="min-w-[10rem] flex-[2] text-xs font-bold text-slate-600">
                Address
                <input className={`${fieldClass} mt-1 !py-2`} value={newHref} maxLength={300} placeholder="/page or https://…" onChange={(e) => setNewHref(e.target.value)} />
              </label>
              <SecondaryButton type="button" onClick={addLink}>
                Add link
              </SecondaryButton>
            </div>
          )}

          {error && (
            <p role="alert" className="mt-3 text-sm font-semibold text-red-600">
              {error}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
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

/** The footer's own words: the line under the logo, the social media links and the three column headings. A field left empty uses the site's own. */
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

  return (
    <Card className="mt-6 max-w-2xl">
      <h3 className="text-lg font-black text-slate-900">Footer</h3>
      {!form ? (
        <p className="mt-4 text-sm text-slate-400">Loading…</p>
      ) : (
        <div className="mt-4 space-y-4">
          <label className="block text-sm font-bold text-slate-700">
            Line under the logo
            <textarea className={`${fieldClass} mt-1`} rows={2} maxLength={200} value={form.tagline ?? ""} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            {HEADING_FIELDS.map((f) => (
              <label key={f.key} className="block text-sm font-bold text-slate-700">
                {f.label}
                <input className={`${fieldClass} mt-1`} maxLength={30} value={form.headings?.[f.key] ?? ""} onChange={(e) => setForm({ ...form, headings: { ...form.headings, [f.key]: e.target.value } })} />
              </label>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {SOCIAL_FIELDS.map((f) => (
              <label key={f.key} className="block text-sm font-bold text-slate-700">
                {f.label} link
                <input className={`${fieldClass} mt-1`} maxLength={300} placeholder="https://…" value={form.social?.[f.key] ?? ""} onChange={(e) => setForm({ ...form, social: { ...form.social, [f.key]: e.target.value } })} />
              </label>
            ))}
          </div>
          {error && (
            <p role="alert" className="text-sm font-semibold text-red-600">
              {error}
            </p>
          )}
          <PrimaryButton type="button" disabled={!dirty || saving} onClick={save}>
            {saving ? "Saving…" : "Save changes"}
          </PrimaryButton>
        </div>
      )}
    </Card>
  );
}
