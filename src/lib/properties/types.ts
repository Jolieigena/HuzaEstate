/** Only "published" listings appear in public search. "draft" is the owner's own unsubmitted
 *  scratch space (never moderator-visible); "under_review" is a submitted listing awaiting a
 *  moderator decision, or briefly on its way to "published" automatically when auto-publish is
 *  on for its country (see lib/promotion and the admin Settings page). */
export type PropertyStatus = "draft" | "under_review" | "published" | "unpublished" | "archived" | "changes_requested" | "rejected";

export interface Property {
  id: string;
  /** Set server-side from the poster's JWT at creation. */
  ownerId?: string;
  ownerName?: string;
  /** Denormalized from the poster's account at listing time (see access-service's
   *  become-a-seller signup) — whether they're the actual property owner or a listing agent.
   *  Absent for listings posted before this field existed, or by a seller who never said;
   *  every UI reading this should treat a missing value as "owner". */
  ownerType?: "owner" | "agent";
  /** Only ever set when ownerType is "agent" — the brokerage/company this listing was posted
   *  under, denormalized at post time (see access-service's User.companyName/companyLogoUrl). */
  companyName?: string;
  companyLogoUrl?: string;
  /** Direct contact methods, denormalized from the poster's account at listing time — shown on
   *  the property detail page alongside the inquiry form. Absent on listings posted before these
   *  existed, or by a seller who never set a phone number. */
  ownerPhone?: string;
  ownerEmail?: string;
  title: string;
  description: string;
  // Required on every real listing. A "draft" status listing (see PropertyStatus) can actually
  // be missing any of these at the API level — the backend only enforces title while a listing
  // stays a draft, everything else becomes required again at submit time (POST
  // /properties/:id/submit) — but every component in this codebase that renders a Property only
  // ever receives a non-draft one (public queries always filter to published; the one place that
  // *does* render a seller's own draft, ListingCard.tsx, treats it as a special case rather than
  // trusting these fields — see its own isDraft branch). Kept required here rather than widened
  // to optional everywhere, to avoid forcing a null-check on every other already-correct caller.
  price: number;
  currency: string;
  location: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  imageUrl: string;
  galleryImages?: string[];
  photos?: { url: string; category?: string }[];
  type: "sale" | "rent";
  propertyType: "house" | "apartment" | "land";
  /** The exact type the seller picked (one of PROPERTY_TYPE_OPTIONS' labels, e.g. "Villa"). Listings
   *  posted before this existed only have the bucket above. */
  propertyLabel?: string;
  virtualTourUrl?: string;
  videoUrl?: string;
  lat?: number;
  lng?: number;
  /** Country name (see src/lib/countries.ts's COUNTRY_OPTIONS) — optional
   *  because every listing before multi-country support predates this
   *  field; getPropertyCountry() defaults an absent value to Rwanda. */
  country?: string;
  /** District/administrative-division name within `country` (see src/lib/regions.ts) — optional,
   *  only populated for countries with district reference data (Rwanda at launch). Used for
   *  org-admin staff scope enforcement; absent on listings predating this field. */
  district?: string;
  /** Free-form tags, typically ticked from AMENITY_OPTIONS below but not
   *  restricted to it (see the Amenities filter's own free-text field) —
   *  optional because every listing before this field predates it. */
  amenities?: string[];
  /** Set at posting time from the poster's plan tier (see payment-service's PLAN_EXPIRY_DAYS) —
   *  optional because listings from before this field existed have none. Public browse/search
   *  and GET-by-id already exclude anything past this on the backend; `expired` is a
   *  pre-computed convenience the backend derives from it so the frontend never needs its own
   *  clock-skew-prone "is it past expiresAt" check. */
  expiresAt?: string;
  expired?: boolean;
  status?: PropertyStatus;
  /** Why an administrator took the listing down or asked for changes. */
  statusReason?: string;
  /** When the listing was created, set server-side — optional because a
   *  listing fetched from a backend that predates this field (or any local
   *  override layered on top) may not carry it. */
  createdAt?: string;
  /** Set when a seller pays to promote this listing (see lib/promotion) —
   *  the listing is pinned to the front of /properties and shows a
   *  "Promoted" badge until this date, then quietly falls back to normal
   *  placement. Absent for every listing that's never been promoted. */
  promotedUntil?: string;
  /** How many inquiries this listing has ever received, set server-side (property-service
   *  counts its own Inquiry records) — real activity, not a fabricated number. Optional because
   *  it's absent from any locally-constructed Property object that never went through the API. */
  inquiryCount?: number;
}

// Shared between the /properties Amenities filter, the post-property form,
// and EditPropertyModal, so every place a seller can set an amenity and a
// buyer can filter by one offers exactly the same list.
export const AMENITY_OPTIONS = [
  'Pool', 'Garden', 'Furnished', 'Parking', 'Gym', 'Security',
  'Balcony', 'Air Conditioning', 'Elevator', 'Pet Friendly',
  'Solar Power', 'Generator', 'CCTV', 'WiFi',
];

// Shared between the /properties Type filter, the post-property form, and
// EditPropertyModal, so a seller can pick the exact same real-world label a
// buyer would search for. The underlying data model only has 3 real
// buckets (house/apartment/land, see Property['propertyType']) — every
// other label here is a synonym that resolves down to one of them, same
// synonyms /properties' old free-text Type field used to resolve from
// typed text before it became a checklist.
// The same labels grouped for pickers that want them sorted (organisation category limits).
export const PROPERTY_LABEL_GROUPS: { label: string; options: string[] }[] = [
  { label: 'Houses', options: ['House', 'Villa', 'Townhouse', 'Duplex', 'Bungalow', 'Cottage', 'Mansion'] },
  { label: 'Apartments', options: ['Apartment', 'Condo', 'Studio'] },
  { label: 'Land', options: ['Land'] },
  { label: 'Commercial', options: ['Commercial'] },
];

export const PROPERTY_TYPE_OPTIONS: { label: string; bucket: Property["propertyType"] }[] = [
  { label: 'House', bucket: 'house' },
  { label: 'Apartment', bucket: 'apartment' },
  { label: 'Land', bucket: 'land' },
  { label: 'Villa', bucket: 'house' },
  { label: 'Condo', bucket: 'apartment' },
  { label: 'Townhouse', bucket: 'house' },
  { label: 'Studio', bucket: 'apartment' },
  { label: 'Duplex', bucket: 'house' },
  { label: 'Bungalow', bucket: 'house' },
  { label: 'Cottage', bucket: 'house' },
  { label: 'Mansion', bucket: 'house' },
  { label: 'Commercial', bucket: 'house' },
];
