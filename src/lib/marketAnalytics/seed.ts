import type { DistrictPriceTrend, MonthlyPricePoint } from "./types";

const MONTH_LABELS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
const FORECAST_MONTH_LABELS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

/** Tiny deterministic hash → a stable [0, 1) value per (district, index), so
 *  the "noise" in each trend line is fixed across renders/SSR instead of
 *  using Math.random(), which would make the chart redraw differently every
 *  time and mismatch between server and client. */
function seededUnit(seed: string, index: number): number {
  let h = 0;
  const s = `${seed}:${index}`;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return ((h >>> 0) % 1000) / 1000;
}

/** basePricePerSqm and monthlySlopePct are hand-picked per district to tell
 *  a believable, varied story (some rising fast, one flat, one softening) —
 *  not derived from any real listings feed. */
const DISTRICT_PROFILES: { district: string; basePricePerSqm: number; monthlySlopePct: number }[] = [
  { district: "Kimihurura", basePricePerSqm: 620, monthlySlopePct: 1.1 },
  { district: "Kiyovu", basePricePerSqm: 540, monthlySlopePct: 0.7 },
  { district: "Nyarutarama", basePricePerSqm: 580, monthlySlopePct: 0.9 },
  { district: "Gacuriro", basePricePerSqm: 410, monthlySlopePct: 0.5 },
  { district: "Kigali", basePricePerSqm: 350, monthlySlopePct: 0.4 },
  { district: "Muhanga", basePricePerSqm: 210, monthlySlopePct: 0.2 },
  { district: "Musanze", basePricePerSqm: 195, monthlySlopePct: 0.3 },
  { district: "Rubavu", basePricePerSqm: 240, monthlySlopePct: -0.2 },
];

function buildSeries(district: string, basePricePerSqm: number, monthlySlopePct: number, months: string[], startIndex: number): MonthlyPricePoint[] {
  return months.map((month, i) => {
    const monthsFromStart = startIndex + i;
    const trend = basePricePerSqm * (1 + (monthlySlopePct / 100) * monthsFromStart);
    const noise = (seededUnit(district, monthsFromStart) - 0.5) * basePricePerSqm * 0.03;
    return { month, avgPricePerSqm: Math.round(trend + noise) };
  });
}

function buildDistrictTrend({ district, basePricePerSqm, monthlySlopePct }: (typeof DISTRICT_PROFILES)[number]): DistrictPriceTrend {
  const history = buildSeries(district, basePricePerSqm, monthlySlopePct, MONTH_LABELS, 0);
  const forecast = buildSeries(district, basePricePerSqm, monthlySlopePct, FORECAST_MONTH_LABELS, MONTH_LABELS.length);
  const yoyChangePct = Math.round(((history[history.length - 1].avgPricePerSqm - history[0].avgPricePerSqm) / history[0].avgPricePerSqm) * 1000) / 10;
  return { district, history, forecast, yoyChangePct };
}

export const DISTRICT_TRENDS: DistrictPriceTrend[] = DISTRICT_PROFILES.map(buildDistrictTrend);

export const DEFAULT_DISTRICT_TREND = DISTRICT_TRENDS.find((t) => t.district === "Kigali")!;
