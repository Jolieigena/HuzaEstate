"use client";

import { useEffect, useId, useState } from "react";
import dynamic from "next/dynamic";
import Dialog from "@/components/Dialog";
import { AdminTable, Card, EmptyState, PageFrame, PrimaryButton, RequirePermission, SecondaryButton, fieldClass, formatDateTime } from "@/components/admin/ui";
import { useAuth } from "@/lib/auth-context";
import { useIsAdministrator } from "@/lib/admin/hooks";
import { countryFlagUrl } from "@/lib/countries";
import { AnalyticsApi, RETENTION_DAYS, type AccountRef, type AnalyticsFilters, type AnalyticsRange, type AnalyticsSummary, type MapPoint, type VisitorDetail, type VisitorRow } from "@/lib/analytics/api";

const VisitorMap = dynamic(() => import("@/components/analytics/VisitorMap"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">Loading map…</div>,
});

type Tab = "overview" | "places" | "pages" | "trends" | "visitors";

const PRESETS: { label: string; days: number }[] = [
  { label: "Today", days: 1 },
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];
const AUDIENCES: { value: AnalyticsFilters["audience"]; label: string }[] = [
  { value: undefined, label: "Everyone" },
  { value: "member", label: "Signed in" },
  { value: "guest", label: "Not signed in" },
];
const LIMIT = 25;
const DAY_MS = 24 * 3600 * 1000;

const number = (n: number) => n.toLocaleString("en-US");
const place = (v: { city?: string; country?: string }) => [v.city, v.country].filter(Boolean).join(", ") || "Unknown";
const dayText = (key: string) => new Date(`${key}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const isPreset = (range: AnalyticsRange, days: number) => "days" in range && range.days === days;
const pageName = (page: string) => (page === "/" ? "Landing page" : page === "/home" ? "Home page" : page);

function Flag({ code, name }: { code?: string; name?: string }) {
  if (!code) return <span className="inline-block h-4 w-6" aria-hidden="true" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={countryFlagUrl(code)} alt="" title={name} className="inline-block h-4 w-6 rounded-sm object-cover" />;
}

/** A number that can be clicked to narrow every report to it. */
function Pick({ onClick, active, children, label }: { onClick: () => void; active?: boolean; children: React.ReactNode; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} aria-label={label} className={`text-left font-bold underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ec440] ${active ? "text-[#219b31]" : "text-slate-900"}`}>
      {children}
    </button>
  );
}

function Tile({ label, value, note, onClick, active }: { label: string; value: number; note?: string; onClick?: () => void; active?: boolean }) {
  const body = (
    <>
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-900">{number(value)}</p>
      {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} aria-pressed={active} className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition-colors hover:border-[#2ec440] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ec440] ${active ? "border-[#2ec440] bg-[#2ec440]/5" : "border-slate-200"}`}>
      {body}
    </button>
  ) : (
    <Card>{body}</Card>
  );
}

function AccountBadge({ account }: { account: AccountRef }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2ec440]/10 px-2.5 py-0.5 text-xs font-bold text-[#219b31]" title={account.email}>
      {account.name}
      <span className="font-medium text-slate-500">{account.role}</span>
    </span>
  );
}

/** Where visitors to the public pages are in the world, and whether they were signed in, for platform administrators. A period (today,
 *  the last few days, or any dates within the days data is kept) and any clicked-through filters apply to every tab: Overview (numbers and
 *  map), Places (countries and cities), Pages, Trends (views per day, devices, where they came from) and Visitors (one row per address,
 *  each opening that address's history). */
export function VisitorAnalyticsPage() {
  const { token, isAuthReady } = useAuth();
  const isAdministrator = useIsAdministrator();
  const titleId = useId();
  const [range, setRange] = useState<AnalyticsRange>({ days: 30 });
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [tab, setTab] = useState<Tab>("overview");
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [visitors, setVisitors] = useState<{ rows: VisitorRow[]; total: number } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<VisitorDetail | null>(null);
  const [detailError, setDetailError] = useState("");

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    AnalyticsApi.summary(token, range, filters).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (result.ok) {
        setSummary(result.data);
        setError("");
      } else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, isAdministrator, range, filters]);

  useEffect(() => {
    if (!isAuthReady || !token || !isAdministrator) return;
    let cancelled = false;
    AnalyticsApi.visitors(token, { range, filters, search: query, page, limit: LIMIT }).then((result) => {
      if (!cancelled && result.ok) setVisitors({ rows: result.data.visitors, total: result.data.total });
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, isAdministrator, range, filters, query, page]);

  useEffect(() => {
    if (!detailId || !token) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDetail(null);
    setDetailError("");
    AnalyticsApi.visitor(token, detailId, range).then((result) => {
      if (cancelled) return;
      if (result.ok) setDetail(result.data);
      else setDetailError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [detailId, token, range]);

  const choose = (next: AnalyticsRange) => {
    setRange(next);
    setPage(1);
    setCustomError("");
  };

  /** Narrows every report to one more thing; clicking the same thing again lets go of it. */
  const narrow = (patch: AnalyticsFilters, toTab?: Tab) => {
    setFilters((current) => {
      const next: AnalyticsFilters = { ...current };
      for (const [key, value] of Object.entries(patch) as [keyof AnalyticsFilters, string | undefined][]) {
        if (next[key] === value) delete next[key];
        else (next as Record<string, string | undefined>)[key] = value;
      }
      return next;
    });
    setPage(1);
    if (toTab) setTab(toTab);
  };
  const drop = (key: keyof AnalyticsFilters) => {
    setFilters((current) => {
      const next = { ...current };
      delete next[key];
      if (key === "country") delete next.city;
      return next;
    });
    setPage(1);
  };
  const pickPoint = (p: MapPoint) => {
    setFilters((current) => ({ ...current, country: p.code, ...(p.city ? { city: p.city } : {}) }));
    setPage(1);
    setTab("visitors");
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
  const maxCountry = Math.max(1, ...(summary?.countries ?? []).map((c) => c.visits));
  const pages = visitors ? Math.max(1, Math.ceil(visitors.total / LIMIT)) : 1;
  const countryName = (code?: string) => summary?.countries.find((c) => c.code === code)?.country ?? code ?? "";
  const chips: { key: keyof AnalyticsFilters; label: string }[] = [];
  if (filters.country) chips.push({ key: "country", label: countryName(filters.country) });
  if (filters.city) chips.push({ key: "city", label: filters.city });
  if (filters.device) chips.push({ key: "device", label: filters.device === "mobile" ? "On a phone" : "On a computer" });
  if (filters.referrer) chips.push({ key: "referrer", label: filters.referrer === "direct" ? "Direct visits" : `From ${filters.referrer}` });
  if (filters.page) chips.push({ key: "page", label: pageName(filters.page) });
  if (filters.day) chips.push({ key: "day", label: dayText(filters.day) });
  const tabs: { id: Tab; label: string; badge?: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "places", label: "Places", badge: summary ? String(summary.totals.countries) : undefined },
    { id: "pages", label: "Pages", badge: summary ? String(summary.pages.length) : undefined },
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
            {customError && (
              <p role="alert" className="mt-3 text-sm font-semibold text-red-600">
                {customError}
              </p>
            )}
          </Card>
        )}

        {error && !summary ? (
          <Card className="border-red-100 bg-red-50/60 text-sm text-red-700">{error}</Card>
        ) : !summary ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading…</p>
        ) : (
          <div className={loading ? "opacity-70 transition-opacity" : "transition-opacity"}>
            <p className="mb-4 text-sm font-semibold text-slate-500">{summary.from === summary.to ? dayText(summary.from) : `${dayText(summary.from)} to ${dayText(summary.to)}`}</p>

            {summary.withoutAddress > 0 && (
              <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                {number(summary.withoutAddress)} visit{summary.withoutAddress === 1 ? "" : "s"} in this period could not be placed: the server did not receive the visitor&apos;s address. The web server in front of the API needs to pass it on (the X-Real-IP and X-Forwarded-For headers).
              </p>
            )}

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Visitor analytics">
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
              <div className="flex rounded-full border border-slate-200 bg-white p-1" role="group" aria-label="Who">
                {AUDIENCES.map((a) => {
                  const active = filters.audience === a.value;
                  return (
                    <button
                      key={a.label}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setFilters((current) => {
                          const next = { ...current };
                          if (a.value) next.audience = a.value;
                          else delete next.audience;
                          return next;
                        });
                        setPage(1);
                      }}
                      className={`min-h-9 rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${active ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}
                    >
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {chips.length > 0 && (
              <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Narrowed to">
                {chips.map((c) => (
                  <button key={c.key} type="button" onClick={() => drop(c.key)} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#2ec440] bg-[#2ec440]/10 px-4 py-1.5 text-sm font-bold text-[#219b31] hover:bg-[#2ec440]/20" aria-label={`Remove ${c.label}`}>
                    {c.label}
                    <span aria-hidden="true">×</span>
                  </button>
                ))}
                <button type="button" onClick={() => setFilters(filters.audience ? { audience: filters.audience } : {})} className="text-sm font-bold text-slate-500 underline hover:text-slate-900">
                  Clear
                </button>
              </div>
            )}

            {tab === "overview" && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Tile label="Page views" value={summary.totals.visits} />
                  <Tile label="Visitors (by address)" value={summary.totals.uniqueVisitors} />
                  <Tile label="Signed in" value={summary.audience.member.people} note={`${number(summary.audience.member.views)} view${summary.audience.member.views === 1 ? "" : "s"}`} active={filters.audience === "member"} onClick={() => narrow({ audience: "member" })} />
                  <Tile label="Not signed in" value={summary.audience.guest.people} note={`${number(summary.audience.guest.views)} view${summary.audience.guest.views === 1 ? "" : "s"}`} active={filters.audience === "guest"} onClick={() => narrow({ audience: "guest" })} />
                </div>
                <div className="grid gap-6 xl:grid-cols-3">
                  <Card className="!p-3 xl:col-span-2">
                    <div className="h-[460px] overflow-hidden rounded-2xl">{summary.points.length > 0 ? <VisitorMap points={summary.points} onPick={pickPoint} /> : <EmptyState title="No visits with a known place in this selection" />}</div>
                    {summary.totals.unknownLocation > 0 && (
                      <p className="px-2 pb-1 pt-3 text-xs font-semibold text-slate-500">
                        {number(summary.totals.unknownLocation)} view{summary.totals.unknownLocation === 1 ? "" : "s"} could not be placed on the map.
                      </p>
                    )}
                  </Card>
                  <Card>
                    <h2 className="mb-4 font-black text-slate-900">Top countries</h2>
                    {summary.countries.length === 0 ? (
                      <p className="text-sm font-semibold text-slate-500">Nothing in this selection.</p>
                    ) : (
                      <ul className="space-y-3">
                        {summary.countries.slice(0, 8).map((c) => (
                          <li key={c.code}>
                            <button type="button" onClick={() => narrow({ country: c.code })} aria-pressed={filters.country === c.code} className="group block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ec440]">
                              <span className="flex items-center justify-between gap-3 text-sm">
                                <span className="inline-flex items-center gap-2 font-bold text-slate-900 group-hover:underline">
                                  <Flag code={c.code} name={c.country} />
                                  {c.country}
                                </span>
                                <span className="font-bold text-slate-700">{number(c.visits)}</span>
                              </span>
                              <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-slate-100">
                                <span className="block h-full rounded-full bg-[#2ec440]" style={{ width: `${Math.max(4, (c.visits / maxCountry) * 100)}%` }} />
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                </div>
              </div>
            )}

            {tab === "places" && (
              <div className="grid gap-6 lg:grid-cols-2">
                <section>
                  <h2 className="mb-3 text-lg font-black text-slate-900">Countries</h2>
                  {summary.countries.length === 0 ? (
                    <EmptyState title="Nothing in this selection" />
                  ) : (
                    <AdminTable headers={["Country", "Views", "Visitors"]}>
                      {summary.countries.map((c) => (
                        <tr key={c.code} className="transition-colors hover:bg-slate-50/50">
                          <td className="px-6 py-3 text-sm">
                            <span className="inline-flex items-center gap-3">
                              <Flag code={c.code} name={c.country} />
                              <Pick label={`Narrow to ${c.country}`} active={filters.country === c.code} onClick={() => narrow({ country: c.code })}>
                                {c.country}
                              </Pick>
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right text-sm font-semibold text-slate-700">{number(c.visits)}</td>
                          <td className="px-6 py-3 text-right text-sm font-semibold text-slate-700">{number(c.unique)}</td>
                        </tr>
                      ))}
                    </AdminTable>
                  )}
                </section>
                <section>
                  <h2 className="mb-3 text-lg font-black text-slate-900">Cities</h2>
                  {summary.cities.length === 0 ? (
                    <EmptyState title="Nothing in this selection" />
                  ) : (
                    <AdminTable headers={["City", "Views", "Visitors"]}>
                      {summary.cities.map((c) => (
                        <tr key={`${c.code}|${c.city}`} className="transition-colors hover:bg-slate-50/50">
                          <td className="px-6 py-3 text-sm">
                            <span className="inline-flex items-center gap-3">
                              <Flag code={c.code} name={c.country} />
                              <Pick label={`Narrow to ${c.city}`} active={filters.city === c.city} onClick={() => narrow({ country: c.code, city: c.city })}>
                                {c.city}
                              </Pick>
                              {c.country && <span className="text-slate-400">{c.country}</span>}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right text-sm font-semibold text-slate-700">{number(c.visits)}</td>
                          <td className="px-6 py-3 text-right text-sm font-semibold text-slate-700">{number(c.unique)}</td>
                        </tr>
                      ))}
                    </AdminTable>
                  )}
                </section>
              </div>
            )}

            {tab === "pages" && (
              <section>
                <h2 className="mb-3 text-lg font-black text-slate-900">Pages people opened</h2>
                {summary.pages.length === 0 ? (
                  <EmptyState title="Nothing in this selection" />
                ) : (
                  <AdminTable headers={["Page", "Views", "Visitors"]}>
                    {summary.pages.map((p) => (
                      <tr key={p.page} className="transition-colors hover:bg-slate-50/50">
                        <td className="px-6 py-3 text-sm">
                          <Pick label={`Narrow to ${pageName(p.page)}`} active={filters.page === p.page} onClick={() => narrow({ page: p.page })}>
                            {pageName(p.page)}
                          </Pick>
                          {(p.page === "/" || p.page === "/home") && <span className="ml-2 text-slate-400">{p.page}</span>}
                        </td>
                        <td className="px-6 py-3 text-right text-sm font-semibold text-slate-700">{number(p.views)}</td>
                        <td className="px-6 py-3 text-right text-sm font-semibold text-slate-700">{number(p.unique)}</td>
                      </tr>
                    ))}
                  </AdminTable>
                )}
              </section>
            )}

            {tab === "trends" && (
              <div className="space-y-6">
                <Card>
                  <h2 className="mb-4 font-black text-slate-900">Views per day</h2>
                  <div className="flex h-44 items-end gap-px" role="group" aria-label="Views per day">
                    {summary.daily.map((d) => (
                      <button
                        key={d.date}
                        type="button"
                        onClick={() => narrow({ day: d.date })}
                        aria-pressed={filters.day === d.date}
                        aria-label={`${dayText(d.date)}: ${d.visits} views`}
                        title={`${dayText(d.date)}: ${d.visits} view${d.visits === 1 ? "" : "s"}, ${d.unique} visitor${d.unique === 1 ? "" : "s"}`}
                        className="flex h-full flex-1 items-end focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ec440]"
                      >
                        <span className={`block w-full rounded-t ${filters.day === d.date ? "bg-slate-900" : d.visits > 0 ? "bg-[#2ec440] hover:bg-[#219b31]" : "bg-slate-100"}`} style={{ height: d.visits > 0 ? `${Math.max(4, (d.visits / maxDay) * 100)}%` : "2px" }} />
                      </button>
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
                    <div className="flex flex-wrap gap-6 text-sm text-slate-700">
                      <span>
                        <Pick label="Narrow to computers" active={filters.device === "desktop"} onClick={() => narrow({ device: "desktop" })}>
                          {number(summary.devices.desktop ?? 0)}
                        </Pick>{" "}
                        on a computer
                      </span>
                      <span>
                        <Pick label="Narrow to phones" active={filters.device === "mobile"} onClick={() => narrow({ device: "mobile" })}>
                          {number(summary.devices.mobile ?? 0)}
                        </Pick>{" "}
                        on a phone
                      </span>
                    </div>
                  </Card>
                  <Card>
                    <h2 className="mb-3 font-black text-slate-900">Where they came from</h2>
                    {summary.referrers.length === 0 ? (
                      <p className="text-sm font-semibold text-slate-500">Nothing in this selection.</p>
                    ) : (
                      <ul className="space-y-1.5 text-sm text-slate-700">
                        {summary.referrers.map((r) => (
                          <li key={r.host} className="flex justify-between gap-3">
                            <Pick label={`Narrow to ${r.host}`} active={filters.referrer === r.host} onClick={() => narrow({ referrer: r.host })}>
                              {r.host === "direct" ? "Direct (no referring site)" : r.host}
                            </Pick>
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
                    <AdminTable headers={["Address", "Place", "Who", "Views", "First seen", "Last seen"]}>
                      {visitors.rows.map((v) => (
                        <tr key={v.id} className="cursor-pointer transition-colors hover:bg-slate-50" onClick={() => setDetailId(v.id)}>
                          <td className="px-6 py-3 text-sm">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailId(v.id);
                              }}
                              className="font-bold text-slate-900 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ec440]"
                            >
                              {v.ip}
                            </button>
                            {v.shortened && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">shortened</span>}
                          </td>
                          <td className="px-6 py-3 text-sm text-slate-700">
                            <span className="inline-flex items-center gap-3">
                              <Flag code={v.countryCode} name={v.country} />
                              {place(v)}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-sm">
                            {v.accounts.length > 0 ? (
                              <span className="flex flex-wrap gap-1.5">
                                {v.accounts.map((a) => (
                                  <AccountBadge key={a.id} account={a} />
                                ))}
                              </span>
                            ) : v.memberViews > 0 ? (
                              <span className="font-semibold text-[#219b31]">Signed in</span>
                            ) : (
                              <span className="text-slate-400">Not signed in</span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-right text-sm font-semibold text-slate-700">{number(v.views)}</td>
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

      <Dialog open={detailId !== null} onClose={() => setDetailId(null)} labelledBy={titleId} panelClassName="max-w-2xl">
        <div className="flex max-h-[85vh] flex-col p-6">
          <h2 id={titleId} className="mb-1 pr-6 text-lg font-black text-slate-900">
            {detail ? detail.visitor.ip : "Visitor"}
            {detail?.visitor.shortened && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">shortened</span>}
          </h2>
          {detailError ? (
            <p className="text-sm font-semibold text-red-600">{detailError}</p>
          ) : !detail ? (
            <p className="py-8 text-center text-sm font-semibold text-slate-400">Loading…</p>
          ) : (
            <>
              <p className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <Flag code={detail.visitor.countryCode} name={detail.visitor.country} />
                  {place(detail.visitor)}
                </span>
                <span className="capitalize">{detail.visitor.device}</span>
                <span>
                  {dayText(detail.from)} to {dayText(detail.to)}
                </span>
              </p>
              <ol className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
                {detail.views.map((v, i) => (
                  <li key={`${v.at}-${i}`} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{pageName(v.page)}</p>
                      <p className="text-xs text-slate-500">
                        {formatDateTime(v.at)}
                        {v.referrer ? ` · from ${v.referrer}` : ""}
                      </p>
                    </div>
                    {v.account ? <AccountBadge account={v.account} /> : <span className="text-xs font-semibold text-slate-400">Not signed in</span>}
                  </li>
                ))}
                {detail.views.length === 0 && <li className="px-4 py-6 text-center text-sm font-semibold text-slate-400">No views in this period.</li>}
              </ol>
            </>
          )}
          <div className="mt-4 flex justify-end">
            <SecondaryButton type="button" onClick={() => setDetailId(null)}>
              Close
            </SecondaryButton>
          </div>
        </div>
      </Dialog>
    </PageFrame>
  );
}
