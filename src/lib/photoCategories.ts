// Shared between client (upload UI) and server (tour generation route) —
// no fs/Node-only APIs here, just data.

export type PhotoCategory =
  | "exterior_front"
  | "exterior_side"
  | "exterior_back"
  | "backyard"
  | "living_room"
  | "kitchen"
  | "bedroom"
  | "bathroom"
  | "dining_room"
  | "interior_other";

/** The upload UI's own working shape — Property.photos in data.ts is
 *  deliberately looser ({url, category?: string}) since it's shared/seeded
 *  data, but the upload/edit forms want a guaranteed-valid PhotoCategory to
 *  drive category-specific slots and azimuth lookups. */
export interface CategorizedPhoto {
  url: string;
  category: PhotoCategory;
}

export interface PhotoCategoryMeta {
  id: PhotoCategory;
  label: string;
  group: "exterior" | "interior";
  /** Compass angle in degrees, used only for multi-image 3D tour generation
   *  from several angles of the same building (see
   *  src/app/api/tours/generate/route.ts). Only front/side/back get one —
   *  a backyard or bedroom photo isn't another angle of the same
   *  structure, so mixing it into multi-image generation would confuse
   *  the model rather than help it. */
  azimuth?: number;
}

export const PHOTO_CATEGORIES: PhotoCategoryMeta[] = [
  { id: "exterior_front", label: "Front of the house", group: "exterior", azimuth: 0 },
  { id: "exterior_side", label: "Side view", group: "exterior", azimuth: 90 },
  { id: "exterior_back", label: "Back of the house", group: "exterior", azimuth: 180 },
  { id: "backyard", label: "Backyard / Garden", group: "exterior" },
  { id: "living_room", label: "Living Room", group: "interior" },
  { id: "kitchen", label: "Kitchen", group: "interior" },
  { id: "bedroom", label: "Bedroom", group: "interior" },
  { id: "bathroom", label: "Bathroom", group: "interior" },
  { id: "dining_room", label: "Dining Room", group: "interior" },
  { id: "interior_other", label: "Other Room", group: "interior" },
];

const CATEGORY_META_BY_ID = new Map(PHOTO_CATEGORIES.map((c) => [c.id as string, c]));

export function isPhotoCategory(value: string): value is PhotoCategory {
  return CATEGORY_META_BY_ID.has(value);
}

/** Server-side lookup only — never trust an azimuth value sent by the
 *  client, derive it from the category id instead. */
export function getAzimuthForCategory(category: string): number | undefined {
  return CATEGORY_META_BY_ID.get(category)?.azimuth;
}

export function labelForCategory(category: PhotoCategory): string {
  return CATEGORY_META_BY_ID.get(category)?.label ?? category;
}

const COVER_PRIORITY: PhotoCategory[] = [
  "exterior_front",
  "exterior_side",
  "exterior_back",
  "living_room",
  "backyard",
  "kitchen",
  "bedroom",
  "dining_room",
  "bathroom",
  "interior_other",
];

/** Derives the flat imageUrl/galleryImages fields every existing consumer
 *  (PropertyCard, PropertyGallery, propertyOverrides, and tour
 *  generation's plain single-image fallback) reads, from the categorized
 *  photo list — so none of them need to know categories exist. imageUrl is
 *  the "best" cover shot by category priority, not just whichever was
 *  uploaded first. */
export function deriveImageFields(
  photos: CategorizedPhoto[],
  fallback: string
): { imageUrl: string; galleryImages: string[] } {
  if (photos.length === 0) return { imageUrl: fallback, galleryImages: [fallback] };

  const galleryImages = photos.map((p) => p.url);
  const cover = COVER_PRIORITY.map((cat) => photos.find((p) => p.category === cat)).find(Boolean);
  return { imageUrl: cover?.url ?? galleryImages[0], galleryImages };
}
