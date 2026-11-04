"use client";

import { useState, type FormEvent } from "react";
import PhoneInput, { cleanPhone, phoneProblem } from "@/components/shared/PhoneInput";
import { useAuth, type Account } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n/language";
import { WhatsappApi } from "@/lib/whatsapp/api";

function WhatsappIcon() {
  return (
    <svg className="h-5 w-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2a9.9 9.9 0 00-8.46 15.04L2 22l5.1-1.34A9.9 9.9 0 1012.04 2zm0 1.8a8.1 8.1 0 11-4.13 15.07l-.3-.18-3.02.8.81-2.95-.2-.31A8.1 8.1 0 0112.04 3.8zm-3.2 3.9c-.17 0-.45.06-.69.32-.24.26-.9.88-.9 2.14s.92 2.48 1.05 2.65c.13.17 1.78 2.85 4.4 3.88 2.18.86 2.62.69 3.09.65.47-.04 1.52-.62 1.73-1.22.22-.6.22-1.11.15-1.22-.06-.11-.24-.17-.5-.3-.26-.13-1.52-.75-1.76-.84-.24-.09-.41-.13-.58.13-.17.26-.67.84-.82 1.01-.15.17-.3.2-.56.07-.26-.13-1.1-.4-2.1-1.29-.77-.69-1.3-1.54-1.45-1.8-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.33-.02-.45-.07-.13-.58-1.4-.8-1.92-.21-.5-.42-.43-.58-.44h-.5z" />
    </svg>
  );
}

/** Sign in with a code sent over WhatsApp, for accounts that have a verified number (added in Settings). */
export default function WhatsappSignIn({ onSuccess }: { onSuccess: (account: Account) => void }) {
  const { t } = useLanguage();
  const { loginWithWhatsapp } = useAuth();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    const problem = phoneProblem(phone);
    if (problem || !cleanPhone(phone)) return setError(problem || t("Enter your WhatsApp number."));
    setBusy(true);
    setError("");
    const result = await WhatsappApi.requestCode(cleanPhone(phone));
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setSentTo(cleanPhone(phone));
    setCode("");
  };

  const signIn = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!/^\d{6}$/.test(code.replace(/\s/g, ""))) return setError(t("Enter the 6-digit code."));
    setBusy(true);
    setError("");
    const result = await loginWithWhatsapp(sentTo, code.replace(/\s/g, ""));
    setBusy(false);
    if (!result.ok) return setError(result.error);
    onSuccess(result.account);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 transition-colors hover:border-[#25D366] hover:text-slate-900"
      >
        <WhatsappIcon />
        {t("Sign in with WhatsApp")}
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      {!sentTo ? (
        <form onSubmit={send} className="space-y-3">
          <div className="text-sm font-bold text-slate-700">
            {t("WhatsApp number")}
            <div className="mt-2">
              <PhoneInput value={phone} onChange={setPhone} required />
            </div>
          </div>
          {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition-colors hover:bg-[#2ec440] disabled:opacity-60">
            {busy ? t("Sending…") : t("Send code")}
          </button>
        </form>
      ) : (
        <form onSubmit={signIn} className="space-y-3">
          <label className="block text-sm font-bold text-slate-700">
            {t("Code from WhatsApp")}
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={7}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ""))}
              placeholder="000000"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-xl font-bold tracking-[0.4em] focus:border-[#2ec440] focus:outline-none focus:ring-4 focus:ring-[#2ec440]/15"
            />
          </label>
          {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition-colors hover:bg-[#2ec440] disabled:opacity-60">
            {busy ? t("Signing in…") : t("Sign in")}
          </button>
          <div className="flex justify-between text-xs font-bold text-slate-500">
            <button type="button" onClick={() => { setSentTo(""); setError(""); }} className="hover:text-slate-800">{t("Change number")}</button>
            <button type="button" onClick={() => void send()} disabled={busy} className="hover:text-slate-800">{t("Send a new code")}</button>
          </div>
        </form>
      )}
    </div>
  );
}
