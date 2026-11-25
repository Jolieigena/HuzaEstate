"use client";

import { useEffect, useId, useState } from "react";
import Dialog from "@/components/Dialog";
import Select from "@/components/shared/Select";
import { useAuth } from "@/lib/auth-context";
import { useIsAdministrator } from "@/lib/admin/hooks";
import { hasOrgPermission } from "@/lib/orgPermissions";
import { useToast } from "@/lib/toast-context";
import { ClientDiscountsApi, DISCOUNT_KINDS, DISCOUNT_KIND_LABELS, DISCOUNT_STATUS_LABELS, type ClientDiscount, type DiscountKind, type DiscountStatus } from "@/lib/clientDiscounts/api";
import { AdminTable, EmptyState, SectionFrame, PrimaryButton, RequirePermission, SecondaryButton, fieldClass, formatDate } from "../ui";

const STATUS_STYLE: Record<DiscountStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-100",
  scheduled: "bg-sky-50 text-sky-700 border-sky-100",
  expired: "bg-slate-100 text-slate-500 border-slate-200",
  ended: "bg-red-50 text-red-700 border-red-100",
};

// How long a discount lasts: a number of months from the start day, or two dates.
const PERIODS = [
  { key: "1", label: "1 month", months: 1 },
  { key: "3", label: "3 months", months: 3 },
  { key: "6", label: "6 months", months: 6 },
  { key: "12", label: "1 year", months: 12 },
  { key: "custom", label: "Choose the dates", months: 0 },
];

const today = () => new Date().toISOString().slice(0, 10);
function addMonths(day: string, months: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

/** Give one client a percentage off plans, extra posts or promotions for a while, and see and stop the discounts given. */
export function ClientDiscountsPage({ scope, embedded = false }: { scope: "platform" | "org"; embedded?: boolean }) {
  const { token, account, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const isAdmin = useIsAdministrator();
  const canManage = scope === "platform" ? isAdmin : (account?.roles.includes("organization_admin") ?? false) && hasOrgPermission(account?.permissions, "manage_access_codes");
  const [discounts, setDiscounts] = useState<ClientDiscount[] | null>(null);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [reload, setReload] = useState(0);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!isAuthReady || !token || !canManage) return;
    let cancelled = false;
    ClientDiscountsApi.list(token, search).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setDiscounts(result.data.discounts);
        setError("");
      } else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, canManage, search, reload]);

  const end = async (discount: ClientDiscount) => {
    if (!token || !window.confirm(`End the ${discount.percent}% discount for ${discount.email} now?`)) return;
    const result = await ClientDiscountsApi.end(token, discount.id);
    if (!result.ok) showToast(result.error, "error");
    else {
      showToast("Discount ended.");
      setReload((n) => n + 1);
    }
  };

  return (
    <SectionFrame embedded={embedded} title="Client discounts" action={canManage ? <PrimaryButton type="button" onClick={() => setCreating(true)}>Give a discount</PrimaryButton> : undefined}>
      <RequirePermission granted={canManage}>
        <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by email" aria-label="Search by email" className={`${fieldClass} mb-5 max-w-sm`} />
        {error ? (
          <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
        ) : discounts === null ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading…</p>
        ) : discounts.length === 0 ? (
          <EmptyState title="No discounts yet" action={<PrimaryButton type="button" onClick={() => setCreating(true)}>Give a discount</PrimaryButton>} />
        ) : (
          <AdminTable headers={["Client", "Discount", "On", "Period", "Status", "Given by", ""]}>
            {discounts.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50/60">
                <td className="px-6 py-4 font-semibold text-slate-900">
                  {d.email}
                  {d.note && <span className="block text-xs font-normal text-slate-400">{d.note}</span>}
                </td>
                <td className="px-6 py-4 font-black text-slate-900">{d.percent}%</td>
                <td className="px-6 py-4 text-slate-600">{d.appliesTo.map((k) => DISCOUNT_KIND_LABELS[k]).join(", ")}</td>
                <td className="px-6 py-4 text-slate-600">
                  {formatDate(d.startsAt)} to {formatDate(d.endsAt)}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${STATUS_STYLE[d.status]}`}>{DISCOUNT_STATUS_LABELS[d.status]}</span>
                </td>
                <td className="px-6 py-4 text-slate-500">{d.organizationName || d.issuedBy}</td>
                <td className="px-6 py-4 text-right">
                  {(d.status === "active" || d.status === "scheduled") && (
                    <SecondaryButton type="button" onClick={() => end(d)}>
                      End now
                    </SecondaryButton>
                  )}
                </td>
              </tr>
            ))}
          </AdminTable>
        )}
      </RequirePermission>
      {creating && (
        <GiveDiscountDialog
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            setReload((n) => n + 1);
          }}
        />
      )}
    </SectionFrame>
  );
}

function GiveDiscountDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const titleId = useId();
  const { token } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [percent, setPercent] = useState("10");
  const [kinds, setKinds] = useState<DiscountKind[]>([...DISCOUNT_KINDS]);
  const [period, setPeriod] = useState("3");
  const [start, setStart] = useState(today());
  const [customEnd, setCustomEnd] = useState(addMonths(today(), 1));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const months = PERIODS.find((p) => p.key === period)?.months ?? 0;
  const endDay = period === "custom" ? customEnd : addMonths(start, months);

  const save = async () => {
    if (!token || busy) return;
    const pct = Number(percent);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Enter the client's email address.");
    if (!Number.isInteger(pct) || pct < 1 || pct > 90) return setError("The discount must be a whole number from 1 to 90 percent.");
    if (kinds.length === 0) return setError("Choose what the discount applies to.");
    if (!endDay || endDay <= start) return setError("The end date must be after the start date.");
    setBusy(true);
    setError("");
    // A start of today begins now; a later day begins at the start of that day. The discount runs until the end of its last day.
    const startsAt = start === today() ? new Date().toISOString() : `${start}T00:00:00.000Z`;
    const endsAt = `${endDay}T23:59:59.000Z`;
    const result = await ClientDiscountsApi.create(token, { email: email.trim(), percent: pct, appliesTo: kinds, startsAt, endsAt, ...(note.trim() ? { note: note.trim() } : {}) });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    showToast(`${pct}% discount given to ${result.data.discount.email}.`);
    onSaved();
  };

  return (
    <Dialog open onClose={onClose} labelledBy={titleId} panelClassName="max-w-lg">
      <div className="p-6 sm:p-8">
        <h2 id={titleId} className="text-xl font-black text-slate-900">
          Give a discount
        </h2>
        {error && <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
        <div className="mt-5 space-y-4">
          <label className="block text-sm font-bold text-slate-700">
            Client&apos;s email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${fieldClass} mt-1`} autoFocus />
          </label>
          <label className="block text-sm font-bold text-slate-700 sm:max-w-[10rem]">
            Discount (%)
            <input inputMode="numeric" value={percent} onChange={(e) => setPercent(e.target.value.replace(/\D/g, "").slice(0, 2))} className={`${fieldClass} mt-1`} />
          </label>
          <div>
            <p className="text-sm font-bold text-slate-700">On</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DISCOUNT_KINDS.map((k) => {
                const on = kinds.includes(k);
                return (
                  <button key={k} type="button" aria-pressed={on} onClick={() => setKinds((prev) => (on ? prev.filter((x) => x !== k) : [...prev, k]))} className={`rounded-full border px-4 py-2 text-sm font-semibold ${on ? "border-[#2ec440] bg-[#2ec440]/10 text-[#219b31]" : "border-slate-200 text-slate-600"}`}>
                    {DISCOUNT_KIND_LABELS[k]}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">
              For
              <Select value={period} onChange={(e) => setPeriod(e.target.value)} className={`${fieldClass} mt-1`}>
                {PERIODS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block text-sm font-bold text-slate-700">
              From
              <input type="date" value={start} min={today()} onChange={(e) => setStart(e.target.value)} className={`${fieldClass} mt-1`} />
            </label>
            {period === "custom" ? (
              <label className="block text-sm font-bold text-slate-700">
                Until
                <input type="date" value={customEnd} min={start} onChange={(e) => setCustomEnd(e.target.value)} className={`${fieldClass} mt-1`} />
              </label>
            ) : (
              <p className="self-end pb-3 text-sm font-semibold text-slate-600">Until {endDay ? formatDate(`${endDay}T12:00:00Z`) : "—"}</p>
            )}
          </div>
          <label className="block text-sm font-bold text-slate-700">
            Note <span className="font-normal text-slate-400">(optional, only staff see it)</span>
            <input value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} className={`${fieldClass} mt-1`} />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <SecondaryButton type="button" onClick={onClose}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="button" disabled={busy} onClick={save}>
            {busy ? "Saving…" : "Give the discount"}
          </PrimaryButton>
        </div>
      </div>
    </Dialog>
  );
}
