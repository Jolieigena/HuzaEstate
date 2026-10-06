"use client";

import { useId, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { redeemAccessCode, type RedeemedAccess } from "@/lib/accessCodes/api";
import { notifySubscriptionChanged } from "@/lib/postingPlans/hooks";

export function formatLongDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** Tidy what people paste: capitals, no spaces. The server accepts the code with or without its dash. */
function tidy(value: string): string {
  return value.toUpperCase().replace(/\s+/g, "");
}

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-mono text-sm uppercase tracking-wider text-slate-900 outline-none transition focus:border-[#2ec440] focus:ring-2 focus:ring-[#2ec440]/15 placeholder:normal-case placeholder:tracking-normal";

/** "Have an access code?": a seller types the code they were emailed and applies it. It gives time-limited
 *  access to a paid plan without paying, and works for brand-new sellers (it also makes them one) and for
 *  existing sellers upgrading. Used wherever a plan is chosen. */
export default function RedeemAccessCode({ onRedeemed, defaultOpen = false }: { onRedeemed?: (result: RedeemedAccess) => void; defaultOpen?: boolean }) {
  const { token } = useAuth();
  const inputId = useId();
  const [open, setOpen] = useState(defaultOpen);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<RedeemedAccess | null>(null);

  const apply = async () => {
    if (!token || busy || !code.trim()) return;
    setBusy(true);
    setError("");
    const result = await redeemAccessCode(token, code);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDone(result.data);
    // Anything showing the plan (the Manager overview, the paywall) refetches.
    notifySubscriptionChanged();
    onRedeemed?.(result.data);
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">
        <p className="font-bold">{done.tierLabel} access is active.</p>
        <p className="mt-0.5">
          You can use it until {formatLongDate(done.accessEndsAt)} ({done.days} day{done.days === 1 ? "" : "s"}). After that you go back to your usual plan, or you can subscribe to keep it.
        </p>
        {!done.sellerRoleGranted && <p className="mt-1 text-xs">Sign out and back in if your seller tools don&apos;t appear straight away.</p>}
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-bold text-[#219b31] underline-offset-2 hover:underline">
        Have an access code?
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
      <label htmlFor={inputId} className="block text-sm font-bold text-slate-700">
        Access code
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          id={inputId}
          className={inputClass}
          value={code}
          onChange={(e) => {
            setCode(tidy(e.target.value));
            if (error) setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
          }}
          placeholder="HZE-XXXXXXXX"
          autoComplete="off"
          autoFocus={!defaultOpen}
          maxLength={20}
          spellCheck={false}
        />
        <button type="button" onClick={apply} disabled={busy || !code.trim()} className="shrink-0 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#2ec440] disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? "Applying…" : "Apply"}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">Use the email address your code was sent to.</p>
      {error && <p className="mt-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}
    </div>
  );
}

/** The same code, as a plain field inside a form (the become-a-seller page applies it after the account
 *  is created, so there's no Apply button here). Always visible, so nobody has to find a link first. */
export function AccessCodeField({ value, onChange, autoFocus = false }: { value: string; onChange: (next: string) => void; autoFocus?: boolean }) {
  const inputId = useId();
  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-bold text-slate-700">
        Have an access code? <span className="font-medium text-slate-400">(optional)</span>
      </label>
      <input id={inputId} className={`${inputClass} mt-2`} value={value} onChange={(e) => onChange(tidy(e.target.value))} placeholder="HZE-XXXXXXXX" autoComplete="off" autoFocus={autoFocus} maxLength={20} spellCheck={false} />
      <p className="mt-2 text-xs text-slate-500">Sign up with the email address your code was sent to.</p>
    </div>
  );
}
