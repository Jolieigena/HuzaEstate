import type { Attachment } from "@/lib/ai/attachments";

const ACCESS_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";

export const RENOVATE_ROOMS = [
  { id: "living-room", label: "Living room" },
  { id: "bedroom", label: "Bedroom" },
  { id: "kitchen", label: "Kitchen" },
  { id: "bathroom", label: "Bathroom" },
  { id: "dining-room", label: "Dining room" },
  { id: "home-office", label: "Home office" },
  { id: "kids-room", label: "Kids room" },
  { id: "exterior", label: "House outside" },
  { id: "garden", label: "Garden" },
] as const;
export type RenovateRoom = (typeof RENOVATE_ROOMS)[number]["id"];

export const RENOVATE_STYLES = [
  { id: "modern-luxury", label: "Modern luxury" },
  { id: "light-minimal", label: "Light and minimal" },
  { id: "afro-contemporary", label: "Afro-contemporary" },
  { id: "warm-natural", label: "Warm and natural" },
] as const;
export type RenovateStyle = (typeof RENOVATE_STYLES)[number]["id"];

/** The shop categories that belong to each space: step 2 shows what is on sale in them. */
export const ROOM_CATEGORIES: Record<RenovateRoom, string[]> = {
  "living-room": ["Sofas & seating", "Tables & desks", "Lighting", "Rugs & curtains", "Wall art & paintings", "Decor & accessories"],
  bedroom: ["Beds & mattresses", "Storage & wardrobes", "Lighting", "Rugs & curtains", "Wall art & paintings", "Decor & accessories"],
  kitchen: ["Kitchen furniture", "Lighting", "Tiles", "Paints", "Plumbing & sanitary"],
  bathroom: ["Plumbing & sanitary", "Tiles", "Lighting", "Decor & accessories", "Glass sheets"],
  "dining-room": ["Tables & desks", "Lighting", "Rugs & curtains", "Wall art & paintings", "Decor & accessories"],
  "home-office": ["Office furniture", "Tables & desks", "Storage & wardrobes", "Lighting", "Rugs & curtains"],
  "kids-room": ["Beds & mattresses", "Storage & wardrobes", "Rugs & curtains", "Lighting", "Decor & accessories"],
  exterior: ["Paints", "Stones", "Guardrails", "Wood doors", "Frame doors", "Glass sheets", "Outdoor furniture", "Lighting"],
  garden: ["Outdoor furniture", "Stones", "Lighting", "Decor & accessories"],
};

export interface RenovationResult {
  imageUrl: string;
  items?: string[];
}

export type PreviewOutcome = { ok: true; result: RenovationResult } | { ok: false; error: string };

/** Asks the AI to renovate the photos (already uploaded; their addresses are sent). */
export async function previewRenovation(
  token: string,
  input: { photos: string[]; room: RenovateRoom; style: RenovateStyle | string; wish: string; attachments?: Attachment[] },
): Promise<PreviewOutcome> {
  try {
    const res = await fetch(`${ACCESS_API_URL}/renovations/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-huza-client": "web", Authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: data?.message || "Something went wrong. Please try again." };
    return { ok: true, result: data.result as RenovationResult };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
  }
}

/** What each hiring tab looks for among the professionals' specialisations. */
export const DESIGNER_SPECIALISATIONS = ["Architect", "Interior Designer", "Space Planner", "Lighting Designer", "3D Visualisation", "Furniture Designer", "Home Stager", "Landscape Architect"];
export const BUILDER_SPECIALISATIONS = [
  "General Contractor", "Renovation Specialist", "Construction Manager", "Project Manager", "Site Supervisor", "Carpenter", "Painter", "Tiler",
  "Plumber", "Electrician", "Plasterer", "Flooring Installer", "Roofer", "Glazier", "Welder", "Bricklayer / Mason", "Landscaper",
];
