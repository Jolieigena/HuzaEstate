"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useIsAdministrator } from "@/lib/admin/hooks";
import { FurnitureApi } from "@/lib/furniture/api";
import { useToast } from "@/lib/toast-context";
import { Card, DestructiveButton, PageFrame, PrimaryButton, RequirePermission, SecondaryButton, fieldClass } from "../ui";

interface Row {
  key: string;
  id?: string;
  name: string;
  /** `saved` is the name the category has in the shop now, so renaming it can carry its products along. */
  categories: { key: string; name: string; saved?: string; count: number }[];
}

let counter = 0;
const nextKey = () => `k${++counter}`;

const snapshot = (rows: Row[]) => JSON.stringify(rows.map((r) => [r.id ?? "", r.name.trim(), r.categories.map((c) => c.name.trim())]));

function toRows(groups: { id: string; name: string; categories: { name: string; count: number }[] }[]): Row[] {
  return groups.map((g) => ({ key: nextKey(), id: g.id, name: g.name, categories: g.categories.map((c) => ({ key: nextKey(), name: c.name, saved: c.name, count: c.count })) }));
}

/** The tabs of the shop and the categories in each tab's dropdown. Administrators add, rename, reorder and remove both; the shop shows
 *  the change at once. A product keeps its own category text, so removing a category from a tab never deletes products: they move to
 *  the shop's "Other" tab until the category is listed again. Renaming a category renames it on its products too. */
export function ShopCategoriesPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const canManage = useIsAdministrator();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [saved, setSaved] = useState("");
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!canManage) return;
    let cancelled = false;
    FurnitureApi.groups().then((result) => {
      if (cancelled) return;
      if (!result.ok) return setLoadError(result.error);
      const loaded = toRows(result.data.groups);
      setRows(loaded);
      setSaved(snapshot(loaded));
    });
    return () => {
      cancelled = true;
    };
  }, [canManage]);

  const dirty = useMemo(() => rows !== null && snapshot(rows) !== saved, [rows, saved]);

  const patch = (key: string, change: (row: Row) => Row) => setRows((current) => current && current.map((r) => (r.key === key ? change(r) : r)));
  const move = (index: number, by: -1 | 1) =>
    setRows((current) => {
      if (!current || index + by < 0 || index + by >= current.length) return current;
      const next = [...current];
      [next[index], next[index + by]] = [next[index + by], next[index]];
      return next;
    });
  const addCategory = (row: Row) => {
    const name = (drafts[row.key] ?? "").trim().replace(/\s+/g, " ");
    if (!name) return;
    if (rows?.some((r) => r.categories.some((c) => c.name.trim().toLowerCase() === name.toLowerCase()))) return showToast(`"${name}" is already listed.`, "error");
    patch(row.key, (r) => ({ ...r, categories: [...r.categories, { key: nextKey(), name, count: 0 }] }));
    setDrafts((d) => ({ ...d, [row.key]: "" }));
  };

  async function save() {
    if (!token || !rows || saving) return;
    setSaving(true);
    const result = await FurnitureApi.saveGroups(
      token,
      rows.map((r) => ({
        ...(r.id ? { id: r.id } : {}),
        name: r.name.trim(),
        categories: r.categories.filter((c) => c.name.trim()).map((c) => ({ name: c.name.trim(), ...(c.saved && c.saved !== c.name.trim() ? { was: c.saved } : {}) })),
      })),
    );
    setSaving(false);
    if (!result.ok) return showToast(result.error, "error");
    const counts = new Map(rows.flatMap((r) => r.categories.map((c) => [c.name.trim().toLowerCase(), c.count] as const)));
    const reloaded = toRows(result.data.groups.map((g) => ({ ...g, categories: g.categories.map((name) => ({ name, count: counts.get(name.toLowerCase()) ?? 0 })) })));
    setRows(reloaded);
    setSaved(snapshot(reloaded));
    showToast("Shop categories saved.");
  }

  return (
    <PageFrame title="Shop categories" description="The tabs across the top of the shop, and the categories in each tab's dropdown. Changes show in the shop as soon as you save.">
      <RequirePermission granted={canManage}>
        {loadError ? (
          <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{loadError}</p>
        ) : rows === null ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : (
          <div className="max-w-3xl space-y-5">
            {rows.length === 0 && <p className="text-sm font-semibold text-slate-500">No tabs yet. The shop shows only its “Other” tab, with every category products use.</p>}
            {rows.map((row, index) => (
              <Card key={row.key}>
                <div className="flex flex-wrap items-center gap-2">
                  <input className={`${fieldClass} min-w-48 flex-1 !font-bold`} value={row.name} maxLength={40} placeholder="Tab name, e.g. Furniture" aria-label="Tab name" onChange={(e) => patch(row.key, (r) => ({ ...r, name: e.target.value }))} />
                  <SecondaryButton type="button" disabled={index === 0} aria-label={`Move ${row.name || "tab"} earlier`} onClick={() => move(index, -1)}>
                    ↑
                  </SecondaryButton>
                  <SecondaryButton type="button" disabled={index === rows.length - 1} aria-label={`Move ${row.name || "tab"} later`} onClick={() => move(index, 1)}>
                    ↓
                  </SecondaryButton>
                  <DestructiveButton
                    type="button"
                    onClick={() => {
                      const live = row.categories.reduce((sum, c) => sum + c.count, 0);
                      if (live > 0 && !window.confirm(`Remove the “${row.name || "untitled"}” tab? Its ${live} live ${live === 1 ? "product moves" : "products move"} to the Other tab until its categories are listed again.`)) return;
                      setRows((current) => current && current.filter((r) => r.key !== row.key));
                    }}
                  >
                    Remove tab
                  </DestructiveButton>
                </div>

                <ul className="mt-4 divide-y divide-slate-100">
                  {row.categories.map((c) => (
                    <li key={c.key} className="flex items-center gap-2 py-1.5">
                      <input className={`${fieldClass} !py-2`} value={c.name} maxLength={60} aria-label="Category name" onChange={(e) => patch(row.key, (r) => ({ ...r, categories: r.categories.map((x) => (x.key === c.key ? { ...x, name: e.target.value } : x)) }))} />
                      <span className="w-20 shrink-0 text-right text-xs font-bold text-slate-400">{c.count} live</span>
                      <button type="button" aria-label={`Remove ${c.name}`} className="rounded-lg px-3 py-2 text-lg font-bold text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => patch(row.key, (r) => ({ ...r, categories: r.categories.filter((x) => x.key !== c.key) }))}>
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex gap-2">
                  <input
                    className={fieldClass}
                    value={drafts[row.key] ?? ""}
                    maxLength={60}
                    placeholder="Add a category"
                    aria-label={`Add a category to ${row.name || "this tab"}`}
                    onChange={(e) => setDrafts((d) => ({ ...d, [row.key]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCategory(row);
                      }
                    }}
                  />
                  <SecondaryButton type="button" onClick={() => addCategory(row)}>
                    Add
                  </SecondaryButton>
                </div>
              </Card>
            ))}

            <div className="flex flex-wrap items-center gap-3">
              <SecondaryButton type="button" onClick={() => setRows((current) => [...(current ?? []), { key: nextKey(), name: "", categories: [] }])}>
                Add a tab
              </SecondaryButton>
              <PrimaryButton type="button" disabled={!dirty || saving} onClick={save}>
                {saving ? "Saving…" : "Save changes"}
              </PrimaryButton>
              {dirty && <span className="text-sm font-semibold text-amber-600">Unsaved changes</span>}
            </div>
          </div>
        )}
      </RequirePermission>
    </PageFrame>
  );
}
