"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Card, PageFrame, PrimaryLink } from "./ui";

// Professionals don't get the country-editable settings other roles have — their country is
// admin-assigned for scoping (see access-service's createUserByAdmin) — so this stays small:
// account details plus the existing change-password flow.
export default function SettingsPage() {
  const { account } = useAuth();

  return (
    <PageFrame title="Settings">
      <Card className="max-w-lg">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Name</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{account?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Email</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{account?.email ?? "—"}</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-400">
          To change your name or email, contact an administrator. Your public profile details (bio, specialisation, services, photo) are managed on the <Link href="/professional/profile" className="font-bold text-[#219b31] hover:underline">Profile</Link> page.
        </p>
        <div className="mt-5">
          <PrimaryLink href="/change-password">Change password</PrimaryLink>
        </div>
      </Card>
    </PageFrame>
  );
}
