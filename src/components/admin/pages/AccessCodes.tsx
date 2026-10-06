"use client";

import { useEffect, useId, useState } from "react";
import Dialog from "@/components/Dialog";
import { useAuth } from "@/lib/auth-context";
import { useIsAdministrator } from "@/lib/admin/hooks";
import { AdminApi, type AdminOrganization } from "@/lib/admin/api";
import { hasOrgPermission } from "@/lib/orgPermissions";
import { useToast } from "@/lib/toast-context";
import {
  ACCESS_CODE_MAX_DAYS,
  ACCESS_CODE_MAX_TOTAL_DAYS,
  ACCESS_CODE_STATUS_LABELS,
  AccessCodesApi,
  type AccessCode,
  type AccessCodeList,
  type AccessCodeStatus,
  type AccessCodeTier,
} from "@/lib/accessCodes/api";
import { PLAN_LABELS, PLAN_LIMITS } from "@/lib/postingPlans/types";
import ReasonFormModal from "../ReasonFormModal";
import { AdminTable, Card, EmptyState, PageFrame, PrimaryButton, RequirePermission, SecondaryButton, fieldClass, formatDate } from "../ui";
import Select from "@/components/shared/Select";

const TIERS: AccessCodeTier[] = ["silver", "gold", "diamond"];
const PAGE_SIZES = [10, 25, 50];
const QUICK_DAYS = [7, 14, 30];

const STATUS_STYLE: Record<AccessCodeStatus, string> = {
  redeemed: "bg-emerald-50 text-emerald-700 border-emerald-100",
  pending: "bg-sky-50 text-sky-700 border-sky-100",
  expired: "bg-amber-50 text-amber-700 border-amber-100",
  ended: "bg-red-50 text-red-700 border-red-100",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

function CodeStatusPill({ status }: { status: AccessCodeStatus }) {
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${STATUS_STYLE[status]}`}>{ACCESS_CODE_STATUS_LABELS[status]}</span>;
}

function tierHint(tier: AccessCodeTier): string {
  const limit = PLAN_LIMITS[tier];
  return limit === null ? "unlimited posts a month" : `up to ${limit} posts a month`;
}

type Loaded = { key: string; data?: AccessCodeList; error?: string };
type EndTarget = { code: AccessCode; mode: "end" | "cancel" };

/** Access codes: time-limited access to a paid plan, issued by email and redeemed by the seller. One
 *  page for both portals: a platform admin sees every code (and can filter by who issued it); an
 *  organisation admin sees and manages only their own organisation's. The server enforces that scope. */
export function AccessCodesPage({ scope }: { scope: "platform" | "org" }) {
  const { token, account, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const isAdmin = useIsAdministrator();
  const canManage = scope === "platform" ? isAdmin : (account?.roles.includes("organization_admin") ?? false) && hasOrgPermission(account?.permissions, "manage_access_codes");

  const [status, setStatus] = useState<AccessCodeStatus | "">("");
  const [tier, setTier] = useState<AccessCodeTier | "">("");
  const [issuer, setIssuer] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [reload, setReload] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);

  const [creating, setCreating] = useState(false);
  const [endTarget, setEndTarget] = useState<EndTarget | null>(null);
  const [extendTarget, setExtendTarget] = useState<AccessCode | null>(null);

  // Wait a beat after typing before searching.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (scope !== "platform" || !isAuthReady || !token || !isAdmin) return;
    let cancelled = false;
    AdminApi.listOrganizations(token).then((result) => {
      if (!cancelled && result.ok) setOrganizations(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [scope, isAuthReady, token, isAdmin]);

  const key = `${status}|${tier}|${issuer}|${search}|${page}|${limit}|${reload}`;
  useEffect(() => {
    if (!isAuthReady || !token || !canManage) return;
    let cancelled = false;
    AccessCodesApi.list(token, { status, tier, search, organizationId: scope === "platform" ? issuer : undefined, page, limit }).then((result) => {
      if (cancelled) return;
      setLoaded(result.ok ? { key, data: result.data } : { key, error: result.error });
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, canManage, scope, status, tier, issuer, search, page, limit, key]);

  const refresh = () => setReload((n) => n + 1);
  const data = loaded?.data;
  const loading = loaded?.key !== key;
  const total = data?.total ?? 0;
  const lastPage = Math.max(Math.ceil(total / limit), 1);
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const filtered = status !== "" || tier !== "" || issuer !== "" || search !== "";

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast("Code copied.");
    } catch {
      showToast("Could not copy. Select the code and copy it by hand.", "error");
    }
  };

  const resend = async (code: AccessCode) => {
    if (!token) return;
    const result = await AccessCodesApi.resend(token, code.id);
    if (!result.ok) showToast(result.error, "error");
    else showToast(result.data.emailDelivered ? `Code sent again to ${code.email}.` : "The email couldn't be delivered. Copy the code and send it yourself.", result.data.emailDelivered ? "success" : "error");
  };

  const summary = data?.summary;
  const tiles: { status: AccessCodeStatus; label: string; hint: string }[] = [
    { status: "redeemed", label: "Active now", hint: "Access running" },
    { status: "pending", label: "Not redeemed", hint: "Waiting for the seller" },
    { status: "expired", label: "Expired", hint: "Ran out or went unused" },
    { status: "ended", label: "Ended", hint: "Stopped by an admin" },
  ];

  return (
    <PageFrame
      title="Access codes"
      action={
        canManage ? (
          <PrimaryButton onClick={() => setCreating(true)} className="whitespace-nowrap">
            New access code
          </PrimaryButton>
        ) : undefined
      }
    >
      <RequirePermission granted={canManage}>
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map((tile) => {
            const active = status === tile.status;
            return (
              <button
                key={tile.status}
                type="button"
                onClick={() => {
                  setStatus(active ? "" : tile.status);
                  setPage(1);
                }}
                aria-pressed={active}
                className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition-colors ${active ? "border-slate-900" : "border-slate-200 hover:border-slate-300"}`}
              >
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{tile.label}</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{summary ? summary[tile.status] : "–"}</p>
                <p className="text-xs text-slate-500">{tile.hint}</p>
              </button>
            );
          })}
        </div>

        <Card className="mb-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Filters</p>
          <div className={`grid gap-3 sm:grid-cols-2 ${scope === "platform" ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
            <label className="text-sm font-bold text-slate-700">
              Search
              <input className={`${fieldClass} mt-1`} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Code or email" />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Status
              <Select
                className={`${fieldClass} mt-1`}
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as AccessCodeStatus | "");
                  setPage(1);
                }}
              >
                <option value="">Any status</option>
                {(Object.keys(ACCESS_CODE_STATUS_LABELS) as AccessCodeStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {ACCESS_CODE_STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-sm font-bold text-slate-700">
              Plan
              <Select
                className={`${fieldClass} mt-1`}
                value={tier}
                onChange={(e) => {
                  setTier(e.target.value as AccessCodeTier | "");
                  setPage(1);
                }}
              >
                <option value="">Any plan</option>
                {TIERS.map((t) => (
                  <option key={t} value={t}>
                    {PLAN_LABELS[t]}
                  </option>
                ))}
              </Select>
            </label>
            {scope === "platform" && (
              <label className="text-sm font-bold text-slate-700">
                Issued by
                <Select
                  className={`${fieldClass} mt-1`}
                  value={issuer}
                  onChange={(e) => {
                    setIssuer(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Everyone</option>
                  <option value="platform">Platform admins</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </Select>
              </label>
            )}
          </div>
          {filtered && (
            <button
              type="button"
              className="mt-3 text-xs font-bold text-slate-500 underline"
              onClick={() => {
                setStatus("");
                setTier("");
                setIssuer("");
                setSearchInput("");
                setSearch("");
                setPage(1);
              }}
            >
              Clear filters
            </button>
          )}
        </Card>

        {loaded?.error ? (
          <Card className="border-red-100 bg-red-50/60 text-sm text-red-700">
            {loaded.error}{" "}
            <button className="font-bold underline" onClick={refresh}>
              Retry
            </button>
          </Card>
        ) : loading && !data ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading access codes…</p>
        ) : data && data.accessCodes.length ? (
          <>
            <AdminTable headers={["Code", "Recipient", "Plan", "Days", "Status", "Created", "Redeemed", "Access expires", ...(scope === "platform" ? ["Issued by"] : []), "Actions"]}>
              {data.accessCodes.map((item) => (
                <tr key={item.id} className="align-top transition-colors hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-900">{item.code}</span>
                      <button type="button" onClick={() => copy(item.code)} aria-label={`Copy code ${item.code}`} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {item.email}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">{item.tierLabel}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.days}</td>
                  <td className="px-6 py-4">
                    <CodeStatusPill status={item.status} />
                    {item.status === "redeemed" && item.daysLeft !== undefined && <p className="mt-1 text-xs text-slate-500">{item.daysLeft === 0 ? "Ends today" : `${item.daysLeft} day${item.daysLeft === 1 ? "" : "s"} left`}</p>}
                    {item.status === "pending" && <p className="mt-1 text-xs text-slate-500">Use by {formatDate(item.redeemBy)}</p>}
                    {item.endReason && (item.status === "ended" || item.status === "cancelled") && <p className="mt-1 max-w-44 text-xs text-slate-500">{item.endReason}</p>}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatDate(item.createdAt)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.redeemedAt ? formatDate(item.redeemedAt) : "—"}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.accessEndsAt ? formatDate(item.accessEndsAt) : "—"}</td>
                  {scope === "platform" && <td className="px-6 py-4 text-sm text-slate-600">{item.organizationName ?? "Platform"}</td>}
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {item.status === "pending" && (
                        <>
                          <SecondaryButton className="min-h-0! px-3! py-1.5! text-xs!" onClick={() => resend(item)}>
                            Resend
                          </SecondaryButton>
                          <SecondaryButton className="min-h-0! px-3! py-1.5! text-xs! text-red-600!" onClick={() => setEndTarget({ code: item, mode: "cancel" })}>
                            Cancel code
                          </SecondaryButton>
                        </>
                      )}
                      {item.status === "redeemed" && (
                        <>
                          <SecondaryButton className="min-h-0! px-3! py-1.5! text-xs!" onClick={() => setExtendTarget(item)}>
                            Extend
                          </SecondaryButton>
                          <SecondaryButton className="min-h-0! px-3! py-1.5! text-xs! text-red-600!" onClick={() => setEndTarget({ code: item, mode: "end" })}>
                            End access
                          </SecondaryButton>
                        </>
                      )}
                      {(item.status === "expired" || item.status === "ended" || item.status === "cancelled") && <span className="text-xs text-slate-400">—</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </AdminTable>

            <div className="mt-5 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 font-semibold">
                Items per page
                <Select
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </Select>
              </label>
              <div className="flex items-center gap-3">
                <span>
                  Showing {from} to {to} of {total} access {total === 1 ? "code" : "codes"}
                </span>
                <div className="flex items-center gap-1">
                  <SecondaryButton aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="min-h-9! px-3! py-1.5!">
                    ‹
                  </SecondaryButton>
                  <span className="min-w-9 rounded-lg bg-[#2ec440] px-3 py-1.5 text-center text-sm font-bold text-white">{page}</span>
                  <SecondaryButton aria-label="Next page" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)} className="min-h-9! px-3! py-1.5!">
                    ›
                  </SecondaryButton>
                </div>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            title={filtered ? "No access codes match" : "No access codes yet"}
            description={filtered ? "Try a different search or filter." : "Create a code to give a seller time-limited access to a paid plan."}
            action={!filtered && canManage ? <PrimaryButton onClick={() => setCreating(true)}>New access code</PrimaryButton> : undefined}
          />
        )}
      </RequirePermission>

      <NewCodeDialog open={creating} onClose={() => setCreating(false)} onCreated={refresh} token={token} />

      <ReasonFormModal
        key={endTarget ? `${endTarget.code.id}-${endTarget.mode}` : "end-closed"}
        open={endTarget !== null}
        onClose={() => setEndTarget(null)}
        title={endTarget?.mode === "cancel" ? "Cancel this code?" : "End this access now?"}
        description={
          endTarget
            ? endTarget.mode === "cancel"
              ? `${endTarget.code.code} for ${endTarget.code.email} will stop working. They haven't used it yet.`
              : `${endTarget.code.email} loses their ${endTarget.code.tierLabel} access immediately, and goes back to the plan they had before. They're told by email and notification.`
            : undefined
        }
        reasonLabel="Reason (optional, the seller sees it)"
        reasonRequired={false}
        submitLabel={endTarget?.mode === "cancel" ? "Cancel code" : "End access"}
        destructive
        onSubmit={async ({ reason, note }) => {
          if (!endTarget || !token) return;
          const result = await AccessCodesApi.end(token, endTarget.code.id, [reason, note].filter(Boolean).join(" - ") || undefined);
          if (!result.ok) {
            showToast(result.error, "error");
            return;
          }
          showToast(endTarget.mode === "cancel" ? "Code cancelled." : "Access ended.");
          setEndTarget(null);
          refresh();
        }}
      />

      <ExtendDialog code={extendTarget} onClose={() => setExtendTarget(null)} onExtended={refresh} token={token} />
    </PageFrame>
  );
}

const softField = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none transition focus:border-[#2ec440] focus:ring-2 focus:ring-[#2ec440]/15 placeholder:text-slate-400";
const softLabel = "block text-sm font-medium text-slate-600";
const softButton = "min-h-10! px-4! py-2! text-sm! font-semibold! shadow-none!";

function NewCodeDialog({ open, onClose, onCreated, token }: { open: boolean; onClose: () => void; onCreated: () => void; token: string | null }) {
  const titleId = useId();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<AccessCodeTier>("silver");
  const [days, setDays] = useState("30");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ code: string; email: string; delivered: boolean } | null>(null);

  const reset = () => {
    setEmail("");
    setTier("silver");
    setDays("30");
    setError("");
    setCreated(null);
  };
  const close = () => {
    onClose();
    reset();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || busy) return;
    const dayCount = Number(days);
    if (!Number.isInteger(dayCount) || dayCount < 1 || dayCount > ACCESS_CODE_MAX_DAYS) {
      setError(`Days must be a whole number from 1 to ${ACCESS_CODE_MAX_DAYS}.`);
      return;
    }
    setBusy(true);
    setError("");
    const result = await AccessCodesApi.create(token, { email: email.trim(), tier, days: dayCount });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCreated({ code: result.data.accessCode.code, email: result.data.accessCode.email, delivered: result.data.emailDelivered });
    onCreated();
  };

  return (
    <Dialog open={open} onClose={close} labelledBy={titleId} panelClassName="max-w-md">
      {created ? (
        <div className="p-6">
          <h2 id={titleId} className="mb-1 text-lg font-semibold text-slate-900">
            Access code created
          </h2>
          <p className={`mb-4 text-sm ${created.delivered ? "text-slate-500" : "text-amber-700"}`}>
            {created.delivered ? `Emailed to ${created.email}.` : `The email to ${created.email} couldn't be delivered. Copy the code and send it yourself.`}
          </p>
          <div className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="font-mono text-lg font-semibold tracking-wider text-slate-900">{created.code}</span>
            <SecondaryButton
              className={softButton}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(created.code);
                  showToast("Code copied.");
                } catch {
                  showToast("Could not copy. Select the code and copy it by hand.", "error");
                }
              }}
            >
              Copy
            </SecondaryButton>
          </div>
          <div className="flex justify-end gap-2">
            <SecondaryButton className={softButton} onClick={reset}>
              Create another
            </SecondaryButton>
            <PrimaryButton className={softButton} onClick={close}>
              Done
            </PrimaryButton>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="p-6">
          <h2 id={titleId} className="mb-5 pr-6 text-lg font-semibold text-slate-900">
            New access code
          </h2>
          <div className="space-y-4">
            <label className={softLabel}>
              Recipient email
              <input type="email" required autoFocus className={`${softField} mt-1.5`} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="person@example.com" />
            </label>
            <label className={softLabel}>
              Plan
              <Select className={`${softField} mt-1.5`} value={tier} onChange={(e) => setTier(e.target.value as AccessCodeTier)}>
                {TIERS.map((t) => (
                  <option key={t} value={t}>
                    {PLAN_LABELS[t]}: {tierHint(t)}
                  </option>
                ))}
              </Select>
            </label>
            <div>
              <label htmlFor={`${titleId}-days`} className={softLabel}>
                Days of access (1 to {ACCESS_CODE_MAX_DAYS})
              </label>
              <input id={`${titleId}-days`} type="number" min={1} max={ACCESS_CODE_MAX_DAYS} required className={`${softField} mt-1.5`} value={days} onChange={(e) => setDays(e.target.value)} />
              <div className="mt-2 flex gap-2">
                {QUICK_DAYS.map((d) => (
                  <button key={d} type="button" onClick={() => setDays(String(d))} className={`rounded-full border px-3 py-1 text-xs font-medium ${days === String(d) ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                    {d} days
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <SecondaryButton type="button" className={softButton} onClick={close}>
              Close
            </SecondaryButton>
            <PrimaryButton type="submit" className={softButton} disabled={busy || !email.trim()}>
              {busy ? "Creating…" : "Create & send"}
            </PrimaryButton>
          </div>
        </form>
      )}
    </Dialog>
  );
}

function ExtendDialog({ code, onClose, onExtended, token }: { code: AccessCode | null; onClose: () => void; onExtended: () => void; token: string | null }) {
  const titleId = useId();
  const { showToast } = useToast();
  const [days, setDays] = useState("7");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const add = Number(days);
  const room = code ? ACCESS_CODE_MAX_TOTAL_DAYS - code.days : 0;
  const valid = Number.isInteger(add) && add >= 1 && add <= Math.min(ACCESS_CODE_MAX_DAYS, room);
  const newEnd = code?.accessEndsAt && valid ? new Date(new Date(code.accessEndsAt).getTime() + add * 24 * 60 * 60 * 1000) : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !token || !valid || busy) return;
    setBusy(true);
    setError("");
    const result = await AccessCodesApi.extend(token, code.id, add);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    showToast(`Access extended by ${add} day${add === 1 ? "" : "s"}.`);
    onExtended();
    onClose();
  };

  return (
    <Dialog open={code !== null} onClose={onClose} labelledBy={titleId} panelClassName="max-w-sm">
      {code && (
        <form onSubmit={submit} className="p-6">
          <h2 id={titleId} className="mb-1 pr-6 text-lg font-semibold text-slate-900">
            Extend access
          </h2>
          <p className="mb-5 text-sm text-slate-500">
            {code.email} · {code.tierLabel} until {code.accessEndsAt ? formatDate(code.accessEndsAt) : "—"}
          </p>
          <label className={softLabel}>
            Days to add
            <input type="number" min={1} max={Math.min(ACCESS_CODE_MAX_DAYS, room)} className={`${softField} mt-1.5`} value={days} onChange={(e) => setDays(e.target.value)} autoFocus />
          </label>
          {(room <= 0 || newEnd) && <p className="mt-2 text-xs text-slate-500">{room <= 0 ? `This code is at the ${ACCESS_CODE_MAX_TOTAL_DAYS}-day limit.` : `New end date: ${formatDate(newEnd!.toISOString())}`}</p>}
          {error && <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <SecondaryButton type="button" className={softButton} onClick={onClose}>
              Close
            </SecondaryButton>
            <PrimaryButton type="submit" className={softButton} disabled={!valid || busy}>
              {busy ? "Saving…" : "Extend access"}
            </PrimaryButton>
          </div>
        </form>
      )}
    </Dialog>
  );
}
