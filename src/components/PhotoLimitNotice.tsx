// Buyers see at most 2 photos of a listing that is not promoted, whatever plan the seller is on. Kept in sync with
// property-service's PUBLIC_PHOTO_LIMIT and with PromoteListingModal.
export const PUBLIC_PHOTO_LIMIT = 2;

/** Switched off: buyers see every photo and the video. Set to true, together with LIMIT_UNPROMOTED_MEDIA in property-service's
 *  properties/service.ts, to bring the limit back. */
export const PHOTO_LIMIT_ENABLED = false;

/** Shown when a seller has added more photos than buyers will see until the listing is promoted. */
export default function PhotoLimitNotice({ photoCount }: { photoCount: number }) {
  if (!PHOTO_LIMIT_ENABLED || photoCount <= PUBLIC_PHOTO_LIMIT) return null;
  return (
    <p role="status" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
      Buyers will only see the first {PUBLIC_PHOTO_LIMIT} photos unless you promote this listing.
    </p>
  );
}
