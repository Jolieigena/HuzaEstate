"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import RequireAuth from "@/components/shared/RequireAuth";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { useAuth } from "@/lib/auth-context";
import { roleHome } from "@/lib/navigation";
import ProfessionalHeader from "./ProfessionalHeader";
import ProfessionalSidebar from "./ProfessionalSidebar";
import ProfessionalMobileDrawer from "./ProfessionalMobileDrawer";

// Professional accounts are created directly by an administrator (see
// POST /auth/admin/users) — there is no self-serve application/approval flow,
// so every account that reaches this shell either has the "professional" role
// already or doesn't belong here.
export default function ProfessionalShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { account, isAuthReady, switchRole } = useAuth();
  const [switchOpen, setSwitchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isProfessional = account?.roles.includes("professional") ?? false;

  useEffect(() => {
    if (!isAuthReady || !account || isProfessional) return;
    router.replace(roleHome(account.roles[0] ?? "customer"));
  }, [account, isAuthReady, isProfessional, router]);

  if (!isProfessional) {
    return (
      <RequireAuth>
        <div className="min-h-[60vh] flex items-center justify-center text-sm font-semibold text-slate-500">Redirecting…</div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="min-h-full bg-slate-50">
        <ProfessionalHeader onOpenMobileSidebar={() => setMobileOpen(true)} />
        <div className="flex min-h-[calc(100vh-65px)]">
          <ProfessionalSidebar />
          <ProfessionalMobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
          <main className="flex-grow min-w-0">
            {account?.roles.includes("customer") && (
              <div className="mx-auto max-w-[1440px] px-4 pt-4 sm:px-8">
                <button type="button" onClick={() => setSwitchOpen(true)} className="text-sm font-bold text-slate-600 hover:text-[#2ec440]">
                  Switch to Customer Dashboard
                </button>
              </div>
            )}
            {children}
          </main>
        </div>
        {account?.roles.includes("customer") && (
          <ConfirmModal open={switchOpen} onClose={() => setSwitchOpen(false)} onConfirm={() => { switchRole("customer"); setSwitchOpen(false); router.push("/dashboard"); }} title="Switch account role?" description="Your professional drafts remain saved. You will continue with the same account in the Customer Dashboard." confirmLabel="Switch to Customer Dashboard" />
        )}
      </div>
    </RequireAuth>
  );
}
