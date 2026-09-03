"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useInvoices, usePayments, useFundingForAccount, useSettlements, useRefunds, useDisputes } from "@/lib/finance/hooks";
import { formatMoney } from "@/lib/finance/money";
import { formatDate } from "@/lib/finance/format";
import { PageFrame, Card, FinancePill, EmptyState, PrototypeBanner, PrimaryLink } from "@/components/finance/ui";

export default function ProfessionalFinancePage() {
  const { account, isAuthReady } = useAuth();
  const invoices = useInvoices(account?.id);
  const payments = usePayments(account?.id);
  const funding = useFundingForAccount(account?.id);
  const settlements = useSettlements(account?.id);
  const refunds = useRefunds(account?.id);
  const disputes = useDisputes(account?.id);

  if (!isAuthReady || !account) return null;

  const outstandingInvoices = invoices.filter((i) => i.issuerId === account.id && !["paid", "cancelled", "draft"].includes(i.status));
  const processingPayments = payments.filter((p) => p.recipientId === account.id && ["pending_provider", "processing", "authorisation_required"].includes(p.status));
  const fundedMilestones = funding.filter((f) => f.recipientId === account.id && ["provider_confirmed", "protected_by_provider"].includes(f.status));
  const releaseRequests = funding.filter((f) => f.recipientId === account.id && ["release_requested", "release_under_review"].includes(f.status));
  const upcomingSettlements = settlements.filter((s) => ["scheduled", "processing"].includes(s.status));
  const completedSettlements = settlements.filter((s) => s.status === "completed");

  return (
    <PageFrame title="Finance" description="Outstanding invoices, funded milestones, release requests and settlements for your work." action={<PrimaryLink href="/professional/invoices">Manage Invoices</PrimaryLink>}>
      <div className="mb-6">
        <PrototypeBanner />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile label="Outstanding invoices" value={outstandingInvoices.length} />
        <SummaryTile label="Payments processing" value={processingPayments.length} />
        <SummaryTile label="Funded milestones (pending release)" value={fundedMilestones.length} />
        <SummaryTile label="Expected settlements" value={upcomingSettlements.length} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Section title="Release requests awaiting decision">
          {releaseRequests.length === 0 ? (
            <EmptyState title="No pending release requests" description="Release requests you submit will appear here until the customer decides." />
          ) : (
            <List>
              {releaseRequests.map((f) => (
                <ListRow key={f.id} left={formatMoney(f.amount)} right={<FinancePill status={f.status} />} href={`/execution/${f.executionProjectId}/payments`} />
              ))}
            </List>
          )}
        </Section>

        <Section title="Funded milestones">
          {fundedMilestones.length === 0 ? (
            <EmptyState title="No funded milestones yet" description="Milestones become funded once the customer's payment is confirmed by the provider." />
          ) : (
            <List>
              {fundedMilestones.map((f) => (
                <ListRow key={f.id} left={formatMoney(f.amount)} right={<FinancePill status={f.status} />} href={`/execution/${f.executionProjectId}/payments`} />
              ))}
            </List>
          )}
        </Section>

        <Section title="Outstanding invoices">
          {outstandingInvoices.length === 0 ? (
            <EmptyState title="No outstanding invoices" description="Invoices you issue will appear here until fully paid." />
          ) : (
            <List>
              {outstandingInvoices.map((i) => (
                <ListRow key={i.id} left={`${i.reference} · ${formatMoney(i.amountOutstanding)}`} right={<FinancePill status={i.status} />} href={`/professional/invoices/${i.id}`} />
              ))}
            </List>
          )}
        </Section>

        <Section title="Settlements">
          {upcomingSettlements.length === 0 && completedSettlements.length === 0 ? (
            <EmptyState title="No settlements yet" description="Settlements are scheduled once a release is approved or a direct service payment succeeds." />
          ) : (
            <List>
              {[...upcomingSettlements, ...completedSettlements].map((s) => (
                <ListRow key={s.id} left={`${formatMoney(s.netAmount)} net · expected ${formatDate(s.expectedDate)}`} right={<FinancePill status={s.status} />} href="/professional/settlements" />
              ))}
            </List>
          )}
        </Section>

        {refunds.length > 0 && (
          <Section title="Refunds">
            <List>
              {refunds.map((r) => (
                <ListRow key={r.id} left={formatMoney(r.requestedAmount)} right={<FinancePill status={r.status} />} href={`/payments/${r.paymentId}`} />
              ))}
            </List>
          </Section>
        )}

        {disputes.length > 0 && (
          <Section title="Disputes">
            <List>
              {disputes.map((d) => (
                <ListRow key={d.id} left={d.category.replace(/_/g, " ")} right={<FinancePill status={d.status} />} href={d.paymentId ? `/payments/${d.paymentId}` : "/professional/finance"} />
              ))}
            </List>
          </Section>
        )}
      </div>
    </PageFrame>
  );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
    </Card>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </Card>
  );
}
function List({ children }: { children: React.ReactNode }) {
  return <ul className="divide-y divide-slate-100">{children}</ul>;
}
function ListRow({ left, right, href }: { left: string; right: React.ReactNode; href: string }) {
  return (
    <li className="py-2.5">
      <Link href={href} className="flex items-center justify-between gap-3 text-sm hover:text-[#219b31]">
        <span className="font-semibold text-slate-800">{left}</span>
        {right}
      </Link>
    </li>
  );
}
