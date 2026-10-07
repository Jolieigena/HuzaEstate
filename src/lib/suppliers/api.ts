// access-service client for a furniture supplier's own company profile.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";

export const SUPPLIER_CATEGORIES = ["Sofas & seating", "Beds & mattresses", "Tables & desks", "Storage & wardrobes", "Kitchen furniture", "Lighting", "Rugs & curtains", "Decor & accessories", "Outdoor furniture", "Office furniture"];

export interface SupplierProfile {
  accountId: string;
  companyName: string;
  logoUrl?: string;
  bio: string;
  categories: string[];
  city?: string;
  country?: string;
  phone?: string;
  completedAt?: string | null;
}

export type SupplierProfileInput = { companyName: string; bio: string; categories: string[]; city: string; phone: string; logoUrl?: string };

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function call<T>(path: string, token: string, init: { method?: string; body?: unknown } = {}): Promise<Result<T>> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: init.method ?? "GET",
      headers: { Authorization: `Bearer ${token}`, ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}) },
      ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
    });
    if (!res.ok) {
      let message = "Something went wrong. Please try again.";
      try {
        const data = await res.json();
        message = Array.isArray(data?.message) ? data.message.join(" ") : data?.message || data?.error || message;
      } catch {
        // keep the default message
      }
      return { ok: false, error: message };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
  }
}

export const SuppliersApi = {
  getMine: (token: string) => call<{ profile: SupplierProfile | null }>("/suppliers/me", token),
  saveMine: (token: string, input: SupplierProfileInput) => call<{ profile: SupplierProfile }>("/suppliers/me", token, { method: "PUT", body: input }),
};
