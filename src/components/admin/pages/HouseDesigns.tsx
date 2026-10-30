"use client";

import { useEffect, useState } from "react";
import DesignPlans from "@/components/build/DesignPlans";
import { useAuth } from "@/lib/auth-context";
import { useIsAdministrator } from "@/lib/admin/hooks";
import { HOUSE_DESIGN_STATUS_LABELS, HouseDesignsApi, type HouseDesignRecord, type HouseDesignStatus } from "@/lib/houseDesigns/api";
import { useToast } from "@/lib/toast-context";
import Select from "@/components/shared/Select";
import { Card, EmptyState, PageFrame, PrimaryButton, RequirePermission, StatusPill, fieldClass, formatDateTime } from "../ui";

const STATUSES = Object.keys(HOUSE_DESIGN_STATUS_LABELS) as HouseDesignStatus[];
const TABS: { key: "all" | HouseDesignStatus; label: string }[] = [{ key: "all", label: "All" }, ...STATUSES.map((key) => ({ key, label: HOUSE_DESIGN_STATUS_LABELS[key] }))];

function DesignRow({ record, onSaved }: { record: HouseDesignRecord; onSaved: (next: HouseDesignRecord) => void }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [status, setStatus] = useState<HouseDesignStatus>(record.status);
  const [note, setNote] = useState(record.adminNote ?? "");
  const [saving, setSaving] = useState(false);
  const changed = status !== record.status || note.trim() !== (record.adminNote ?? "");

  const save = async () => {
    if (!token || saving) return;
    setSaving(true);
    const result = await HouseDesignsApi.update(token, record.id, { status, adminNote: note });
    setSaving(false);
    if (!result.ok) {
      showToast(result.error, "error");
      return;
    }
    showToast("Saved.");
    onSaved(result.data);
  };

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-black text-slate-900">{record.title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {record.ownerName ?? "A customer"}
            {record.ownerEmail && (
              <>
                {" · "}
                <a href={`mailto:${record.ownerEmail}`} className="hover:text-[#219b31]">
                  {record.ownerEmail}
                </a>
              </>
            )}
            {record.phone && (
              <>
                {" · "}
                <a href={`tel:${record.phone}`} className="hover:text-[#219b31]">
                  {record.phone}
                </a>
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Sent {formatDateTime(record.createdAt)} · {record.floorCount} {record.floorCount === 1 ? "floor" : "floors"} · {record.roomCount} rooms · {record.totalAreaSqm} sqm
            {record.plotSummary ? ` · ${record.plotSummary}` : ""}
            {record.budgetSummary ? ` · ${record.budgetSummary}` : ""}
          </p>
        </div>
        <StatusPill status={HOUSE_DESIGN_STATUS_LABELS[record.status]} />
      </div>
      {record.notes && <p className="mt-3 whitespace-pre-line rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">“{record.notes}”</p>}

      <DesignPlans record={record} />

      <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-[14rem_1fr_auto] sm:items-end">
        <label className="block text-sm font-bold text-slate-700">
          Status
          <Select className={`${fieldClass} mt-1`} value={status} onChange={(e) => setStatus(e.target.value as HouseDesignStatus)}>
            {STATUSES.map((key) => (
              <option key={key} value={key}>
                {HOUSE_DESIGN_STATUS_LABELS[key]}
              </option>
            ))}
          </Select>
        </label>
        <label className="block text-sm font-bold text-slate-700">
          Note for the customer <span className="font-normal text-slate-400">(optional)</span>
          <input className={`${fieldClass} mt-1`} value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} />
        </label>
        <PrimaryButton type="button" disabled={saving || !changed} onClick={save}>
          {saving ? "Saving…" : "Save"}
        </PrimaryButton>
      </div>
    </Card>
  );
}

// Every house a customer laid out in the Build designer and sent in, newest first. Changing the status tells the customer.
export function HouseDesignsListPage() {
  const { token, isAuthReady } = useAuth();
  const canView = useIsAdministrator();
  const [tab, setTab] = useState<"all" | HouseDesignStatus>("all");
  const [designs, setDesigns] = useState<HouseDesignRecord[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthReady || !token || !canView) return;
    let cancelled = false;
    HouseDesignsApi.listAll(token, tab).then((result) => {
      if (cancelled) return;
      if (result.ok) setDesigns(result.data);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, canView, tab]);

  return (
    <PageFrame title="House designs">
      <RequirePermission granted={canView}>
        <div role="tablist" aria-label="Design status" className="mb-5 flex flex-wrap gap-2">
          {TABS.map((item) => {
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setDesigns(null);
                  setTab(item.key);
                }}
                className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {error ? (
          <Card className="border-red-100 bg-red-50/60 text-sm text-red-700">{error}</Card>
        ) : designs === null ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading designs…</p>
        ) : designs.length === 0 ? (
          <EmptyState title="No designs here" description="Houses customers send in from the Build designer will appear here." />
        ) : (
          <div className="space-y-5">
            {designs.map((record) => (
              <DesignRow key={record.id} record={record} onSaved={(next) => setDesigns((list) => (list ? list.map((d) => (d.id === next.id ? next : d)) : list))} />
            ))}
          </div>
        )}
      </RequirePermission>
    </PageFrame>
  );
}
