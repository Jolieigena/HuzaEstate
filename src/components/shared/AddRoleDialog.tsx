"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import Dialog from "@/components/Dialog";
import Select from "@/components/shared/Select";
import { useAuth } from "@/lib/auth-context";
import { COUNTRY_OPTIONS, findCountry } from "@/lib/countries";
import { useLanguage } from "@/lib/i18n/language";
import { useToast } from "@/lib/toast-context";
import { REQUESTABLE_ROLE_LABELS, RoleRequestsApi, type RequestableRole } from "@/lib/roleRequests/api";

const fieldClass = "w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-[#2ec440] focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20";

/** Asks for another role on the signed-in account. The request goes to an administrator; once approved the role shows up under
 *  Switch role in the account menu. `roles` is what the account can still ask for. */
export default function AddRoleDialog({ open, onClose, roles }: { open: boolean; onClose: () => void; roles: RequestableRole[] }) {
  const { token, account } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const titleId = useId();
  const [role, setRole] = useState<RequestableRole>(roles[0]);
  const [kind, setKind] = useState<"individual" | "firm">("individual");
  const [country, setCountry] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<RequestableRole[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !token) return;
    let cancelled = false;
    RoleRequestsApi.mine(token).then((result) => {
      if (!cancelled && result.ok) setPending(result.data.filter((r) => r.status === "pending").map((r) => r.role));
    });
    return () => {
      cancelled = true;
    };
  }, [open, token]);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setRole(roles[0]);
      setKind("individual");
      setCountry(findCountry(account?.country ?? "")?.name ?? "");
      setNote("");
      setError("");
    }
  }

  const needsCountry = role === "professional" || role === "supplier";
  const alreadyAsked = pending.includes(role);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || saving || alreadyAsked) return;
    if (needsCountry && !country) {
      setError(t("Please choose your country."));
      return;
    }
    setSaving(true);
    setError("");
    const result = await RoleRequestsApi.submit(token, {
      role,
      note: note.trim() || undefined,
      ...(needsCountry ? { country } : {}),
      ...(role === "professional" ? { professionalKind: kind } : {}),
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    showToast(t("Request sent. We will let you know when it is answered."));
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} panelClassName="max-w-md">
      <form onSubmit={submit} className="p-6 sm:p-8">
        <h2 id={titleId} className="mb-5 text-xl font-black text-slate-900">
          {t("Add a role")}
        </h2>

        <label className="mb-4 block text-sm font-bold text-slate-700">
          {t("Role")}
          <Select className={`${fieldClass} mt-1`} value={role} onChange={(e) => setRole(e.target.value as RequestableRole)}>
            {roles.map((value) => (
              <option key={value} value={value}>
                {t(REQUESTABLE_ROLE_LABELS[value])}
              </option>
            ))}
          </Select>
        </label>

        {role === "professional" && (
          <label className="mb-4 block text-sm font-bold text-slate-700">
            {t("I work as")}
            <Select className={`${fieldClass} mt-1`} value={kind} onChange={(e) => setKind(e.target.value as "individual" | "firm")}>
              <option value="individual">{t("An individual")}</option>
              <option value="firm">{t("A firm")}</option>
            </Select>
          </label>
        )}

        {needsCountry && (
          <label className="mb-4 block text-sm font-bold text-slate-700">
            {t("Country")}
            <Select className={`${fieldClass} mt-1`} value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="">{t("Choose a country")}</option>
              {COUNTRY_OPTIONS.map((option) => (
                <option key={option.code} value={option.name}>
                  {option.name}
                </option>
              ))}
            </Select>
          </label>
        )}

        <label className="block text-sm font-bold text-slate-700">
          {t("Note for the team")} <span className="font-normal text-slate-400">({t("optional")})</span>
          <textarea className={`${fieldClass} mt-1 min-h-24`} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} />
        </label>

        {alreadyAsked && <p className="mt-3 text-sm font-semibold text-amber-600">{t("Waiting for approval")}</p>}
        {error && (
          <p role="alert" className="mt-3 text-sm font-semibold text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50">
            {t("Cancel")}
          </button>
          <button type="submit" disabled={saving || alreadyAsked} className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440] disabled:opacity-50">
            {saving ? t("Sending…") : t("Send request")}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
