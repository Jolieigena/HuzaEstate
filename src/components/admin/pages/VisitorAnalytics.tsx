"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AdminTable, Card, EmptyState, PageFrame, PrimaryButton, RequirePermission, SecondaryButton, fieldClass, formatDateTime } from "@/components/admin/ui";
import { useAuth } from "@/lib/auth-context";
import { useIsAdministrator } from "@/lib/admin/hooks";
import { countryFlagUrl } from "@/lib/countries";
import { AnalyticsApi, RETENTION_DAYS, type AnalyticsRange, type AnalyticsSummary, type VisitorRow } from "@/lib/analytics/api";

const VisitorMap = dynamic(() => import("@/components/analytics/VisitorMap"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">Loading map…</div>,
});

type Tab = "overview" | "places" | "trends" | "visitors";

const PRESETS: { label: string; days: number }[] = [
  { label: "Today", days: 1 },
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];
const LIMIT = 25;
const DAY_MS = 24 * 3600 * 1000;

const number = (n: number) => n.toLocaleString("en-US");
const place = (v: { city?: string; country?: string }) => [v.city, v.country].filter(Boolean).join(", ") || "Unknown";
const dayText = (key: string) => new Date(`${key}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const isPreset = (range: AnalyticsRange, days: number) => "days" in range && range.days === days;

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-900">{number(value)}</p>
    </Card>
  );
}

function Flag({ code, name }: { code?: string; name?: string }) {
  if (!code) return <span className="inline-block h-4 w-6" aria-hidden="true" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={countryFlagUrl(code)} alt="" title={name} className="inline-block h-4 w-6 rounded-sm object-cover" />;
}

/** Where landing page visitors are in the world, for platform administrators. A period (today, the last few days, or any dates
 *  within the days data is kept) applies to every tab: Overview (numbers and map), Places (countries and cities), Trends (visits per
 *  day, devices, where they came from) and Visitors (one row per address). */
export function VisitorAnalyticsPage() {
  const { token, isAuthReady } = useAuth();
  const isAdministrator = useIsAdministrator();
  const [range, setRange] = useState<AnalyticsRange>({ days: 30 });
  const [tab, setTab] = useState<Tab>("overview");
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [visitors, setVisitors] = useState<{ rows: VisitorRow[]; total: number } | null>(null);

  // The custom period: a number of days, or two dates. Dates are offered only inside the days data is kept.
  const [customOpen, setCustomOpen] = useState(false);
  const [daysText, setDaysText] = useState("14");
  const [fromDay, setFromDay] = useState("");
  const [toDay, setToDay] = useState("");
  const [customError, setCustomError] = useState("");
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const [earliest] = useState(() => new Date(Date.now() - (RETENTION_DAYS - 1) * DAY_MS).toISOString().slice(0, 10));

  // Typing waits a moment before searching so each keystroke is not a request.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!isAuthReady || !token || !isAdministrator) return;
    let cancelled = false;
    AnalyticsApi.summary(token, range).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setSummary(result.data);
        setError("");
      } else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, isAdministrator, range]);

  useEffect(() => {
    if (!isAuthReady || !token || !isAdministrator) return;
    let cancelled = false;
    AnalyticsApi.visitors(token, { range, search: query, page, limit: LIMIT }).then((result) => {
      if (!cancelled && result.ok) setVisitors({ rows: result.data.visitors, total: result.data.total });
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, isAdministrator, range, query, page]);

  const choose = (next: AnalyticsRange) => {
    setRange(next);
    setPage(1);
    setCustomError("");
  };

  const applyDays = () => {
    const n = Math.floor(Number(daysText));
    if (!Number.isFinite(n) || n < 1 || n > RETENTION_DAYS) {
      setCustomError(`Enter a number of days from 1 to ${RETENTION_DAYS}.`);
      return;
    }
    choose({ days: n });
  };

  const applyDates = () => {
    if (!fromDay || !toDay) {
      setCustomError("Choose both dates.");
      return;
    }
    const [from, to] = fromDay <= toDay ? [fromDay, toDay] : [toDay, fromDay];
    choose({ from, to });
  };

  const customActive = !PRESETS.some((p) => isPreset(range, p.days));
  const maxDay = Math.max(1, ...(summary?.daily ?? []).map((d) => d.visits));
  const pages = visitors ? Math.max(1, Math.ceil(visitors.total / LIMIT)) : 1;
  const tabs: { id: Tab; label: string; badge?: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "places", label: "Places", badge: summary ? String(summary.totals.countries) : undefined },
    { id: "trends", label: "Trends" },
    { id: "visitors", label: "Visitors", badge: visitors ? String(visitors.total) : undefined },
  ];

  return (
    <PageFrame
      title="Visitor analytics"
      action={
        <div className="flex flex-wrap gap-2" role="group" aria-label="Period">
          {PRESETS.map((p) => (
            <button
              key={p.days}
              type="button"
              aria-pressed={isPreset(range, p.days)}
              onClick={() => {
                setCustomOpen(false);
                choose({ days: p.days });
              }}
              className={`min-h-11 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${isPreset(range, p.days) ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={customActive || customOpen}
            aria-expanded={customOpen}
            onClick={() => setCustomOpen((open) => !open)}
            className={`min-h-11 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${customActive || customOpen ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
          >
            Custom
          </button>
        </div>
      }
    >
      <RequirePermission granted={isAdministrator}>
        {customOpen && (
          <Card className="mb-5">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm font-bold text-slate-700">Last number of days</p>
                <div className="mt-2 flex gap-2">
                  <input className={`${fieldClass} !w-28`} type="number" inputMode="numeric" min={1} max={RETENTION_DAYS} value={daysText} onChange={(e) => setDaysText(e.target.value)} aria-label="Number of days" />
                  <PrimaryButton type="button" onClick={applyDays}>
                    Show
                  </PrimaryButton>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">Between two dates</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input className={`${fieldClass} !w-44`} type="date" min={earliest} max={today} value={fromDay} onChange={(e) => setFromDay(e.target.value)} aria-label="From" />
                  <span className="text-sm font-semibold text-slate-400">to</span>
                  <input className={`${fieldClass} !w-44`} type="date" min={earliest} max={today} value={toDay} onChange={(e) => setToDay(e.target.value)} aria-label="To" />
                  <PrimaryButton type="button" onClick={applyDates}>
                    Show
                  </PrimaryButton>
                </div>
              </div>
            </div>
            {customError && <p role="alert" className="mt-3 text-sm font-semibold text-red-600">{customError}</p>}
          </Card>
        )}

        {error ? (
          <Card className="border-red-100 bg-red-50/60 text-sm text-red-700">{error}</Card>
        ) : !summary ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading…</p>
        ) : (
          <div>
            <p className="mb-4 text-sm font-semibold text-slate-500">{summary.from === summary.to ? dayText(summary.from) : `${dayText(summary.from)} to ${dayText(summary.to)}`}</p>

            {summary.withoutAddress > 0 && (
              <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                {number(summary.withoutAddress)} visit{summary.withoutAddress === 1 ? "" : "s"} in this period could not be placed: the server did not receive the visitor&apos;s address. The web server in front of the API needs to pass it on (the X-Real-IP and X-Forwarded-For headers).
              </p>
            )}

            <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Visitor analytics">
              {tabs.map((t) => {
                const active = t.id === tab;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(t.id)}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-bold transition-colors ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
                  >
                    {t.label}
                    {t.badge && <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>{t.badge}</span>}
                  </button>
                );
              })}
            </div>

            {tab === "overview" && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Tile label="Visits" value={summary.totals.visits} />
                  <Tile label="Visitors (by address)" value={summary.totals.uniqueVisitors} />
                  <Tile label="Countries" value={summary.totals.countries} />
                  <Tile label="Cities" value={summary.totals.cities} />
                </div>
                <Card className="!p-3">
                  <div className="h-[460px] overflow-hidden rounded-2xl">{summary.points.length > 0 ? <VisitorMap points={summary.points} /> : <EmptyState title="No visits with a known place in this period" />}</div>
                  {summary.totals.unknownLocation > 0 && <p className="px-2 pb-1 pt-3 text-xs font-semibold text-slate-500">{number(summary.totals.unknownLocation)} visit{summary.totals.unknownLocation === 1 ? "" : "s"} could not be placed on the map.</p>}
                </Card>
              </div>
            )}

            {tab === "places" && (
              <div className="grid gap-6 lg:grid-cols-2">
                <section>
                  <h2 className="mb-3 text-lg font-black text-slate-900">Countries</h2>
                  {summary.countries.length === 0 ? (
                    <EmptyState title="Nothing in this period" />
                  ) : (
                    <AdminTable headers={["Country", "Visits", "Visitors"]}>
                      {summary.countries.map((c) => (
                        <tr key={c.code}>
                          <td className="px-6 py-3 text-sm font-bold text-slate-900">
                            <span className="inline-flex items-center gap-3">
                              <Flag code={c.code} name={c.country} />
                              {c.country}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-sm text-slate-700">{number(c.visits)}</td>
                          <td className="px-6 py-3 text-sm text-slate-700">{number(c.unique)}</td>
                        </tr>
                      ))}
                    </AdminTable>
                  )}
                </section>
                <section>
                  <h2 className="mb-3 text-lg font-black text-slate-900">Cities</h2>
                  {summary.cities.length === 0 ? (
                    <EmptyState title="Nothing in this period" />
                  ) : (
                    <AdminTable headers={["City", "Visits", "Visitors"]}>
                      {summary.cities.map((c) => (
                        <tr key={`${c.code}|${c.city}`}>
                          <td className="px-6 py-3 text-sm font-bold text-slate-900">
                            <span className="inline-flex items-center gap-3">
                              <Flag code={c.code} name={c.country} />
                              {c.city}
                              {c.country && <span className="font-normal text-slate-400">{c.country}</span>}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-sm text-slate-700">{number(c.visits)}</td>
                          <td className="px-6 py-3 text-sm text-slate-700">{number(c.unique)}</td>
                        </tr>
                      ))}
                    </AdminTable>
                  )}
                </section>
              </div>
            )}

            {tab === "trends" && (
              <div className="space-y-6">
                <Card>
                  <h2 className="mb-4 font-black text-slate-900">Visits per day</h2>
                  <div className="flex h-44 items-end gap-px" role="img" aria-label="Visits per day">
                    {summary.daily.map((d) => (
                      <div key={d.date} className="flex h-full flex-1 items-end" title={`${dayText(d.date)}: ${d.visits} visit${d.visits === 1 ? "" : "s"}, ${d.unique} visitor${d.unique === 1 ? "" : "s"}`}>
                        <div className={`w-full rounded-t ${d.visits > 0 ? "bg-[#2ec440]" : "bg-slate-100"}`} style={{ height: d.visits > 0 ? `${Math.max(4, (d.visits / maxDay) * 100)}%` : "2px" }} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] font-semibold text-slate-400">
                    <span>{summary.daily[0] && dayText(summary.daily[0].date)}</span>
                    <span>{summary.daily.length > 1 && dayText(summary.daily[summary.daily.length - 1].date)}</span>
                  </div>
                </Card>
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <h2 className="mb-3 font-black text-slate-900">Devices</h2>
                    <p className="text-sm text-slate-700">
                      <span className="font-black text-slate-900">{number(summary.devices.desktop ?? 0)}</span> on a computer, <span className="font-black text-slate-900">{number(summary.devices.mobile ?? 0)}</span> on a phone
                    </p>
                  </Card>
                  <Card>
                    <h2 className="mb-3 font-black text-slate-900">Where they came from</h2>
                    {summary.referrers.length === 0 ? (
                      <p className="text-sm font-semibold text-slate-500">Mostly direct visits.</p>
                    ) : (
                      <ul className="space-y-1.5 text-sm text-slate-700">
                        {summary.referrers.map((r) => (
                          <li key={r.host} className="flex justify-between gap-3">
                            <span className="truncate">{r.host}</span>
                            <span className="font-bold text-slate-900">{number(r.visits)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                </div>
              </div>
            )}

            {tab === "visitors" && (
              <section>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-black text-slate-900">Visitors by address</h2>
                  <input className={`${fieldClass} !w-64`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Address, city or country" aria-label="Search visitors" />
                </div>
                {!visitors ? (
                  <p className="py-6 text-center text-sm font-semibold text-slate-400">Loading…</p>
                ) : visitors.rows.length === 0 ? (
                  <EmptyState title="No visitors found" />
                ) : (
                  <>
                    <AdminTable headers={["Address", "Place", "Device", "Visits", "First seen", "Last seen"]}>
                      {visitors.rows.map((v) => (
                        <tr key={v.id} className="transition-colors hover:bg-slate-50/50">
                          <td className="px-6 py-3 text-sm font-semibold text-slate-900">
                            {v.ip}
                            {v.shortened && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">shortened</span>}
                          </td>
                          <td className="px-6 py-3 text-sm text-slate-700">
                            <span className="inline-flex items-center gap-3">
                              <Flag code={v.countryCode} name={v.country} />
                              {place(v)}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-sm capitalize text-slate-600">{v.device}</td>
                          <td className="px-6 py-3 text-sm text-slate-700">{number(v.visits)}</td>
                          <td className="px-6 py-3 text-xs text-slate-500">{formatDateTime(v.firstSeen)}</td>
                          <td className="px-6 py-3 text-xs text-slate-500">{formatDateTime(v.lastSeen)}</td>
                        </tr>
                      ))}
                    </AdminTable>
                    {pages > 1 && (
                      <div className="mt-5 flex items-center justify-between text-sm font-bold text-slate-600">
                        <SecondaryButton disabled={page <= 1} onClick={() => setPage((n) => n - 1)}>
                          Previous
                        </SecondaryButton>
                        <span>
                          Page {page} of {pages}
                        </span>
                        <SecondaryButton disabled={page >= pages} onClick={() => setPage((n) => n + 1)}>
                          Next
                        </SecondaryButton>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}
          </div>
        )}
      </RequirePermission>
    </PageFrame>
  );
}
