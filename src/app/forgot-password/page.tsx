"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(() => (searchParams.get("email") ?? "").slice(0, 254));
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-huza-client": "web" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) setSent(true);
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
      <h1 className="mb-8 text-2xl font-bold text-slate-900">Forgot your password?</h1>
      {sent ? (
        <p role="status" className="rounded-xl border border-[#2ec440]/30 bg-[#2ec440]/10 px-4 py-3 text-sm font-semibold text-slate-800">
          If an account exists for that address, we have emailed a link to choose a new password. It works for one hour.
        </p>
      ) : (
        <form className="space-y-5" onSubmit={submit}>
          {error && <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 transition-colors focus:border-[#2ec440] focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20"
            />
          </div>
          <button type="submit" disabled={busy} className="w-full rounded-xl bg-slate-900 py-4 font-bold text-white transition-colors hover:bg-[#2ec440] disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
      <p className="mt-8 text-center text-sm text-slate-500">
        <Link href="/login" className="font-bold text-[#2ec440] transition-colors hover:text-[#28b039]">Back to sign in</Link>
      </p>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
