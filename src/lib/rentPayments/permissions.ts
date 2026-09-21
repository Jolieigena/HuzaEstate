import type { RentSchedule } from "./types";

/** A tenant can only act on their own schedule — mirrors the ownership-check
 *  style in src/lib/finance/permissions.ts rather than a role/action matrix,
 *  since there's only one action a tenant takes here (pay/manage autopay). */
export function canManageSchedule(accountId: string | undefined, schedule: RentSchedule): boolean {
  return !!accountId && accountId === schedule.tenantAccountId;
}

/** A landlord can view payouts for schedules on their own properties only —
 *  they never see or touch the tenant's payment method or autopay setting. */
export function canViewPayout(accountId: string | undefined, schedule: RentSchedule): boolean {
  return !!accountId && accountId === schedule.landlordAccountId;
}
