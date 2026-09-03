"use client";

import { useRef, useSyncExternalStore } from "react";
import { FinanceStoreEngine } from "./store";
import { ContractService } from "./contractService";
import { InvoiceService } from "./invoiceService";
import { PaymentService } from "./paymentService";
import { FundingService } from "./fundingService";
import { SettlementService } from "./settlementService";
import { RefundService } from "./refundService";
import { DisputeService } from "./disputeService";
import { ReconciliationService } from "./reconciliationService";
import { ConfigService } from "./configService";
import type {
  Contract,
  Invoice,
  Payment,
  FundingAllocation,
  Settlement,
  RefundRequest,
  PaymentDispute,
  ReconciliationRecord,
  PaymentConfiguration,
  FinanceNotification,
} from "./types";

function shallowEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => Object.is(item, b[i]));
  }
  return false;
}

// useSyncExternalStore (not useState+useEffect) so that when the selector's
// inputs change between renders (e.g. a paymentId that starts null and is
// set after startPayment()), React re-evaluates the *current* `select`
// closure rather than one captured by a stale, dependency-less effect —
// the bug that silently kept the checkout handoff panel from ever showing
// a payment once one had just been created.
//
// Many selectors (`.filter(...)`) allocate a new array on every call even
// when nothing changed, which would otherwise make getSnapshot() return a
// new reference every render and trigger React's "getSnapshot should be
// cached" infinite-loop guard. The cache below re-runs `select` every call
// (so it's always current) but returns the previous reference when the
// result is shallow-equal, giving React a stable value to compare against.
function useFinanceSubscription<T>(select: () => T): T {
  const cache = useRef<{ has: boolean; value: T }>({ has: false, value: undefined as T });
  const getSnapshot = () => {
    const next = select();
    if (cache.current.has && shallowEqual(cache.current.value, next)) return cache.current.value;
    cache.current = { has: true, value: next };
    return next;
  };
  return useSyncExternalStore(FinanceStoreEngine.subscribe, getSnapshot, getSnapshot);
}

export function useContracts(accountId?: string): Contract[] {
  return useFinanceSubscription(() => (accountId ? ContractService.getForAccount(accountId) : ContractService.getAll()));
}
export function useContract(id: string | undefined): Contract | undefined {
  return useFinanceSubscription(() => (id ? ContractService.getById(id) : undefined));
}
export function useContractForExecutionProject(executionProjectId: string | undefined): Contract | undefined {
  return useFinanceSubscription(() => (executionProjectId ? ContractService.getByExecutionProjectId(executionProjectId) : undefined));
}

export function useInvoices(accountId?: string): Invoice[] {
  return useFinanceSubscription(() => (accountId ? InvoiceService.getForAccount(accountId) : InvoiceService.getAll()));
}
export function useInvoice(id: string | undefined): Invoice | undefined {
  return useFinanceSubscription(() => (id ? InvoiceService.getById(id) : undefined));
}
export function useInvoicesForExecution(executionProjectId: string | undefined): Invoice[] {
  return useFinanceSubscription(() => (executionProjectId ? InvoiceService.getForExecutionProject(executionProjectId) : []));
}

export function usePayments(accountId?: string): Payment[] {
  return useFinanceSubscription(() => (accountId ? PaymentService.getForAccount(accountId) : PaymentService.getAll()));
}
export function usePayment(id: string | undefined): Payment | undefined {
  return useFinanceSubscription(() => (id ? PaymentService.getById(id) : undefined));
}
export function usePaymentsForInvoice(invoiceId: string | undefined): Payment[] {
  return useFinanceSubscription(() => (invoiceId ? PaymentService.getForInvoice(invoiceId) : []));
}

export function useFundingForExecution(executionProjectId: string | undefined): FundingAllocation[] {
  return useFinanceSubscription(() => (executionProjectId ? FundingService.getForExecutionProject(executionProjectId) : []));
}
export function useFundingForAccount(accountId?: string): FundingAllocation[] {
  return useFinanceSubscription(() => (accountId ? FundingService.getForAccount(accountId) : FundingService.getAll()));
}

export function useSettlements(accountId?: string): Settlement[] {
  return useFinanceSubscription(() => (accountId ? SettlementService.getForAccount(accountId) : SettlementService.getAll()));
}
export function useSettlement(id: string | undefined): Settlement | undefined {
  return useFinanceSubscription(() => (id ? SettlementService.getById(id) : undefined));
}

export function useRefunds(accountId?: string): RefundRequest[] {
  return useFinanceSubscription(() => (accountId ? RefundService.getForAccount(accountId) : RefundService.getAll()));
}

export function useDisputes(accountId?: string): PaymentDispute[] {
  return useFinanceSubscription(() => (accountId ? DisputeService.getForAccount(accountId) : DisputeService.getAll()));
}

export function useReconciliation(): ReconciliationRecord[] {
  return useFinanceSubscription(() => ReconciliationService.getAll());
}

export function useFinanceConfig(): PaymentConfiguration {
  return useFinanceSubscription(() => ConfigService.getConfig());
}

export function useFinanceNotifications(accountId: string | undefined): FinanceNotification[] {
  return useFinanceSubscription(() => (accountId ? FinanceStoreEngine.getStore().notifications.filter((n) => n.accountId === accountId) : []));
}
