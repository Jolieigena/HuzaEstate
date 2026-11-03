"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Dialog from "@/components/Dialog";
import MultiSelectCombobox from "@/components/shared/MultiSelectCombobox";
import PhoneInput, { cleanPhone, phoneProblem } from "@/components/shared/PhoneInput";
import Select from "@/components/shared/Select";
import { useAuth } from "@/lib/auth-context";
import { COUNTRY_OPTIONS, findCountry } from "@/lib/countries";
import { useLanguage } from "@/lib/i18n/language";
import { MAX_SPECIALISATIONS, SPECIALISATION_GROUPS } from "@/lib/professional/specialisations";
import { REQUESTABLE_ROLE_LABELS, RoleRequestsApi, type RequestableRole, type RoleRequestDetails } from "@/lib/roleRequests/api";
import { SUPPLIER_CATEGORIES } from "@/lib/suppliers/api";
import { useToast } from "@/lib/toast-context";

const fieldClass = "w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-[#2ec440] focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20";

/** Asks for another role on the signed-in account. The request goes to an administrator; once approved the role shows up under
 *  Switch role in the account menu. A professional or a supplier gives the basics of their profile here, so the profile
 *  form is already part filled when they open it. `roles` is what the account can still ask for. */
export default function AddRoleDialog({ open, onClose, roles }: { open: boolean; onClose: () => void; roles: RequestableRole[] }) {
  const { token, account, refreshAccount } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const titleId = useId();
  const [role, setRole] = useState<RequestableRole>(roles[0]);
  const [kind, setKind] = useState<"individual" | "firm">("individual");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [specialisations, setSpecialisations] = useState<string[]>([]);
  const [years, setYears] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState("");
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
      setCity("");
      setPhone("");
      setSpecialisations([]);
      setYears("");
      setCompanyName("");
      setCategories([]);
      setNote("");
      setError("");
    }
  }

  const needsProfile = role === "professional" || role === "supplier";
  const alreadyAsked = pending.includes(role);

  const addCustomCategory = () => {
    const text = customCategory.trim().replace(/\s+/g, " ").slice(0, 60);
    if (text && !categories.some((c) => c.toLowerCase() === text.toLowerCase())) setCategories((list) => [...list, text]);
    setCustomCategory("");
  };

  const toggleCategory = (name: string) => setCategories((list) => (list.includes(name) ? list.filter((c) => c !== name) : [...list, name]));

  const problem = (): string => {
    if (!needsProfile) return "";
    if (!country) return t("Please choose your country.");
    if (role === "professional" && specialisations.length === 0) return t("Choose at least one specialisation.");
    if (role === "supplier" && !companyName.trim()) return t("Please enter your company name.");
    if (!city.trim()) return t("Please enter your city.");
    return phoneProblem(phone) ?? "";
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || saving || alreadyAsked) return;
    const message = problem();
    if (message) {
      setError(message);
      return;
    }
    const details: RoleRequestDetails | undefined = !needsProfile
      ? undefined
      : role === "professional"
        ? { city: city.trim(), phone: cleanPhone(phone), specialisations, ...(years !== "" ? { yearsExperience: Number(years) } : {}) }
        : { city: city.trim(), phone: cleanPhone(phone), companyName: companyName.trim(), categories };
    setSaving(true);
    setError("");
    const result = await RoleRequestsApi.submit(token, {
      role,
      note: note.trim() || undefined,
      ...(needsProfile ? { country } : {}),
      ...(role === "professional" ? { professionalKind: kind } : {}),
      ...(details ? { details } : {}),
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.data.status === "approved") {
      // A shop opens at once: refresh the account so the supplier workspace is there, and go to it.
      await refreshAccount();
      showToast(t("Your shop is open. Finish your profile, then add your products."));
      onClose();
      router.push("/supplier");
      return;
    }
    showToast(t("Request sent. We will let you know when it is answered."));
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} panelClassName="max-w-lg">
      <form onSubmit={submit} className="flex max-h-[88vh] flex-col p-6 sm:p-8">
        <h2 id={titleId} className="mb-5 text-xl font-black text-slate-900">
          {t("Add a role")}
        </h2>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          <label className="block text-sm font-bold text-slate-700">
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
            <>
              <label className="block text-sm font-bold text-slate-700">
                {t("I work as")}
                <Select className={`${fieldClass} mt-1`} value={kind} onChange={(e) => setKind(e.target.value as "individual" | "firm")}>
                  <option value="individual">{t("An individual")}</option>
                  <option value="firm">{t("A firm")}</option>
                </Select>
              </label>
              <div className="text-sm font-bold text-slate-700">
                {t("Specialisations")}
                <div className="mt-1">
                  <MultiSelectCombobox value={specialisations} onChange={setSpecialisations} groups={SPECIALISATION_GROUPS} max={MAX_SPECIALISATIONS} placeholder={t("Search and choose what you specialise in…")} ariaLabel={t("Specialisations")} />
                </div>
              </div>
              <label className="block text-sm font-bold text-slate-700">
                {t("Years of experience")} <span className="font-normal text-slate-400">({t("optional")})</span>
                <input type="number" min={0} max={80} className={`${fieldClass} mt-1`} value={years} onChange={(e) => setYears(e.target.value)} />
              </label>
            </>
          )}

          {role === "supplier" && (
            <>
              <label className="block text-sm font-bold text-slate-700">
                {t("Company name")}
                <input className={`${fieldClass} mt-1`} value={companyName} maxLength={160} onChange={(e) => setCompanyName(e.target.value)} />
              </label>
              <div className="text-sm font-bold text-slate-700">
                {t("What you sell")} <span className="font-normal text-slate-400">({t("optional")})</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[...SUPPLIER_CATEGORIES, ...categories.filter((c) => !SUPPLIER_CATEGORIES.includes(c))].map((name) => (
                    <button key={name} type="button" aria-pressed={categories.includes(name)} onClick={() => toggleCategory(name)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${categories.includes(name) ? "border-[#2ec440] bg-[#2ec440]/10 text-[#219b31]" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                      {t(name)}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    className={fieldClass}
                    placeholder={t("Something else")}
                    value={customCategory}
                    maxLength={60}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomCategory();
                      }
                    }}
                  />
                  <button type="button" onClick={addCustomCategory} disabled={!customCategory.trim()} className="rounded-xl bg-slate-900 px-4 text-sm font-bold text-white disabled:opacity-50">
                    {t("Add")}
                  </button>
                </div>
              </div>
            </>
          )}

          {needsProfile && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-bold text-slate-700">
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
                <label className="block text-sm font-bold text-slate-700">
                  {t("City")}
                  <input className={`${fieldClass} mt-1`} value={city} maxLength={120} onChange={(e) => setCity(e.target.value)} />
                </label>
              </div>
              <div className="text-sm font-bold text-slate-700">
                {t("Phone number")}
                <div className="mt-1">
                  <PhoneInput value={phone} onChange={setPhone} required />
                </div>
              </div>
            </>
          )}

          <label className="block text-sm font-bold text-slate-700">
            {t("Note for the team")} <span className="font-normal text-slate-400">({t("optional")})</span>
            <textarea className={`${fieldClass} mt-1 min-h-24`} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} />
          </label>
        </div>

        {alreadyAsked && <p className="mt-3 text-sm font-semibold text-amber-600">{t("Waiting for approval")}</p>}
        {error && (
          <p role="alert" className="mt-3 text-sm font-semibold text-red-600">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
