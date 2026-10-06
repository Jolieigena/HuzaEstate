"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useIsAdministrator } from "@/lib/admin/hooks";
import type { AdminPaymentList, AdminSubscriptionList } from "@/lib/admin/api";
import { hasOrgPermission } from "@/lib/orgPermissions";
import { PageFrame, RequirePermission, formatMoney } from "@/components/admin/ui";
import OneTimePaymentsPanel from "./OneTimePaymentsPanel";
import SubscriptionsPanel from "./SubscriptionsPanel";
import type { PaymentsSource } from "./paymentsSource";
import { usePaymentSellers } from "./shared";

type Kind = "subscriptions" | "one-time";
const dollars = (cents: number) => formatMoney(cents / 100, "USD");

/** One of the two kinds of money, as a card you can select: what it earns, and a line of context. The two
 *  cards together are the page's overview; the one selected decides which list is shown below them. */
function KindCard({ active, onSelect, title, figure, unit, lines, icon }: { active: boolean; onSelect: () => void; title: string; figure: string; unit: string; lines: string[]; icon: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onSelect}
      className={`group flex items-start gap-4 rounded-2xl border bg-white p-5 text-left transition-all ${active ? "border-slate-900 ring-1 ring-slate-900" : "border-slate-200 hover:border-slate-400"}`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"}`}>
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={icon} />
        </svg>
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-600">{title}</span>
        <span className="mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-slate-900">{figure}</span>
          <span className="text-sm text-slate-400">{unit}</span>
        </span>
        <span className="mt-3 block space-y-0.5 text-sm text-slate-600">
          {lines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}

// Recurring arrows (a plan that renews), and a price tag (a single purchase).
const ICON_RECURRING = "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15";
const ICON_ONE_TIME = "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z";

/** Seller payments, split by what kind of money it is. Recurring plan subscriptions and one-off purchases
 *  (extra posts, promotions) are two different things, so each gets a card at the top with its own
 *  headline number; choose a card to see its list. Used by both the platform admin and organisation
 *  admin portals; `source` says which endpoints to read. Both lists stay mounted so switching keeps filters. */
export default function PaymentsView({ source }: { source: PaymentsSource }) {
  const { token, account, isAuthReady } = useAuth();
  const isAdmin = useIsAdministrator();
  const canView = source.scope === "platform" ? isAdmin : (account?.roles.includes("organization_admin") ?? false) && hasOrgPermission(account?.permissions, "view_payments");
  const enabled = isAuthReady && !!token && canView;
  const sellers = usePaymentSellers(token, enabled);
  const [kind, setKind] = useState<Kind>("subscriptions");
  const [subs, setSubs] = useState<AdminSubscriptionList["summary"] | null>(null);
  const [oneTime, setOneTime] = useState<AdminPaymentList["summary"] | null>(null);

  const promotions = oneTime?.byKind.promote ?? 0;
  const extraPosts = oneTime?.byKind.per_post ?? 0;

  return (
    <PageFrame title={source.scope === "platform" ? "Seller Payments" : "Payments"}>
      <RequirePermission granted={canView}>
        <div role="tablist" aria-label="Payment type" className="mb-8 grid gap-4 sm:grid-cols-2">
          <KindCard
            active={kind === "subscriptions"}
            onSelect={() => setKind("subscriptions")}
            title="Subscriptions"
            icon={ICON_RECURRING}
            figure={subs ? dollars(subs.monthlyRecurringCents) : "–"}
            unit="a month"
            lines={subs ? [`${subs.paidActive} paying ${subs.paidActive === 1 ? "seller" : "sellers"}${subs.onAccessCode ? ` · ${subs.onAccessCode} on access codes` : ""}`, `${subs.byTier.free ?? 0} on the free plan`] : ["Loading…"]}
          />
          <KindCard
            active={kind === "one-time"}
            onSelect={() => setKind("one-time")}
            title="Promotions & extra posts"
            icon={ICON_ONE_TIME}
            figure={oneTime ? dollars(oneTime.oneTimeCents) : "–"}
            unit="earned"
            lines={oneTime ? [`${promotions} paid ${promotions === 1 ? "promotion" : "promotions"} · ${dollars(oneTime.byKindCents.promote ?? 0)}`, `${extraPosts} extra ${extraPosts === 1 ? "post" : "posts"} · ${dollars(oneTime.byKindCents.per_post ?? 0)}`] : ["Loading…"]}
          />
        </div>

        <div hidden={kind !== "subscriptions"}>
          <SubscriptionsPanel source={source} token={token} enabled={enabled} sellers={sellers} onSummary={setSubs} />
        </div>
        <div hidden={kind !== "one-time"}>
          <OneTimePaymentsPanel source={source} token={token} enabled={enabled} sellers={sellers} onSummary={setOneTime} />
        </div>
      </RequirePermission>
    </PageFrame>
  );
}
