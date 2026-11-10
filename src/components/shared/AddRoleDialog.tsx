"use client";

import ImageDropArea from "@/components/shared/ImageDropArea";
import { useEffect, useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Dialog from "@/components/Dialog";
import MultiSelectCombobox from "@/components/shared/MultiSelectCombobox";
import PhoneInput, { cleanPhone, phoneProblem } from "@/components/shared/PhoneInput";
import Select from "@/components/shared/Select";
import { useAuth } from "@/lib/auth-context";
import { COUNTRY_OPTIONS, findCountry } from "@/lib/countries";
import { useLanguage } from "@/lib/i18n/language";
import { DOCUMENT_ACCEPT, MAX_DOCUMENTS_PER_KIND, documentProblem, uploadVerificationDocument, type DocumentKind, type VerificationDocument } from "@/lib/verificationDocs";
import { MAX_SPECIALISATIONS, SPECIALISATION_GROUPS } from "@/lib/professional/specialisations";
import { REQUESTABLE_ROLE_LABELS, RoleRequestsApi, type RequestableRole, type RoleRequestDetails } from "@/lib/roleRequests/api";
import { useToast } from "@/lib/toast-context";

const fieldClass = "w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-[#2ec440] focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20";

/** Asks for another role on the signed-in account. The request goes to an administrator; once approved the role shows up under
 *  Switch role in the account menu. A professional or a supplier gives the basics of their profile here, so the profile
 *  form is already part filled when they open it. `roles` is what the account can still ask for. */
/** One kind of document an application asks for: what it is, the files sent so far, and a button to add more. */
function DocumentField({
  title,
  required,
  files,
  busy,
  error,
  onAdd,
  onRemove,
}: {
  title: string;
  required?: boolean;
  files: VerificationDocument[];
  busy: boolean;
  error?: string;
  onAdd: (list: FileList | File[] | null) => void;
  onRemove: (key: string) => void;
}) {
  const { t } = useLanguage();
  const full = files.length >= MAX_DOCUMENTS_PER_KIND;
  return (
    <ImageDropArea className="text-sm font-bold text-slate-700" onFiles={(pictures) => onAdd(pictures)} disabled={busy || full}>
      {title}
      {required ? <span className="text-red-500"> *</span> : <span className="font-normal text-slate-400"> ({t("optional")})</span>}
      <ul className="mt-1 space-y-1">
        {files.map((file) => (
          <li key={file.key} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
            <span className="min-w-0 truncate">{file.name}</span>
            <button type="button" onClick={() => onRemove(file.key)} aria-label={`${t("Remove")} ${file.name}`} className="shrink-0 font-bold text-red-600 hover:underline">
              {t("Remove")}
            </button>
          </li>
        ))}
      </ul>
      {!full && (
        <label className={`mt-1 flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 px-4 text-sm font-bold text-slate-600 transition-colors hover:border-[#2ec440] hover:text-[#219b31] ${busy ? "pointer-events-none opacity-60" : ""}`}>
          {busy ? t("Uploading…") : files.length ? t("Add another file") : t("Add a PDF or photo")}
          <input
            type="file"
            accept={DOCUMENT_ACCEPT}
            multiple
            hidden
            disabled={busy}
            onChange={(e) => {
              onAdd(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      )}
      {error && (
        <p role="alert" className="mt-1 text-xs font-semibold text-red-600">
          {error}
        </p>
      )}
    </ImageDropArea>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="mt-1 text-xs font-semibold text-red-600">
      {message}
    </p>
  ) : null;
}

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
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<RequestableRole[]>([]);
  const [error, setError] = useState("");
  const [terms, setTerms] = useState(false);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [workLink, setWorkLink] = useState("");
  const [uploading, setUploading] = useState<DocumentKind | null>(null);
  const [documentErrors, setDocumentErrors] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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
      setNote("");
      setError("");
      setTerms(false);
      setDocuments([]);
      setWorkLink("");
      setUploading(null);
      setDocumentErrors({});
      setFieldErrors({});
    }
  }

  const needsProfile = role === "professional" || role === "supplier";
  const alreadyAsked = pending.includes(role);


  /** What is wrong, by field, so each message shows next to the field it is about. */
  const problems = (): Record<string, string> => {
    const found: Record<string, string> = {};
    if (needsProfile) {
      if (!country) found.country = t("Please choose your country.");
      if (role === "professional" && specialisations.length === 0) found.specialisations = t("Choose at least one specialisation.");
      if (role === "professional") {
        const has = (docKind: DocumentKind) => documents.some((d) => d.kind === docKind);
        if (kind === "firm" && !has("business")) found.business = t("Upload your business registration certificate.");
        if (kind === "individual" && !has("qualification")) found.qualification = t("Upload your degree, licence or certificate.");
        if (!has("work") && !workLink.trim()) found.work = t("Show some of your work: upload files, or add a link to it.");
        if (workLink.trim() && !/^https:\/\/\S+$/.test(workLink.trim())) found.workLink = t("The link must start with https://");
      }
      if (role === "supplier" && !companyName.trim()) found.companyName = t("Please enter your company name.");
      if (!city.trim()) found.city = t("Please enter your city.");
      const phoneIssue = phoneProblem(phone);
      if (phoneIssue) found.phone = phoneIssue;
      if (!terms) found.terms = t("Please accept the Terms of Service and Privacy Policy to continue.");
    }
    return found;
  };

  const addFiles = async (docKind: DocumentKind, list: FileList | File[] | null) => {
    if (!list || !token) return;
    const room = MAX_DOCUMENTS_PER_KIND - documents.filter((d) => d.kind === docKind).length;
    setDocumentErrors((current) => ({ ...current, [docKind]: "" }));
    for (const file of Array.from(list).slice(0, Math.max(room, 0))) {
      const problem = documentProblem(file);
      if (problem) {
        setDocumentErrors((current) => ({ ...current, [docKind]: t(problem) }));
        continue;
      }
      setUploading(docKind);
      try {
        const sent = await uploadVerificationDocument(file, docKind, token);
        setDocuments((current) => [...current, sent]);
        setFieldErrors((current) => ({ ...current, [docKind]: "" }));
      } catch (caught) {
        setDocumentErrors((current) => ({ ...current, [docKind]: caught instanceof Error ? caught.message : t("Upload failed. Please try again.") }));
      }
    }
    setUploading(null);
  };
  const removeFile = (key: string) => setDocuments((current) => current.filter((d) => d.key !== key));
  const filesOf = (docKind: DocumentKind) => documents.filter((d) => d.kind === docKind);
  const documentError = (docKind: string) => documentErrors[docKind] || fieldErrors[docKind];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || saving || alreadyAsked || uploading) return;
    const found = problems();
    setFieldErrors(found);
    if (Object.keys(found).length > 0) return;
    const details: RoleRequestDetails | undefined = !needsProfile
      ? undefined
      : role === "professional"
        ? {
            city: city.trim(),
            phone: cleanPhone(phone),
            specialisations,
            ...(years !== "" ? { yearsExperience: Number(years) } : {}),
            // Only what applies to how they work: an individual's degree and ID, a firm's registration, and proof of work for both.
            documents: documents.filter((d) => (kind === "firm" ? d.kind !== "id" : d.kind !== "business")),
            ...(workLink.trim() ? { workLink: workLink.trim() } : {}),
          }
        : { city: city.trim(), phone: cleanPhone(phone), companyName: companyName.trim() };
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
    showToast(role === "professional" ? t("Your request to become a professional has been sent. We will tell you here and by email when it is answered.") : t("Request sent. We will let you know when it is answered."));
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
                <FieldError message={fieldErrors.specialisations} />
              </div>
              <label className="block text-sm font-bold text-slate-700">
                {t("Years of experience")} <span className="font-normal text-slate-400">({t("optional")})</span>
                <input type="number" min={0} max={80} className={`${fieldClass} mt-1`} value={years} onChange={(e) => setYears(e.target.value)} />
              </label>

              {kind === "firm" ? (
                <>
                  <DocumentField title={t("Business registration certificate")} required files={filesOf("business")} busy={uploading === "business"} error={documentError("business")} onAdd={(list) => void addFiles("business", list)} onRemove={removeFile} />
                  <DocumentField title={t("Licences or certificates")} files={filesOf("qualification")} busy={uploading === "qualification"} error={documentError("qualification")} onAdd={(list) => void addFiles("qualification", list)} onRemove={removeFile} />
                </>
              ) : (
                <>
                  <DocumentField title={t("Degree, licence or certificate")} required files={filesOf("qualification")} busy={uploading === "qualification"} error={documentError("qualification")} onAdd={(list) => void addFiles("qualification", list)} onRemove={removeFile} />
                  <DocumentField title={t("National ID or passport")} files={filesOf("id")} busy={uploading === "id"} error={documentError("id")} onAdd={(list) => void addFiles("id", list)} onRemove={removeFile} />
                </>
              )}
              <DocumentField title={t("Proof of your work")} required files={filesOf("work")} busy={uploading === "work"} error={documentError("work")} onAdd={(list) => void addFiles("work", list)} onRemove={removeFile} />
              <label className="block text-sm font-bold text-slate-700">
                {t("Link to your work")} <span className="font-normal text-slate-400">({t("optional")})</span>
                <input className={`${fieldClass} mt-1`} value={workLink} maxLength={300} placeholder="https://…" inputMode="url" onChange={(e) => setWorkLink(e.target.value)} />
                <FieldError message={fieldErrors.workLink} />
              </label>
            </>
          )}

          {role === "supplier" && (
            <>
              <label className="block text-sm font-bold text-slate-700">
                {t("Company name")}
                <input className={`${fieldClass} mt-1`} value={companyName} maxLength={160} onChange={(e) => setCompanyName(e.target.value)} />
                <FieldError message={fieldErrors.companyName} />
              </label>
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
                  <FieldError message={fieldErrors.country} />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  {t("City")}
                  <input className={`${fieldClass} mt-1`} value={city} maxLength={120} onChange={(e) => setCity(e.target.value)} />
                  <FieldError message={fieldErrors.city} />
                </label>
              </div>
              <div className="text-sm font-bold text-slate-700">
                {t("Phone number")}
                <div className="mt-1">
                  <PhoneInput value={phone} onChange={setPhone} required />
                </div>
                <FieldError message={fieldErrors.phone} />
              </div>
              <div>
                <label className="flex items-start gap-3 text-sm font-normal leading-relaxed text-slate-600">
                  <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[#2ec440]" />
                  <span>
                    {t("I agree to HuzaEstate's")}{" "}
                    <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-bold text-[#2ec440] hover:underline">
                      {t("Terms of Service")}
                    </Link>{" "}
                    {t("and")}{" "}
                    <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="font-bold text-[#2ec440] hover:underline">
                      {t("Privacy Policy")}
                    </Link>
                    .
                  </span>
                </label>
                <FieldError message={fieldErrors.terms} />
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
          <button type="submit" disabled={saving || alreadyAsked || !!uploading} className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440] disabled:opacity-50">
            {saving ? t("Sending…") : t("Send request")}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
