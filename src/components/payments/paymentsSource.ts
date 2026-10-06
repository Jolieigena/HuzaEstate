import { AdminApi, type AdminPaymentList, type AdminSubscriptionList, type ApiResult, type PaymentKind } from "@/lib/admin/api";

export type SubscriptionQuery = { tier?: string; status?: string; page?: number; limit?: number };
export type PaymentQuery = { kind?: PaymentKind | "one_time"; page?: number; limit?: number };

/** Where a payments screen gets its data. The platform admin and an organisation admin see the same
 *  two lists (subscriptions, one-time payments); only the endpoints behind them differ, and the server
 *  already limits an organisation's to the sellers in its scope. Everything above this is shared. */
export interface PaymentsSource {
  scope: "platform" | "org";
  subscriptions: (token: string, query: SubscriptionQuery) => Promise<ApiResult<AdminSubscriptionList>>;
  payments: (token: string, query: PaymentQuery) => Promise<ApiResult<AdminPaymentList>>;
  /** A link to a seller's account page, where the viewer is allowed one. */
  sellerHref?: (accountId: string) => string;
}

export const platformPayments: PaymentsSource = {
  scope: "platform",
  subscriptions: AdminApi.listSubscriptions,
  payments: AdminApi.listPayments,
  sellerHref: (accountId) => `/admin/users/${accountId}`,
};

export const orgPayments: PaymentsSource = {
  scope: "org",
  subscriptions: AdminApi.orgSubscriptions,
  payments: AdminApi.orgPayments,
};
