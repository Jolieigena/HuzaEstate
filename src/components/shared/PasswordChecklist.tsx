"use client";

import { passwordChecks } from "@/lib/passwordRules";

/** Live list of the password rules, shown once the person starts typing. Each line turns green when met. */
export default function PasswordChecklist({ password }: { password: string }) {
  if (!password) return null;
  return (
    <ul className="mt-2 space-y-1" aria-live="polite">
      {passwordChecks(password).map((check) => (
        <li key={check.label} className={`flex items-center gap-2 text-xs font-medium ${check.ok ? "text-[#219b31]" : "text-slate-500"}`}>
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            {check.ok ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /> : <circle cx="12" cy="12" r="8" strokeWidth="2" />}
          </svg>
          {check.label}
        </li>
      ))}
    </ul>
  );
}
