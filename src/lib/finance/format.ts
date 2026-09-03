export { formatMoney } from "./money";

export function formatDate(iso: string | undefined | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-RW", { dateStyle: "medium" }).format(d);
}

export function formatDateTime(iso: string | undefined | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-RW", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export function humanize(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const PROTOTYPE_TRANSACTION_LABEL = "Demonstration data — not a real transaction. No real funds are collected, held or transferred.";
export const PROTOTYPE_DOCUMENT_LABEL = "Prototype financial document — not an official tax invoice.";
export const PROTOTYPE_ACKNOWLEDGEMENT_LABEL = "Prototype acknowledgement — not a verified, legally binding electronic signature.";
