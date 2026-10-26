"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";
const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-[#2ec440] focus:ring-2 focus:ring-[#2ec440]/20";

async function post(path: string, body: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-huza-client": "web" },
      body: JSON.stringify(body),
    });
    if (res.ok) return { ok: true };
    const data = await res.json().catch(() => null);
    return { ok: false, error: typeof data?.message === "string" ? data.message : "Something went wrong. Please try again." };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
  }
}

function Panel({ tone, children }: { tone: "ok" | "error"; children: React.ReactNode }) {
  const style = tone === "ok" ? "border-[#2ec440]/30 bg-[#2ec440]/10 text-slate-800" : "border-red-100 bg-red-50 text-red-700";
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${style}`}>
      {children}
    </p>
  );
}

function Confirm({ token }: { token: string }) {
  const [state, setState] = useState<"working" | "done" | { error: string }>("working");
  useEffect(() => {
    let cancelled = false;
    post("/auth/delete-account-confirm", { token }).then((result) => {
      if (!cancelled) setState(result.ok ? "done" : { error: result.error });
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state === "working") return <p className="text-sm font-semibold text-slate-500">Confirming your request…</p>;
  if (state === "done") return <Panel tone="ok">Your request is confirmed. Our team will delete your account.</Panel>;
  return <Panel tone="error">{state.error}</Panel>;
}

function Request() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const result = await post("/auth/delete-account-request", { email: email.trim(), message: message.trim() || undefined });
    setBusy(false);
    if (result.ok) setSent(true);
    else setError(result.error);
  }

  if (sent) {
    return <Panel tone="ok">If an account exists for that address, we have emailed a link to confirm the request. Open it to finish. Nothing is deleted until you do.</Panel>;
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Panel tone="error">{error}</Panel>}
      <label className="block text-sm font-bold text-slate-700">
        Email address of your account
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} mt-2 font-normal`} />
      </label>
      <label className="block text-sm font-bold text-slate-700">
        Anything we should know (optional)
        <textarea rows={3} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} className={`${inputClass} mt-2 font-normal`} />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="min-h-12 w-full rounded-xl bg-slate-900 px-6 text-sm font-bold text-white shadow-lg transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {busy ? "Sending…" : "Request account deletion"}
      </button>
    </form>
  );
}

function Body() {
  const token = useSearchParams().get("confirm");
  return token ? <Confirm token={token} /> : <Request />;
}

/** The request form of the public /delete-account page. Opened from the emailed link (?confirm=...), it confirms the request instead. */
export default function DeleteAccountForm() {
  return (
    <Suspense fallback={null}>
      <Body />
    </Suspense>
  );
}
