const PROPERTY_API_URL = process.env.NEXT_PUBLIC_PROPERTY_API_URL || "http://localhost:8081/api/property-service";

export interface ZillowHome {
  id: string;
  address: string;
  city: string;
  state: string;
  price: number;
  currency: string;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  homeType: string;
  image: string;
  photos: string[];
  url: string;
  daysOnZillow: number | null;
}

export interface ZillowStatus {
  enabled: boolean;
  cities: { key: string; name: string }[];
}

/** Whether US homes from Zillow are switched on, and the cities they can be shown for. Off (and no cities) when anything goes wrong. */
export async function fetchZillowStatus(): Promise<ZillowStatus> {
  try {
    const res = await fetch(`${PROPERTY_API_URL}/zillow/status`);
    if (!res.ok) return { enabled: false, cities: [] };
    const body = await res.json();
    return { enabled: !!body.enabled, cities: Array.isArray(body.cities) ? body.cities : [] };
  } catch {
    return { enabled: false, cities: [] };
  }
}

/** One US home by its number (the part of /properties/us-<number> after "us-"), or null when it is gone. */
export async function fetchZillowHome(id: string): Promise<ZillowHome | null> {
  try {
    const res = await fetch(`${PROPERTY_API_URL}/zillow/homes/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    const body = await res.json();
    return body?.home ?? null;
  } catch {
    return null;
  }
}

export async function fetchZillowHomes(city: string): Promise<{ ok: true; homes: ZillowHome[]; updatedAt: string } | { ok: false }> {
  try {
    const res = await fetch(`${PROPERTY_API_URL}/zillow/listings?city=${encodeURIComponent(city)}`);
    if (!res.ok) return { ok: false };
    const body = await res.json();
    return { ok: true, homes: Array.isArray(body.homes) ? body.homes : [], updatedAt: String(body.updatedAt || "") };
  } catch {
    return { ok: false };
  }
}
