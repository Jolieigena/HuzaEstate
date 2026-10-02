// access-service client for a professional's public profile (displayName, bio, specialisation,
// services, portfolio, photo) and the public contact form.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";
const PROPERTY_API_URL = process.env.NEXT_PUBLIC_PROPERTY_API_URL || "http://localhost:8081/api/property-service";

export interface PortfolioItemInput {
  title: string;
  description?: string;
  /** Deprecated — superseded by `images` (plural). Only ever present on a project saved before
   *  multi-image support existed; new saves never write it. */
  imageUrl?: string;
  images?: string[];
  videoUrl?: string;
  year?: number;
}

export interface ServiceOfferingInput {
  name: string;
  description?: string;
}

export type ProfessionalKind = "individual" | "firm";

export interface RealProfessionalProfile {
  accountId: string;
  kind: ProfessionalKind;
  displayName: string;
  photoUrl?: string;
  bio: string;
  specialisation: string;
  yearsExperience?: number;
  city: string;
  country: string;
  /** District within `country` (see src/lib/regions.ts) — admin-assigned, same treatment as
   *  `country`. Absent for countries with no district reference data (every country but Rwanda
   *  at launch) or accounts created before this field. */
  district?: string;
  phone: string;
  portfolio: PortfolioItemInput[];
  services: ServiceOfferingInput[];
  completedAt: string | null;
  averageRating?: number;
  reviewCount?: number;
}

// Uploads a professional's photo (profile picture or a portfolio project image) via
// property-service's shared MinIO presign endpoint — same flow as src/lib/media/upload.ts uses
// for property photos, just under the "professionals" storage folder instead of "properties".
export async function uploadProfessionalImage(file: Blob, contentType: string, token: string): Promise<string> {
  const presignRes = await fetch(`${PROPERTY_API_URL}/media/upload-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ contentType, folder: "professionals" }),
  });
  if (!presignRes.ok) {
    const data = await presignRes.json().catch(() => null);
    throw new Error(data?.message || "Could not prepare the upload.");
  }
  const { uploadUrl, publicUrl } = await presignRes.json();
  const putRes = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
  if (!putRes.ok) throw new Error("Upload failed. Please try again.");
  return publicUrl as string;
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

// kind, country, and district are deliberately excluded — all three are admin-assigned (kind at
// account creation, country/district the scoping fields set there too) and the backend ignores
// them in this request even if sent (see access-service's upsertMyProfile).
export type SaveProfileInput = Omit<RealProfessionalProfile, "accountId" | "completedAt" | "kind" | "country" | "district">;

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

// A professional's own inbox of contact-form submissions (auth required).

export interface ProfessionalInquiryReply {
  message: string;
  createdAt: string;
}

export interface ProfessionalInquiry {
  id: string;
  professionalId?: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  read: boolean;
  createdAt: string;
  /** A platform/org admin's note about this inquiry — see nudgeProfessionalInquiry. */
  adminNudges: ProfessionalInquiryReply[];
}

/** Platform-admin/org-admin listing only — adds who the inquiry was sent to. */
export interface AdminProfessionalInquiry extends ProfessionalInquiry {
  professionalName?: string;
  professionalEmail?: string;
}

export async function fetchMyProfessionalInquiries(token: string): Promise<ProfessionalInquiry[]> {
  try {
    const res = await fetch(`${API_URL}/professionals/me/inquiries`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.inquiries as ProfessionalInquiry[]) ?? [];
  } catch {
    return [];
  }
}

export async function markProfessionalInquiryRead(token: string, id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/professionals/me/inquiries/${encodeURIComponent(id)}/read`, {
      method: "PATCH",
      headers: { "x-huza-client": "web", Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Administrators only: every professional-contact-form inquiry on the platform, unscoped. */
export async function fetchAllProfessionalInquiries(token: string): Promise<AdminProfessionalInquiry[]> {
  try {
    const res = await fetch(`${API_URL}/professionals/inquiries/all`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.inquiries as AdminProfessionalInquiry[]) ?? [];
  } catch {
    return [];
  }
}

/** organization_admin only: every inquiry against a professional whose own country is in the
 *  caller's organisation's countries. */
export async function fetchOrgProfessionalInquiries(token: string): Promise<AdminProfessionalInquiry[]> {
  try {
    const res = await fetch(`${API_URL}/professionals/inquiries/org`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.inquiries as AdminProfessionalInquiry[]) ?? [];
  } catch {
    return [];
  }
}

export type NudgeResult = { ok: true; delivered: boolean } | { ok: false; error: string };

/** Platform admin, or org admin (in-scope country) — a note to the professional, recorded on the
 *  inquiry and emailed to them. */
export async function nudgeProfessionalInquiry(token: string, id: string, message: string): Promise<NudgeResult> {
  try {
    const res = await fetch(`${API_URL}/professionals/inquiries/${encodeURIComponent(id)}/nudge`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-huza-client": "web", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { ok: false, error: data?.message || data?.error || "Could not send that note. Please try again." };
    }
    const data = await res.json();
    return { ok: true, delivered: data.delivered === true };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
  }
}

// Reviews — public read, authenticated write (must have a prior inquiry on record, enforced
// server-side — see access-service's submitReview).

export interface ProfessionalReview {
  id: string;
  reviewerName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface ProfessionalReviewList {
  reviews: ProfessionalReview[];
  averageRating: number;
  reviewCount: number;
}

export async function fetchProfessionalReviews(accountId: string): Promise<ProfessionalReviewList> {
  try {
    const res = await fetch(`${API_URL}/professionals/${encodeURIComponent(accountId)}/reviews`);
    if (!res.ok) return { reviews: [], averageRating: 0, reviewCount: 0 };
    const data = await res.json();
    return { reviews: data.reviews ?? [], averageRating: data.averageRating ?? 0, reviewCount: data.reviewCount ?? 0 };
  } catch {
    return { reviews: [], averageRating: 0, reviewCount: 0 };
  }
}

export type SubmitReviewResult = { ok: true } | { ok: false; error: string };

export async function submitProfessionalReview(token: string, accountId: string, input: { rating: number; comment?: string }): Promise<SubmitReviewResult> {
  try {
    const res = await fetch(`${API_URL}/professionals/${encodeURIComponent(accountId)}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-huza-client": "web", Authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { ok: false, error: data?.message || data?.error || "Could not submit your review. Please try again." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
  }
}
