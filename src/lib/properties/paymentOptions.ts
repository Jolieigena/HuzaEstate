import type { Property } from "./types";

export const MAX_INSTALLMENTS = 3;
export const MAX_INSTALLMENT_MONTHS = 6;

export type PaymentOptions = NonNullable<Property["paymentOptions"]>;
export type InstallmentPlan = NonNullable<PaymentOptions["installments"]>;

/** The seller's staged plan, if the listing offers one. */
export function installmentsOf(property: Pick<Property, "paymentOptions" | "type">): InstallmentPlan | undefined {
  return property.type === "sale" ? property.paymentOptions?.installments : undefined;
}

/** Whether a listing for sale also allows paying in one go (every one that sets no options does). */
export function allowsFullPayment(property: Pick<Property, "paymentOptions">): boolean {
  return property.paymentOptions ? property.paymentOptions.full !== false : true;
}

/** Installment plans need at least one month between payments: 3 payments need 2 months, 2 payments need 1. */
export function minMonths(count: number): number {
  return Math.max(1, count - 1);
}

/** The payments of a plan for a given total: the first share now, the rest split equally and spread over the months. */
export function paymentSchedule(total: number, plan: InstallmentPlan): { when: string; amount: number }[] {
  const first = Math.round((total * plan.firstPercent) / 100);
  const rest = plan.count - 1;
  const each = Math.round((total - first) / rest);
  const schedule = [{ when: "At purchase", amount: first }];
  for (let i = 1; i <= rest; i++) {
    const month = Math.max(1, Math.round((plan.months * i) / rest));
    // The last payment takes any rounding left over, so the payments always add up to the price.
    const amount = i === rest ? total - first - each * (rest - 1) : each;
    schedule.push({ when: month === 1 ? "After 1 month" : `After ${month} months`, amount });
  }
  return schedule;
}

/** "3 installments over 6 months" */
export function describePlan(plan: InstallmentPlan): string {
  return `${plan.count} installments over ${plan.months} month${plan.months === 1 ? "" : "s"}`;
}
