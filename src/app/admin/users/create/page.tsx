"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth, type AccountRole } from "@/lib/auth-context";
import { useHasPermission } from "@/lib/admin/hooks";
import { ADMIN_ROLE_LABELS } from "@/lib/admin/permissions";
import type { AdminRole } from "@/lib/admin/types";
import { Card, PageFrame, PrimaryButton, RequirePermission, fieldClass } from "@/components/admin/ui";

// Administrator and Professional are the only roles created from this admin form (enforced
// server-side too — see access-service's POST /auth/admin/users). Customer only ever comes from
// public signup; Seller (Manager) is granted self-serve via the become-a-seller flow, never here.
const ROLE_OPTIONS: { value: Extract<AccountRole, "administrator" | "professional">; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "administrator", label: "Administrator" },
];

export default function CreateUserPage() {
  const { account, createUser } = useAuth();
  const canCreate = useHasPermission(account?.id, "users.manage");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [roleType, setRoleType] = useState<Extract<AccountRole, "administrator" | "professional">>("professional");
  const [adminRole, setAdminRole] = useState<AdminRole>("operations_admin");
  const [professionalKind, setProfessionalKind] = useState<"individual" | "firm">("individual");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ email: string; emailDelivered: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);
    const result = await createUser({
      firstName,
      lastName,
      email,
      roleType,
      adminRole: roleType === "administrator" ? adminRole : undefined,
      professionalKind: roleType === "professional" ? professionalKind : undefined,
    });
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCreated({ email, emailDelivered: result.emailDelivered });
    setFirstName("");
    setLastName("");
    setEmail("");
  };

  return (
    <PageFrame
      title="Create user"
      description="Create an Administrator or Professional account. A randomly generated password is emailed to it, and the holder is forced to change it on first login."
      action={
        <Link href="/admin/users" className="text-sm font-bold text-slate-500 hover:text-[#219b31]">
          Back to Users
        </Link>
      }
    >
      <RequirePermission granted={canCreate}>
        <Card className="max-w-xl">
          {created && (
            <div className={`mb-5 rounded-xl border p-4 text-sm ${created.emailDelivered ? "border-emerald-100 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
              {created.emailDelivered ? (
                <>
                  <p className="font-bold text-emerald-800">Account created for {created.email}</p>
                  <p className="mt-1 text-emerald-700">Sign-in instructions with a temporary password have been emailed to them.</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-amber-800">Account created for {created.email}</p>
                  <p className="mt-1 text-amber-700">We couldn&apos;t confirm the credentials email was delivered — check with them, or contact support to resend it.</p>
                </>
              )}
            </div>
          )}

          {error && (
            <p className="mb-5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-semibold px-4 py-3">
              {error}
            </p>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold text-slate-700">
                First name
                <input className={`${fieldClass} mt-2`} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </label>
              <label className="block text-sm font-bold text-slate-700">
                Last name
                <input className={`${fieldClass} mt-2`} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </label>
            </div>

            <label className="block text-sm font-bold text-slate-700">
              Email address
              <input type="email" className={`${fieldClass} mt-2`} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Role
              <select className={`${fieldClass} mt-2`} value={roleType} onChange={(e) => setRoleType(e.target.value as Extract<AccountRole, "administrator" | "professional">)}>
                {ROLE_OPTIONS.filter(option => option.value !== "administrator" || account?.adminRole === "super_admin").map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            {roleType === "administrator" && (
              <label className="block text-sm font-bold text-slate-700">
                Administrative role
                <select className={`${fieldClass} mt-2`} value={adminRole} onChange={(e) => setAdminRole(e.target.value as AdminRole)}>
                  {Object.entries(ADMIN_ROLE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {roleType === "professional" && (
              <label className="block text-sm font-bold text-slate-700">
                Professional type
                <select className={`${fieldClass} mt-2`} value={professionalKind} onChange={(e) => setProfessionalKind(e.target.value as "individual" | "firm")}>
                  <option value="individual">Individual professional</option>
                  <option value="firm">Firm / company</option>
                </select>
              </label>
            )}

            <PrimaryButton type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Creating…" : "Create account"}
            </PrimaryButton>
          </form>
        </Card>
      </RequirePermission>
    </PageFrame>
  );
}
