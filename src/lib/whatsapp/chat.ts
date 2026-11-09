"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";

/** Whose WhatsApp number the chat button asks for. */
export type ChatKind = "professional" | "designer" | "supplier";

/** "+250 788 123 456" -> "+250788123456". Anything without a country code is not a number WhatsApp can open, so it comes back as null. */
export function internationalPhone(raw: string | null | undefined): string | null {
  const text = (raw ?? "").replace(/[\s().-]/g, "");
  return /^\+\d{8,15}$/.test(text) ? text : null;
}

/** The address that opens WhatsApp on the visitor's phone (or WhatsApp Web) with the message already written. */
export function whatsappUrl(phone: string, message: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

const found = new Map<string, string | null>();

/**
 * The WhatsApp number of a professional, a design's designer or a shop's supplier. It is given to signed-in visitors only (the same rule
 * as a professional's phone), so the number is looked up after sign-in and never sits in a page anyone can read.
 */
export function useWhatsappContact(kind: ChatKind, id: string | undefined): string | null {
  const { token, isAuthReady } = useAuth();
  const key = id ? `${kind}:${id}` : "";
  const [, bump] = useState(0);

  useEffect(() => {
    if (!isAuthReady || !token || !key || found.has(key)) return;
    let cancelled = false;
    fetch(`${API_URL}/auth/whatsapp/contact/${kind}/${encodeURIComponent(id!)}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        const data = res.ok ? await res.json().catch(() => null) : null;
        found.set(key, internationalPhone(data?.phone));
      })
      .catch(() => found.set(key, null))
      .finally(() => {
        if (!cancelled) bump((n) => n + 1);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, key, kind, id]);

  return token && key ? (found.get(key) ?? null) : null;
}
