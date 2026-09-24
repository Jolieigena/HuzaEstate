import type { DistrictPriceTrend, MonthlyPricePoint } from "./types";

const MONTH_LABELS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
const FORECAST_MONTH_LABELS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

const zeroSeries = (months: string[]): MonthlyPricePoint[] => months.map((month) => ({ month, avgPricePerSqm: 0 }));

/** No real historical listings-price dataset exists yet, so there is nothing
 *  genuine to chart per district. Rather than fabricate invented growth
 *  curves, this is a single flat "no data available" series shown until a
 *  real pricing-history source exists. */
export const DISTRICT_TRENDS: DistrictPriceTrend[] = [];

export const DEFAULT_DISTRICT_TREND: DistrictPriceTrend = {
  district: "",
  history: zeroSeries(MONTH_LABELS),
  forecast: zeroSeries(FORECAST_MONTH_LABELS),
  yoyChangePct: 0,
};
