import type { SupplierDelivery } from "./api";

/** How long delivery takes, as the supplier gave it: "2 days", or "2 to 5 days" when places differ. Empty when they gave none. */
export function deliveryDaysText(delivery: SupplierDelivery): string {
  const all = [delivery.days, ...(delivery.areas ?? []).map((a) => a.days)].filter((d): d is number => typeof d === "number" && d > 0);
  if (all.length === 0) return "";
  const low = Math.min(...all);
  const high = Math.max(...all);
  return low === high ? `${low} ${low === 1 ? "day" : "days"}` : `${low} to ${high} days`;
}

/** What a shop says about delivery: its flat fee, or that the cost depends on where the buyer is when the supplier set prices by place,
 *  and how long it takes when the supplier gave that. Nothing when the supplier has not entered their delivery. */
export function deliveryText(delivery: SupplierDelivery, format: (amount: number, currency: string) => string): string {
  if (!delivery.set) return "";
  const days = deliveryDaysText(delivery);
  const time = days ? `, ${days}` : "";
  if ((delivery.areas ?? []).length > 0) return `Delivery cost depends on where you are${time}`;
  if (delivery.fee > 0 && delivery.currency) return `Delivery ${format(delivery.fee, delivery.currency)} per order${delivery.freeOver ? `, free above ${format(delivery.freeOver, delivery.currency)}` : ""}${time}`;
  return `Free delivery${time}`;
}
