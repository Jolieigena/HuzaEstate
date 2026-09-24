// access-service landlord profile client: what a seller shows on their rental listings.

const ACCESS_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";

export interface LandlordProfile {
  accountId: string;
  displayName: string;
  photoUrl?: string;
  bio?: string;
  phone?: string;
  responseTime?: string;
  yearsHosting?: number;
}

export type SaveLandlordInput = Omit<LandlordProfile, "accountId">;

/** Public — null when the seller hasn't saved a profile. */
export async function fetchLandlordProfile(accountId: string): Promise<LandlordProfile | null> {
  try {
    const res = await fetch(`${ACCESS_API_URL}/landlords/${encodeURIComponent(accountId)}`);
    if (!res.ok) return null;
    return ((await res.json()).profile as LandlordProfile) ?? null;
  } catch {
    return null;
  }
}

export async function fetchMyLandlordProfile(token: string): Promise<LandlordProfile | null> {
  try {
    const res = await fetch(`${ACCESS_API_URL}/landlords/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    return ((await res.json()).profile as LandlordProfile) ?? null;
  } catch {
    return null;
  }
}

export async function saveMyLandlordProfile(token: string, input: SaveLandlordInput): Promise<{ ok: true; profile: LandlordProfile } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${ACCESS_API_URL}/landlords/me`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-huza-client": "web", Authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { ok: false, error: data?.message || "Could not save your profile. Please try again." };
    }
    return { ok: true, profile: (await res.json()).profile as LandlordProfile };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
  }
}
