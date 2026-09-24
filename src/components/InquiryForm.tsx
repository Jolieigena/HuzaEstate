"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { PropertyApi } from "@/lib/properties/api";
import type { Property } from "@/lib/properties/types";

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-[#2ec440] focus:ring-4 focus:ring-[#2ec440]/10 placeholder:text-slate-400";

/** Sends a message to the listing's owner (property-service /inquiries). It lands in the
 *  owner's Inquiries tab; anyone can send one, signed in or not. */
export default function InquiryForm({ property }: { property: Property }) {
  const { account, token } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const isOwner = !!account && account.id === property.ownerId;
  if (isOwner) return <p className="text-sm text-slate-500">This is your listing. Buyer and renter messages appear in your Inquiries tab.</p>;

  if (sent) {
    return (
      <div className="rounded-2xl bg-[#2ec440]/10 p-5 text-sm text-[#219b31]">
        <p className="font-bold">Message sent.</p>
        <p className="mt-1 text-slate-600">The owner will get back to you at {email || account?.email}.</p>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await PropertyApi.sendInquiry(
      { propertyId: property.id, name: (name || account?.name || "").trim(), email: (email || account?.email || "").trim(), phone: phone.trim() || undefined, message: message.trim() },
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
      <input className={inputClass} placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <textarea
        className={inputClass}
        rows={4}
        required
        placeholder={`Hi, I'm interested in "${property.title}". Is it still available?`}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className="w-full rounded-xl bg-slate-900 py-3.5 font-bold text-white shadow-sm transition-colors hover:bg-[#2ec440] disabled:opacity-60">
        {busy ? "Sending…" : "Message the owner"}
      </button>
    </form>
  );
}
