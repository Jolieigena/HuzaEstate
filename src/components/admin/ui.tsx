import Link from "next/link";
import React from "react";

export function PageFrame({ title, description, action, children }: { title: string; description: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1600px] px-6 py-10 sm:px-10 lg:px-12">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between pb-6 border-b border-slate-200/70">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
          {description && <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-500">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) { 
  return (
    <section className={`rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_8px_rgb(0,0,0,0.04)] ${className}`}>
      {children}
    </section>
  ); 
}

export function StatusPill({ status }: { status: string }) { 
  const normalized = status.toLowerCase(); 
  const style = normalized.includes("completed") || normalized.includes("approved") || normalized.includes("published") || normalized.includes("resolved") || normalized.includes("active") || normalized.includes("accepted") ? "bg-emerald-50 text-emerald-700 border-emerald-100" : 
                normalized.includes("declined") || normalized.includes("rejected") || normalized.includes("suspended") || normalized.includes("critical") || normalized.includes("closed") || normalized.includes("urgent") ? "bg-red-50 text-red-700 border-red-100" : 
                normalized.includes("clarification") || normalized.includes("change") || normalized.includes("review") || normalized.includes("pending") || normalized.includes("awaiting") || normalized.includes("escalated") ? "bg-amber-50 text-amber-700 border-amber-100" : 
                "bg-indigo-50 text-indigo-700 border-indigo-100"; 
  
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-wider font-bold ${style}`}>
      {status.replace(/_/g, " ")}
    </span>
  ); 
}

export const PrimaryButton = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...props} className={`min-h-[44px] rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md focus:ring-4 focus:ring-slate-900/10 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${props.className ?? ""}`}>
    {children}
  </button>
);

export const SecondaryButton = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...props} className={`min-h-[44px] rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 focus:ring-4 focus:ring-slate-200/20 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${props.className ?? ""}`}>
    {children}
  </button>
);

export const DestructiveButton = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...props} className={`min-h-[44px] rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md focus:ring-4 focus:ring-red-600/10 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${props.className ?? ""}`}>
    {children}
  </button>
);

export const PrimaryLink = ({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) => (
  <Link href={href} className={`inline-flex min-h-[44px] items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md focus:ring-4 focus:ring-slate-900/10 active:scale-[0.98] ${className}`}>
    {children}
  </Link>
);

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) { 
  return (
    <Card className="py-20 text-center flex flex-col items-center justify-center border-dashed border-2 border-slate-200 bg-slate-50/50">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 text-slate-400">
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-3-3v6m9-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold tracking-tight text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">{description}</p>
      {action && <div className="mt-8">{action}</div>}
    </Card>
  ); 
}

export function AccessDeniedNote({ children }: { children: React.ReactNode }) { 
  return (
    <Card className="border-red-200 bg-red-50/50 py-16 text-center shadow-none">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v2" />
        </svg>
      </div>
      <h3 className="text-xl font-bold tracking-tight text-red-900">Access denied</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-red-700/80">{children}</p>
    </Card>
  ); 
}

export function RequirePermission({ granted, children }: { granted: boolean; children: React.ReactNode }) { 
  if (!granted) return <AccessDeniedNote>You do not have permission to view this section. Contact a Super Administrator if you believe this is a mistake.</AccessDeniedNote>; 
  return <>{children}</>; 
}

export const fieldClass = "w-full rounded-xl border border-slate-200/80 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition-all focus:border-[#2ec440] focus:ring-4 focus:ring-[#2ec440]/10 placeholder:text-slate-400 shadow-sm hover:border-slate-300";

export function formatDate(value: string) { return new Intl.DateTimeFormat("en-RW", { dateStyle: "medium" }).format(new Date(value)); }
export function formatDateTime(value: string) { return new Intl.DateTimeFormat("en-RW", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
export function formatMoney(value: number, currency = "RWF") { return new Intl.NumberFormat("en-RW", { style: "currency", currency, maximumFractionDigits: 0 }).format(value); }

export function AdminTable({ headers, children }: { headers: string[], children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgb(0,0,0,0.04)]">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="border-b border-slate-200/80 bg-slate-50/80">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-[11px]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {children}
        </tbody>
      </table>
    </div>
  );
}
