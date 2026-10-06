"use client";

import { describeDistricts, describePropertyCategories } from "@/lib/admin/propertyCategories";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { hasOrgPermission } from "@/lib/orgPermissions";
import { AdminApi, type AdminOrganization, type OrgRequestReason } from "@/lib/admin/api";
import { useToast } from "@/lib/toast-context";
import Dialog from "@/components/Dialog";
import AddressInput from "@/components/shared/AddressInput";
import PhoneInput, { cleanPhone, phoneProblem } from "@/components/shared/PhoneInput";
import { Card, PageFrame, PrimaryButton, RequirePermission, SecondaryButton, fieldClass } from "@/components/admin/ui";

const REQUEST_REASONS: { value: OrgRequestReason; label: string }[] = [
  { value: "add_country", label: "Add a country" },
  { value: "remove_country", label: "Remove a country" },
  { value: "billing", label: "Billing" },
  { value: "account_access", label: "Account access" },
  { value: "other", label: "Other" },
];

// Lets an org admin edit their own organisation's contact details — name, description, contact
// email/phone, address. Deliberately does NOT let them touch countries: that stays a
// platform-admin decision (see access-service's updateOrganization, which enforces this
// server-side too, not just here).
export function OrgOrganisationPage() {
  const { token, account, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const canView = (account?.roles.includes("organization_admin") ?? false) && hasOrgPermission(account?.permissions, "manage_organisation");

  const [org, setOrg] = useState<AdminOrganization | null>(null);
  const [form, setForm] = useState<{ name: string; description: string; contactEmail: string; contactPhone: string; address: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestReason, setRequestReason] = useState<OrgRequestReason>("add_country");
  const [requestMessage, setRequestMessage] = useState("");
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [savingAutoPublish, setSavingAutoPublish] = useState(false);

  useEffect(() => {
    if (!isAuthReady || !token || !canView || !account?.organizationId) return;
    let cancelled = false;
    AdminApi.getOrganization(token, account.organizationId).then((result) => {
      if (!cancelled && result.ok) setOrg(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, canView, account?.organizationId]);

  const values = form ?? { name: org?.name ?? "", description: org?.description ?? "", contactEmail: org?.contactEmail ?? "", contactPhone: org?.contactPhone ?? "", address: org?.address ?? "" };
  const dirty = !!org && (
    values.name !== org.name ||
    values.description !== (org.description ?? "") ||
    values.contactEmail !== (org.contactEmail ?? "") ||
    values.contactPhone !== (org.contactPhone ?? "") ||
    values.address !== (org.address ?? "")
  );

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !org) return;
    const phoneIssue = phoneProblem(values.contactPhone);
    if (phoneIssue) {
      showToast(`Contact phone: ${phoneIssue}`, "error");
      return;
    }
    setSaving(true);
    const result = await AdminApi.updateOrganization(token, org.id, {
      name: values.name,
      description: values.description,
      contactEmail: values.contactEmail,
      contactPhone: cleanPhone(values.contactPhone),
      address: values.address,
    });
    setSaving(false);
    if (result.ok) {
      setOrg(result.data);
      setForm(null);
      showToast("Organisation updated.");
    } else showToast(result.error, "error");
  }

  async function setAutoPublish(next: boolean | null) {
    if (!token || !org || savingAutoPublish) return;
    setSavingAutoPublish(true);
    const result = await AdminApi.updateOrganization(token, org.id, { autoPublish: next });
    setSavingAutoPublish(false);
    if (result.ok) {
      setOrg(result.data);
      showToast("Auto-publish setting saved.");
    } else showToast(result.error, "error");
  }

  function openRequest() {
    setRequestReason("add_country");
    setRequestMessage("");
    setRequestSent(false);
    setRequestOpen(true);
  }

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (requestReason === "other" && !requestMessage.trim()) {
      showToast("Please describe your request.", "error");
      return;
    }
    setRequestSubmitting(true);
    const result = await AdminApi.createOrgRequest(token, { reason: requestReason, message: requestMessage.trim() || undefined });
    setRequestSubmitting(false);
    if (result.ok) {
      setRequestSent(true);
    } else showToast(result.error, "error");
  }

  return (
    <PageFrame title="Organisation">
      <RequirePermission granted={canView}>
        {!org ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading…</p>
        ) : (
          <Card className="max-w-xl">
            <form className="grid gap-4" onSubmit={handleSave}>
              <label className="text-sm font-bold text-slate-700">
                Name
                <input className={`${fieldClass} mt-1`} value={values.name} onChange={(e) => setForm({ ...values, name: e.target.value })} />
              </label>
              <label className="text-sm font-bold text-slate-700">
                Description
                <textarea className={`${fieldClass} mt-1`} rows={3} value={values.description} onChange={(e) => setForm({ ...values, description: e.target.value })} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-bold text-slate-700">
                  Contact email
                  <input type="email" className={`${fieldClass} mt-1`} value={values.contactEmail} onChange={(e) => setForm({ ...values, contactEmail: e.target.value })} />
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Contact phone
                  <div className="mt-1">
                    <PhoneInput value={values.contactPhone} onChange={(v) => setForm({ ...values, contactPhone: v })} />
                  </div>
                </label>
              </div>
              <label className="text-sm font-bold text-slate-700">
                Address
                <div className="mt-1">
                  <AddressInput value={values.address} onChange={(v) => setForm({ ...values, address: v })} />
                </div>
              </label>
              <div>
                <p className="text-sm font-bold text-slate-700">Countries</p>
                <p className="mt-1 text-sm text-slate-600">{org.countries.length > 0 ? org.countries.join(", ") : "None assigned"}</p>
                <p className="mt-1 text-xs text-slate-400">Set by a platform administrator.</p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">Regions</p>
                <p className="mt-1 text-sm text-slate-600">{describeDistricts(org.districts)}</p>
                <p className="mt-1 text-xs text-slate-400">Set by a platform administrator. Your staff can only be scoped to these districts.</p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">Property categories</p>
                <p className="mt-1 text-sm text-slate-600">{describePropertyCategories(org.propertyTypes)}</p>
                <p className="mt-1 text-xs text-slate-400">Set by a platform administrator. Listings outside these categories aren&apos;t shown to your organisation.</p>
                <SecondaryButton type="button" className="mt-2 min-h-9 px-3 py-1.5 text-xs" onClick={openRequest}>
                  Request a change
                </SecondaryButton>
              </div>
              <PrimaryButton type="submit" disabled={!dirty || saving} className="w-full">
                {saving ? "Saving…" : "Save changes"}
              </PrimaryButton>
            </form>
          </Card>
        )}

        {org && org.countries.length > 0 && (
          <Card className="mt-5 max-w-xl">
            <h3 className="text-sm font-bold text-slate-900">Auto-publish</h3>
            <p className="mt-1 text-sm text-slate-500">
              By default, a new listing in {org.countries.join(", ")} waits for a reviewer before it goes live
              (unless a platform administrator has already made auto-publish the default everywhere). Opt in here to
              skip review for listings in your organisation&apos;s countries, or opt out to always require it.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {([
                { value: true, label: "Always auto-publish" },
                { value: false, label: "Always require review" },
                { value: null, label: "Use platform default" },
              ] as const).map((opt) => {
                const active = (org.autoPublish ?? null) === opt.value;
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    disabled={savingAutoPublish}
                    onClick={() => setAutoPublish(opt.value)}
                    className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors disabled:opacity-50 ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </Card>
        )}
      </RequirePermission>

      <Dialog open={requestOpen} onClose={() => setRequestOpen(false)} labelledBy="org-request-title" panelClassName="max-w-lg p-6">
        {requestSent ? (
          <>
            <h2 id="org-request-title" className="text-lg font-bold text-slate-900">
              Request sent
            </h2>
            <p className="mt-2 text-sm text-slate-600">A platform administrator will review it and follow up.</p>
            <div className="mt-6 flex justify-end">
              <PrimaryButton className="min-h-10 px-4 py-2 text-sm" onClick={() => setRequestOpen(false)}>
                Done
              </PrimaryButton>
            </div>
          </>
        ) : (
          <form onSubmit={submitRequest}>
            <h2 id="org-request-title" className="text-lg font-bold text-slate-900">
              Request a change
            </h2>
            <p className="mt-1 text-sm text-slate-500">Submit a request to a platform administrator — they&apos;ll review it and make the change if approved.</p>
            <label className="mt-4 block text-sm font-bold text-slate-700">
              Reason
              <select className={`${fieldClass} mt-2`} value={requestReason} onChange={(e) => setRequestReason(e.target.value as OrgRequestReason)}>
                {REQUEST_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 block text-sm font-bold text-slate-700">
              Message {requestReason !== "other" && <span className="font-medium text-slate-400">(optional)</span>}
              <textarea
                className={`${fieldClass} mt-2 min-h-24`}
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder={requestReason === "other" ? "Describe your request…" : "Any extra detail that would help…"}
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <SecondaryButton type="button" className="min-h-10 px-4 py-2 text-sm" onClick={() => setRequestOpen(false)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={requestSubmitting} className="min-h-10 px-4 py-2 text-sm">
                {requestSubmitting ? "Sending…" : "Send request"}
              </PrimaryButton>
            </div>
          </form>
        )}
      </Dialog>
    </PageFrame>
  );
}
