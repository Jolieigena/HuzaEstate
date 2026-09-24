import type { Property } from './types';

/** Every distinct visual asset for a property — the cover shot (imageUrl) plus its
 *  gallery photos, deduplicated. Properties posted through the real form pick their
 *  cover FROM the uploaded photo set (see deriveImageFields in photoCategories.ts), so
 *  imageUrl is already one of galleryImages' entries; naively prepending it double-counts
 *  the cover. A listing with no photos array uses its own imageUrl as the only image.
 *  Deduping here handles both and gives every consumer (card badge, gallery, lightbox)
 *  the same number. */
export function getGalleryImages(property: Property): string[] {
  const rest = property.galleryImages ?? property.photos?.map((p) => p.url) ?? [];
  return Array.from(new Set([property.imageUrl, ...rest]));
}
