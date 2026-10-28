"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { allowsFullPayment, describePlan, installmentsOf } from "@/lib/properties/paymentOptions";
import PhoneInput, { cleanPhone, phoneProblem } from "@/components/shared/PhoneInput";
import { useAuth } from "@/lib/auth-context";
import { PropertyApi } from "@/lib/properties/api";
import type { Property } from "@/lib/properties/types";

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-[#2ec440] focus:ring-4 focus:ring-[#2ec440]/10 placeholder:text-slate-400";

/** Sends a message to the listing's poster (property-service /inquiries). It lands in their
 *  Inquiries tab; anyone can send one, signed in or not. Copy calls them "realtor" only when
 *  they've actually said they're a listing agent (property.ownerType) — otherwise "owner",
 *  since most sellers here are private individuals listing their own place, not agents. */
export default function InquiryForm({ property }: { property: Property }) {
  const { account, token } = useAuth();
  // The links in the emails about an inquiry open this form with the sender's details filled in (?name=&email=&phone=).
  const hint = useSearchParams();
  const [name, setName] = useState(() => (hint.get("name") ?? "").slice(0, 160));
  const [email, setEmail] = useState(() => (hint.get("email") ?? "").slice(0, 254));
  const [phone, setPhone] = useState(() => (hint.get("phone") ?? "").slice(0, 20));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const plan = installmentsOf(property);
  const bothWays = !!plan && allowsFullPayment(property);
  const [payWith, setPayWith] = useState<"full" | "installments">("full");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const isOwner = !!account && account.id === property.ownerId;
  if (isOwner) return <p className="text-sm text-slate-500">This is your listing. Buyer and renter messages appear in your Inquiries tab.</p>;

  const posterLabel = property.ownerType === "agent" ? "realtor" : "owner";

  if (sent) {
    return (
      <div className="rounded-2xl bg-[#2ec440]/10 p-5 text-sm text-[#219b31]">
        <p className="font-bold">Message sent.</p>
        <p className="mt-1 text-slate-600">The {posterLabel} will get back to you at {email || account?.email}.</p>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const phoneIssue = phoneProblem(phone);
    if (phoneIssue) {
      setError(`Phone: ${phoneIssue}`);
      return;
    }
    setBusy(true);
    const result = await PropertyApi.sendInquiry(
      { propertyId: property.id, name: (name || account?.name || "").trim(), email: (email || account?.email || "").trim(), phone: cleanPhone(phone) || undefined, message: plan && (bothWays || !allowsFullPayment(property)) ? `${message.trim()}\n\nPayment preference: ${bothWays && payWith === "full" ? "in full" : `in installments (${describePlan(plan)})`}` : message.trim() },
      token
    );
    setBusy(false);
    if (result.ok) setSent(true);
    else setError(result.error);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <input className={inputClass} placeholder="Your name" required value={name || account?.name || ""} onChange={(e) => setName(e.target.value)} />
      <input className={inputClass} type="email" placeholder="Your email" required value={email || account?.email || ""} onChange={(e) => setEmail(e.target.value)} />
      <PhoneInput value={phone} onChange={setPhone} placeholder="Phone (optional)" />
      <textarea
        className={inputClass}
        rows={4}
        required
        placeholder={`Hi, I'm interested in "${property.title}". Is it still available?`}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      {bothWays && (
        <div role="radiogroup" aria-label="How you would pay" className="grid grid-cols-2 gap-2">
          {([["full", "Pay in full"], ["installments", "Installments"]] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={payWith === value}
              onClick={() => setPayWith(value)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors ${payWith === value ? "border-[#2ec440] bg-[#2ec440]/5 text-[#2ec440]" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className="w-full rounded-xl bg-slate-900 py-3.5 font-bold text-white shadow-sm transition-colors hover:bg-[#2ec440] disabled:opacity-60">
        {busy ? "Sending…" : `Message the ${posterLabel}`}
      </button>
    </form>
  );
}
