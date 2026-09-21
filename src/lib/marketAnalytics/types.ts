// Market Trends & Predictions — prototype data model.
//
// PROTOTYPE NOTICE: this is deterministic, rule-based illustrative data, not
// a real market feed or a trained forecasting model. See analyticsService.ts
// for how the "forecast" and resale "recommendation" are derived.

export interface MonthlyPricePoint {
  month: string;
  avgPricePerSqm: number;
}

export interface DistrictPriceTrend {
  district: string;
  /** Trailing 12 months, oldest first. */
  history: MonthlyPricePoint[];
  /** Rule-based projection, 6 months out — a linear extrapolation of the
   *  trailing trend, not a real model. */
  forecast: MonthlyPricePoint[];
  yoyChangePct: number;
}

export type ResaleVerdict = "hold" | "consider_selling" | "sell_now";

export interface ResaleRecommendation {
  verdict: ResaleVerdict;
  gainPct: number;
  reasoning: string;
}

export const RESALE_VERDICT_LABELS: Record<ResaleVerdict, string> = {
  hold: "Hold",
  consider_selling: "Consider Selling",
  sell_now: "Good Time to Sell",
};

export const MARKET_ANALYTICS_DISCLAIMER =
  "Illustrative market data for demonstration — not real listings history, and not financial advice.";
