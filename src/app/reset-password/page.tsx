"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PasswordInput from "@/components/shared/PasswordInput";
import PasswordChecklist from "@/components/shared/PasswordChecklist";
import { PASSWORD_MIN_LENGTH, passwordIsAcceptable } from "@/lib/passwordRules";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";

function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setError("");
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    if (!passwordIsAcceptable(password)) {
      setError("Please choose a password that meets every rule listed.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-huza-client": "web" },
        body: JSON.stringify({ token, password }),
      });
      if (res.ok) setDone(true);
      else {
        const data = await res.json().catch(() => null);
        setError(typeof data?.message === "string" ? data.message : "Something went wrong. Please try again.");
      }
    } catch {
      setError("Could not reach the server. Please try again.");
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto w-full max-w-[440px] px-6 py-20">
      <h1 className="mb-8 text-2xl font-bold text-slate-900">Choose a new password</h1>
      {done ? (
        <>
          <p role="status" className="rounded-xl border border-[#2ec440]/30 bg-[#2ec440]/10 px-4 py-3 text-sm font-semibold text-slate-800">Your password was changed.</p>
          <Link href="/login" className="mt-6 flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 font-bold text-white transition-colors hover:bg-[#2ec440]">Sign in</Link>
        </>
      ) : !token ? (
        <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          This link is not valid. <Link href="/forgot-password" className="underline">Ask for a new one.</Link>
        </p>
      ) : (
        <form className="space-y-5" onSubmit={submit}>
          {error && (
            <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error} {/expired|already used|not valid/i.test(error) && <Link href="/forgot-password" className="underline">Ask for a new link.</Link>}
            </p>
          )}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">New password</label>
            <PasswordInput placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={PASSWORD_MIN_LENGTH} autoComplete="new-password" required />
            <PasswordChecklist password={password} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Confirm new password</label>
            <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={PASSWORD_MIN_LENGTH} autoComplete="new-password" required />
          </div>
          <button type="submit" disabled={busy} className="w-full rounded-xl bg-slate-900 py-4 font-bold text-white transition-colors hover:bg-[#2ec440] disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? "Saving…" : "Change password"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
