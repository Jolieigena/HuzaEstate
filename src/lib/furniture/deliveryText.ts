import type { SupplierDelivery } from "./api";

/** What a shop says about delivery: its flat fee, or that the cost depends on where the buyer is when the supplier set prices by place. */
export function deliveryText(delivery: SupplierDelivery, format: (amount: number, currency: string) => string): string {
  if ((delivery.areas ?? []).length > 0) return "Delivery cost depends on where you are";
  if (delivery.fee > 0 && delivery.currency) return `Delivery ${format(delivery.fee, delivery.currency)} per order${delivery.freeOver ? `, free above ${format(delivery.freeOver, delivery.currency)}` : ""}`;
  return "Free delivery";
}
