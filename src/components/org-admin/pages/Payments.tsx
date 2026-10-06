"use client";

import PaymentsView from "@/components/payments/PaymentsView";
import { orgPayments } from "@/components/payments/paymentsSource";

/** Organisation admin: the same two views, limited by the server to sellers in the organisation's
 *  scope (countries, property categories, regions). The seller column shows an account id instead of
 *  a name when the viewer lacks the Users permission (needed to look names up): degraded, not broken. */
export function OrgPaymentsPage() {
  return <PaymentsView source={orgPayments} />;
}
