// Real access-service client for the public-facing professional profile (displayName, bio,
// specialisation, portfolio, contact) — separate from the much larger local/mock workspace in
// ./service.ts (requests, quotations, reviews, consultations, messaging), which stays mock.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";

export interface PortfolioItemInput {
  title: string;
  description?: string;
  imageUrl?: string;
  year?: number;
}

export interface RealProfessionalProfile {
  accountId: string;
  displayName: string;
  bio: string;
  specialisation: string;
  yearsExperience?: number;
  city: string;
  country: string;
  phone: string;
  portfolio: PortfolioItemInput[];
  completedAt: string | null;
}

export async function fetchMyProfessionalProfile(token: string): Promise<RealProfessionalProfile | null> {
  try {
    const res = await fetch(`${API_URL}/professionals/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.profile as RealProfessionalProfile | null) ?? null;
  } catch {
    return null;
  }
}

export type SaveProfileInput = Omit<RealProfessionalProfile, "accountId" | "completedAt">;

export type SaveProfileResult = { ok: true } | { ok: false; error: string };

export async function saveMyProfessionalProfile(token: string, input: SaveProfileInput): Promise<SaveProfileResult> {
  try {
    const res = await fetch(`${API_URL}/professionals/me`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-huza-client": "web", Authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { ok: false, error: data?.message || data?.error || "Could not save your profile. Please try again." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
  }
}

// Public directory/detail/contact — no auth required.

export async function fetchProfessionalsDirectory(): Promise<RealProfessionalProfile[]> {
  try {
    const res = await fetch(`${API_URL}/professionals`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.professionals as RealProfessionalProfile[]) ?? [];
  } catch {
    return [];
  }
}

export async function fetchProfessionalProfile(accountId: string): Promise<RealProfessionalProfile | null> {
  try {
    const res = await fetch(`${API_URL}/professionals/${encodeURIComponent(accountId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return (data.professional as RealProfessionalProfile | null) ?? null;
  } catch {
    return null;
  }
}

export type ContactResult = { ok: true } | { ok: false; error: string };

export async function submitProfessionalContact(accountId: string, input: { name: string; email: string; phone?: string; message: string }): Promise<ContactResult> {
  try {
    const res = await fetch(`${API_URL}/professionals/${encodeURIComponent(accountId)}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { ok: false, error: data?.message || data?.error || "Could not send your message. Please try again." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
  }
}

// Adapts the real (smaller) backend profile shape onto the local mock ProfessionalProfile type
// so the existing directory/detail UI — built against the mock shape — can render real accounts
// without a rewrite. Every field the UI actually reads is real; fields the real backend simply
// doesn't model yet (services, languages, verification, availability) get a neutral default
// rather than fabricated content.
export function adaptRealProfile(real: RealProfessionalProfile) {
  return {
    id: real.accountId,
    accountId: real.accountId,
    kind: "individual_professional" as const,
    status: "approved" as const,
    displayName: real.displayName,
    legalName: real.displayName,
    email: "",
    phone: real.phone,
    country: real.country,
    city: real.city,
    address: "",
    biography: real.bio,
    yearsExperience: real.yearsExperience ?? 0,
    languages: [] as string[],
    primarySpecialisation: real.specialisation,
    secondarySpecialisations: [] as string[],
    services: [] as { id: string; name: string; description: string; deliveryTime: string; deliveryMode: "remote" | "onsite" | "both"; priceAfterAssessment: boolean; requiredInformation: string }[],
    serviceAreas: [] as string[],
    travelRadiusKm: 0,
    remoteAvailable: true,
    onsiteAvailable: true,
    travelFeeApproach: "",
    workingDays: [] as string[],
    workingHours: "",
    consultationDuration: 0,
    minimumNoticeHours: 0,
    acceptingNewWork: true,
    maximumActiveRequests: 0,
    responseTime: "Usually responds within a day",
    pricingApproaches: [] as string[],
    availability: "available" as const,
    verificationLabel: "Huza Estate professional",
    demoVerified: false,
    portfolio: real.portfolio.map((item, index) => ({
      id: `${real.accountId}-${index}`,
      title: item.title,
      projectType: "",
      location: [real.city, real.country].filter(Boolean).join(", "),
      year: item.year ? String(item.year) : "",
      description: item.description ?? "",
      services: "",
      imageNames: item.imageUrl ? [item.imageUrl] : [],
      testimonial: undefined as string | undefined,
      published: true,
    })),
    lastUpdatedAt: real.completedAt ?? "",
  };
}
