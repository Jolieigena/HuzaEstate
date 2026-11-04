"use client";

import { useState, type FormEvent } from "react";
import PhoneInput, { cleanPhone, phoneProblem } from "@/components/shared/PhoneInput";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n/language";
import { useToast } from "@/lib/toast-context";
import { WhatsappApi } from "@/lib/whatsapp/api";

/** The WhatsApp number an account signs in with. Adding one sends it a code; the number is saved once the code is typed back. */
export default function WhatsappNumberCard({ className = "" }: { className?: string }) {
  const { t } = useLanguage();
  const { token, account, refreshAccount } = useAuth();
  const { showToast } = useToast();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!token || !account) return null;

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    const problem = phoneProblem(phone);
    if (problem || !cleanPhone(phone)) return setError(problem || t("Enter your WhatsApp number."));
    setBusy(true);
    setError("");
    const result = await WhatsappApi.startLink(token, cleanPhone(phone));
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setSentTo(cleanPhone(phone));
    setCode("");
  };

  const confirm = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!/^\d{6}$/.test(code.replace(/\s/g, ""))) return setError(t("Enter the 6-digit code."));
    setBusy(true);
    setError("");
    const result = await WhatsappApi.confirmLink(token, sentTo, code.replace(/\s/g, ""));
    if (!result.ok) {
      setBusy(false);
      return setError(result.error);
    }
    await refreshAccount();
    setBusy(false);
    setSentTo("");
    setPhone("");
    showToast(t("WhatsApp number added. You can now sign in with a code."));
  };

  const remove = async () => {
    setBusy(true);
    const result = await WhatsappApi.unlink(token);
    if (result.ok) {
      await refreshAccount();
      showToast(t("WhatsApp number removed."));
    } else showToast(result.error, "error");
    setBusy(false);
  };

  return (
    <div className={`rounded-3xl border border-slate-200 bg-white p-6 ${className}`}>
      <h3 className="text-sm font-bold text-slate-700">{t("WhatsApp number")}</h3>
      {account.whatsappPhone ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-base font-bold text-slate-900">{account.whatsappPhone}</p>
          <button type="button" onClick={remove} disabled={busy} className="rounded-lg px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60">
            {t("Remove")}
          </button>
        </div>
      ) : !sentTo ? (
        <form onSubmit={send} className="mt-3 space-y-3">
          <PhoneInput value={phone} onChange={setPhone} required />
          {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2ec440] disabled:opacity-60">
            {busy ? t("Sending…") : t("Send code")}
          </button>
        </form>
      ) : (
        <form onSubmit={confirm} className="mt-3 space-y-3">
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={7}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ""))}
            placeholder="000000"
            aria-label={t("Code from WhatsApp")}
            className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-xl font-bold tracking-[0.4em] focus:border-[#2ec440] focus:outline-none focus:ring-4 focus:ring-[#2ec440]/15"
          />
          {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={busy} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2ec440] disabled:opacity-60">
              {busy ? t("Checking…") : t("Confirm")}
            </button>
            <button type="button" onClick={() => { setSentTo(""); setError(""); }} className="text-xs font-bold text-slate-500 hover:text-slate-800">
              {t("Change number")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
