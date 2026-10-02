import { money } from "@/lib/finance/money";
import type { Money } from "@/lib/finance/types";
import type { Property } from "@/lib/properties/types";

export interface PromotionPackage {
  days: number;
  price: Money;
}

/** "Pay to push this listing to the top of search for N days" — the same
 *  "Boost"/"Feature this ad" pattern real-estate marketplaces (Property24,
 *  Jiji, Lamudi) sell per-listing and priced by duration, distinct from
 *  postingPlans' priorityPlacement (a whole-subscription-tier perk, not
 *  something bought per listing). */
export const PROMOTION_PACKAGES: PromotionPackage[] = [
  { days: 3, price: money(3, "USD") },
  { days: 7, price: money(6, "USD") },
  { days: 14, price: money(9, "USD") },
];

/** A listing counts as promoted only while its promotedUntil is still in the
 *  future — once it lapses it quietly falls back to normal placement rather
 *  than needing an explicit "unpromote" action anywhere. */
export function isPromotedNow(property: Pick<Property, "promotedUntil">): boolean {
  return Boolean(property.promotedUntil) && new Date(property.promotedUntil!).getTime() > Date.now();
}

export function promotionDaysLeft(property: Pick<Property, "promotedUntil">): number {
  if (!property.promotedUntil) return 0;
  return Math.max(0, Math.ceil((new Date(property.promotedUntil).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

/** Pins active promotions to the front — same rule /properties' own sort uses — for every other
 *  public grid (home, buy, rent) that shows a plain, unsorted slice of listings today. Without
 *  this a promoted listing could still miss a page's "first N" cutoff entirely. */
export function sortPromotedFirst<T extends Pick<Property, "promotedUntil">>(properties: T[]): T[] {
  return [...properties].sort((a, b) => {
    const aPromoted = isPromotedNow(a);
    const bPromoted = isPromotedNow(b);
    if (aPromoted === bPromoted) return 0;
    return aPromoted ? -1 : 1;
  });
}
