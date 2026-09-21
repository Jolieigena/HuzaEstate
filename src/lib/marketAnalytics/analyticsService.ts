import type { DistrictPriceTrend, ResaleRecommendation } from "./types";
import { DISTRICT_TRENDS, DEFAULT_DISTRICT_TREND } from "./seed";
import type { MyProperty } from "@/lib/myProperties";

export function getDistrictTrend(district: string | undefined): DistrictPriceTrend {
  if (!district) return DEFAULT_DISTRICT_TREND;
  return DISTRICT_TRENDS.find((t) => t.district.toLowerCase() === district.toLowerCase()) ?? DEFAULT_DISTRICT_TREND;
}

export function listDistrictTrends(): DistrictPriceTrend[] {
  return DISTRICT_TRENDS;
}

/** Current value = purchase price carried forward by the district's own
 *  price-per-sqm growth since a rough purchase-year baseline — a stand-in
 *  for a real automated valuation model (AVM), which this prototype has no
 *  data source for. */
export function estimateCurrentValue(property: MyProperty): number | undefined {
  if (!property.purchasePrice) return undefined;
  const trend = getDistrictTrend(property.district);
  const first = trend.history[0].avgPricePerSqm;
  const last = trend.history[trend.history.length - 1].avgPricePerSqm;
  const growthFactor = last / first;
  return Math.round(property.purchasePrice * growthFactor);
}

/** Rule-based, not machine-learned: compares realized gain since purchase
 *  against the district's forward-looking trend slope. Thresholds are
 *  illustrative judgment calls, not calibrated against real outcomes. */
export function getResaleRecommendation(property: MyProperty): ResaleRecommendation | undefined {
  if (!property.purchasePrice) return undefined;
  const currentValue = estimateCurrentValue(property);
  if (currentValue === undefined) return undefined;

  const gainPct = Math.round(((currentValue - property.purchasePrice) / property.purchasePrice) * 1000) / 10;
  const trend = getDistrictTrend(property.district);
  const forecastFirst = trend.forecast[0].avgPricePerSqm;
  const forecastLast = trend.forecast[trend.forecast.length - 1].avgPricePerSqm;
  const forecastSlopePct = ((forecastLast - forecastFirst) / forecastFirst) * 100;

  if (gainPct >= 25 && forecastSlopePct < 1.5) {
    return {
      verdict: "sell_now",
      gainPct,
      reasoning: `${property.district ?? "This area"} is up ${gainPct}% since you bought, and the 6-month forecast is flattening (+${forecastSlopePct.toFixed(1)}%) — you're unlikely to gain much more by waiting.`,
    };
  }
  if (gainPct >= 12) {
    return {
      verdict: "consider_selling",
      gainPct,
      reasoning: `You're sitting on a ${gainPct}% gain in ${property.district ?? "this area"}. Prices are still projected to rise ${forecastSlopePct.toFixed(1)}% over the next 6 months, so it's a reasonable window to sell if you don't plan to hold long-term.`,
    };
  }
  return {
    verdict: "hold",
    gainPct,
    reasoning: `${property.district ?? "This area"} is forecast to keep rising (+${forecastSlopePct.toFixed(1)}% over 6 months) and your gain so far (${gainPct}%) is modest — holding likely earns more than selling now.`,
  };
}
