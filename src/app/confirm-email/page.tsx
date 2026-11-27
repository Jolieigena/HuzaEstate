"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";

function ConfirmEmail() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  // Where they were heading when they signed up; only a page on this site.
  const rawNext = params.get("next") ?? "";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("\\") ? rawNext : "";
  const email = (params.get("email") ?? "").slice(0, 254);
  const { refreshAccount, isLoggedIn } = useAuth();
  const [state, setState] = useState<"working" | "done" | "failed">(token ? "working" : "failed");
  const [error, setError] = useState(token ? "" : "This link is not valid.");
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/confirm-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-huza-client": "web" },
          body: JSON.stringify({ token }),
        });
        if (res.ok) {
          // A signed-in browser gets its new token now, so discounted prices show straight away.
          await refreshAccount();
          setState("done");
          return;
        }
        const data = await res.json().catch(() => null);
        setError(typeof data?.message === "string" ? data.message : "Something went wrong. Please try again.");
      } catch {
        setError("Could not reach the server. Please try again.");
      }
      setState("failed");
    })();
  }, [token, refreshAccount]);

  return (
    <div className="mx-auto w-full max-w-[440px] px-6 py-20">
      <h1 className="mb-8 text-2xl font-bold text-slate-900">Confirm your email</h1>
      {state === "working" && <p className="text-sm text-slate-600">Confirming…</p>}
      {state === "done" && (
        <>
          <p role="status" className="rounded-xl border border-[#2ec440]/30 bg-[#2ec440]/10 px-4 py-3 text-sm font-semibold text-slate-800">
            {isLoggedIn ? "Your email is confirmed." : "Your email is confirmed. Sign in to continue."}
          </p>
          <Link
            href={isLoggedIn ? next || "/" : `/login?${new URLSearchParams({ ...(email ? { email } : {}), ...(next ? { redirect: next } : {}) }).toString()}`}
            className="mt-6 flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 font-bold text-white transition-colors hover:bg-[#2ec440]"
          >
            {isLoggedIn ? "Continue" : "Sign in"}
          </Link>
        </>
      )}
      {state === "failed" && (
        <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error} {email ? "Try signing in: if your email still needs confirming, you can ask for a new link there." : "You can ask for a new link where your discount is shown."}
        </p>
      )}
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmEmail />
    </Suspense>
  );
}
