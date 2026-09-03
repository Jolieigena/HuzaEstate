import { FinanceStoreEngine } from "./store";
import { newId } from "./ids";
import type { Money, ReconciliationRecord, ReconciliationStatus } from "./types";

export const ReconciliationService = {
  getAll(): ReconciliationRecord[] {
    return FinanceStoreEngine.getStore().reconciliationRecords;
  },
  getById(id: string): ReconciliationRecord | undefined {
    return FinanceStoreEngine.getStore().reconciliationRecords.find((r) => r.id === id);
  },

  create(input: { paymentId?: string; settlementId?: string; invoiceId?: string; fundingAllocationId?: string; internalAmount?: Money; providerAmount?: Money; status: ReconciliationStatus }): ReconciliationRecord {
    return FinanceStoreEngine.mutate((s) => {
      const record: ReconciliationRecord = { ...input, id: newId("recon"), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      s.reconciliationRecords = [...s.reconciliationRecords, record];
      return record;
    });
  },

  assign(id: string, adminId: string): ReconciliationRecord | undefined {
    return FinanceStoreEngine.mutate((s) => {
      const record = s.reconciliationRecords.find((r) => r.id === id);
      if (!record) return undefined;
      record.assignedToAdminId = adminId;
      record.status = record.status === "pending" ? "requires_investigation" : record.status;
      record.updatedAt = new Date().toISOString();
      s.reconciliationRecords = s.reconciliationRecords.map((r) => (r.id === id ? record : r));
      return record;
    });
  },

  addNote(id: string, note: string): ReconciliationRecord | undefined {
    return FinanceStoreEngine.mutate((s) => {
      const record = s.reconciliationRecords.find((r) => r.id === id);
      if (!record) return undefined;
      record.note = record.note ? `${record.note}\n\n${note}` : note;
      record.updatedAt = new Date().toISOString();
      s.reconciliationRecords = s.reconciliationRecords.map((r) => (r.id === id ? record : r));
      return record;
    });
  },

  linkProviderRecord(id: string, providerAmount: Money): ReconciliationRecord | undefined {
    return FinanceStoreEngine.mutate((s) => {
      const record = s.reconciliationRecords.find((r) => r.id === id);
      if (!record) return undefined;
      record.providerAmount = providerAmount;
      record.status = record.internalAmount && record.internalAmount.amountMinor === providerAmount.amountMinor && record.internalAmount.currency === providerAmount.currency ? "matched" : record.internalAmount?.currency !== providerAmount.currency ? "currency_mismatch" : "amount_mismatch";
      record.updatedAt = new Date().toISOString();
      s.reconciliationRecords = s.reconciliationRecords.map((r) => (r.id === id ? record : r));
      return record;
    });
  },

  /** Provider-confirmed amounts are never edited manually — only resolved with a reason. */
  markResolved(id: string, resolvedBy: string, reason: string): ReconciliationRecord | undefined {
    const updated = FinanceStoreEngine.mutate((s) => {
      const record = s.reconciliationRecords.find((r) => r.id === id);
      if (!record) return undefined;
      record.status = "resolved";
      record.resolvedBy = resolvedBy;
      record.resolutionReason = reason;
      record.resolvedAt = new Date().toISOString();
      record.updatedAt = record.resolvedAt;
      s.reconciliationRecords = s.reconciliationRecords.map((r) => (r.id === id ? record : r));
      return record;
    });
    if (updated) FinanceStoreEngine.appendAudit("reconciliation_resolved", resolvedBy, "reconciliation", id, reason, reason);
    return updated;
  },
};
