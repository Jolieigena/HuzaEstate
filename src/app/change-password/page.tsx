"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RequireAuth from "@/components/shared/RequireAuth";
import PasswordInput from "@/components/shared/PasswordInput";
import { useAuth } from "@/lib/auth-context";
import { accountDestination } from "@/lib/navigation";

function ChangePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { account, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const forced = account?.mustChangePassword === true;
  const redirectParam = searchParams.get("redirect");
  const destination = account ? accountDestination(account, redirectParam) : "/login";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    setIsSubmitting(true);
    const result = await changePassword(currentPassword, newPassword);
    if (!result.ok) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }
    router.push(destination);
  };

  return (
    <div className="w-full max-w-[440px]">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">
        {forced ? "Set a new password" : "Change your password"}
      </h1>
      <p className="text-slate-500 mb-8">
        {forced
          ? "Your account was created with a temporary password. Set your own before continuing."
          : "Enter your current password and choose a new one."}
      </p>

      {error && (
        <p className="mb-5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-semibold px-4 py-3">
          {error}
        </p>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Current password</label>
          <PasswordInput
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">New password</label>
          <PasswordInput
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            autoComplete="new-password"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Confirm new password</label>
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            autoComplete="new-password"
            required
          />
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 hover:bg-[#2ec440] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg">
          {isSubmitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <RequireAuth>
      <div className="min-h-screen flex items-center justify-center bg-white p-8 sm:p-12">
        <Suspense fallback={null}>
          <ChangePasswordForm />
        </Suspense>
      </div>
    </RequireAuth>
  );
}
