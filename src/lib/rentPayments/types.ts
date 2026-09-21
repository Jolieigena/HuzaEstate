import type { Money, PaymentMethod, PaymentStatus } from "@/lib/finance/types";

export type { PaymentMethod, PaymentStatus };

/** A recurring rent obligation. `propertyId` ties to a src/lib/myProperties.ts
 *  entry with ownershipStatus "rented" — that's the tenant's own record of a
 *  property they currently lease, which is what "my rent to pay" means here.
 *  (TenantApplication, by contrast, models a prospective applicant applying
 *  to a landlord's listing — a different, earlier stage, not an existing
 *  tenant's payment obligation.) */
export interface RentSchedule {
  id: string;
  propertyId: string;
  tenantAccountId: string;
  landlordAccountId: string;
  amount: Money;
  dueDayOfMonth: number;
  method: PaymentMethod;
  autopayEnabled: boolean;
  nextDueDate: string;
  /** Platform commission taken out of each payment before the landlord payout — 500 = 5%. */
  platformFeeBasisPoints: number;
}

export interface RentPaymentRecord {
  id: string;
  scheduleId: string;
  /** "YYYY-MM" billing period this payment covers. */
  period: string;
  amount: Money;
  status: PaymentStatus;
  method: PaymentMethod;
  platformFee: Money;
  landlordPayout: Money;
  paidAt?: string;
}
