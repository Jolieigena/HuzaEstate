import { getMyProperties, type MyProperty } from "@/lib/myProperties";
import { estimateCurrentValue, getResaleRecommendation } from "@/lib/marketAnalytics/analyticsService";
import type { ResaleRecommendation } from "@/lib/marketAnalytics/types";

export interface PortfolioProperty extends MyProperty {
  currentEstimatedValue?: number;
  resaleRecommendation?: ResaleRecommendation;
}

/** Joins the buyer's raw ownership records (myProperties.ts) with market
 *  analytics — the current estimated value and, for an owned property, a
 *  hold/sell recommendation. Properties with ownershipStatus "rented" have
 *  no purchase price, so both come back undefined for those (see
 *  src/lib/rentPayments for the tenant-side rent schedule instead). */
export function getPortfolio(ownerId: string): PortfolioProperty[] {
  return getMyProperties(ownerId).map((property) => ({
    ...property,
    currentEstimatedValue: estimateCurrentValue(property),
    resaleRecommendation: getResaleRecommendation(property),
  }));
}
