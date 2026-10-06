"use client";

import PaymentsView from "@/components/payments/PaymentsView";
import { platformPayments } from "@/components/payments/paymentsSource";

/** Platform admin: every seller's subscription and one-time payments (see components/payments). */
export function SellerPaymentsPage() {
  return <PaymentsView source={platformPayments} />;
}
