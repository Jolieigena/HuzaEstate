import Link from "next/link";
import { PROTOTYPE_TRANSACTION_LABEL } from "@/lib/finance/format";

export function PageFrame({ title, description, action, children }: { title: string; description: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</section>;
}

const FINANCE_STATUS_STYLE: { match: RegExp; className: string }[] = [
  { match: /(successful|paid|completed|active|approved|matched|resolved|released|protected|confirmed)/, className: "bg-[#2ec440]/10 text-[#219b31]" },
  { match: /(failed|rejected|cancelled|disputed|overdue|mismatch|frozen|declined)/, className: "bg-red-50 text-red-700" },
  { match: /(pending|processing|awaiting|requested|draft|review|scheduled|investigation|not_)/, className: "bg-amber-50 text-amber-700" },
  { match: /(refunded|credited|expired|withdrawn)/, className: "bg-slate-100 text-slate-600" },
];

export function FinancePill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const style = FINANCE_STATUS_STYLE.find((s) => s.match.test(normalized))?.className ?? "bg-blue-50 text-blue-700";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${style}`}>{status.replace(/_/g, " ")}</span>;
}

export const PrimaryButton = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...props} className={`min-h-11 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440] disabled:cursor-not-allowed disabled:opacity-50 ${props.className ?? ""}`}>
    {children}
  </button>
);
export const SecondaryButton = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...props} className={`min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-[#2ec440] hover:text-[#219b31] disabled:opacity-50 ${props.className ?? ""}`}>
    {children}
  </button>
);
export const DestructiveButton = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...props} className={`min-h-11 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 ${props.className ?? ""}`}>
    {children}
  </button>
);
export const PrimaryLink = ({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) => (
  <Link href={href} className={`inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440] ${className}`}>
    {children}
  </Link>
);

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <Card className="py-14 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-3-3v6m9-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="font-black text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

export function AccessDeniedNote({ children }: { children: React.ReactNode }) {
  return (
    <Card className="border-red-100 bg-red-50/60 py-10 text-center">
      <h3 className="font-black text-red-700">Access denied</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-red-700/80">{children}</p>
    </Card>
  );
}

export const fieldClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-[#2ec440] focus:ring-2 focus:ring-[#2ec440]/15";
export const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500";

export function PrototypeBanner({ compact = false }: { compact?: boolean }) {
  return (
    <div role="note" className={`flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 ${compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"}`}>
      <svg className={`${compact ? "h-4 w-4" : "h-5 w-5"} flex-shrink-0 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="font-medium">{PROTOTYPE_TRANSACTION_LABEL}</span>
    </div>
  );
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">{children}</h2>;
}
