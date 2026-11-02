"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n/language";

interface Pending {
  key: "professional" | "supplier";
  label: string;
  href: string;
}

/** A small reminder, on every page, for each role the account holds whose profile is not finished yet. A role's own portal already
 *  has a banner for it, so the reminder there is for the other roles. Closing it hides it until the next visit. */
export default function ProfileReminder() {
  const { account, isLoggedIn } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState<string[] | null>(null);
  const storageKey = account ? `huzaestate_profile_reminder_${account.id}` : "";

  useEffect(() => {
    if (!storageKey) return;
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(JSON.parse(sessionStorage.getItem(storageKey) || "[]"));
    } catch {
      setDismissed([]);
    }
  }, [storageKey]);

  if (!isLoggedIn || !account || dismissed === null) return null;
  const roles = account.roles ?? [];
  const within = (prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

  const pending: Pending[] = [];
  if (roles.includes("professional") && account.professionalProfileCompleted === false && !within("/professional")) pending.push({ key: "professional", label: "professional profile", href: "/professional/profile" });
  if (roles.includes("supplier") && account.supplierProfileCompleted === false && !within("/supplier")) pending.push({ key: "supplier", label: "supplier company profile", href: "/supplier/profile" });
  const visible = pending.filter((item) => !dismissed.includes(item.key));
  if (visible.length === 0) return null;

  const close = () => {
    const next = [...dismissed, ...visible.map((item) => item.key)];
    setDismissed(next);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* the reminder simply comes back next visit */
    }
  };

  return (
    <div role="status" className="fixed bottom-20 right-4 z-40 max-w-sm rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-lg sm:bottom-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-amber-900">{t("Remember to finish setting up")}</p>
          <ul className="mt-1.5 space-y-1">
            {visible.map((item) => (
              <li key={item.key}>
                <Link href={item.href} className="text-sm font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-950">
                  {t("Complete your {name}", { name: t(item.label) })}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <button type="button" onClick={close} aria-label={t("Close")} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-amber-700 hover:bg-amber-100">
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  );
}
