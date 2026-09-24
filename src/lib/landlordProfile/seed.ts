import type { LandlordProfile } from "./types";

// Manager Portal has no per-listing ownership model today (any approved
// seller manages every listing, see ManagerDashboard.tsx's useAllProperties()),
// and Property has no owner-contact-info concept beyond ownerId — so there is
// no real per-seller "landlord profile" backend yet. This generic default is
// shown until that exists; it deliberately carries no fabricated identity.
export const SEED_LANDLORD_PROFILES: LandlordProfile[] = [];

export const DEFAULT_LANDLORD_PROFILE: LandlordProfile = {
  ownerId: "",
  displayName: "HuzaEstate Host",
  photoUrl: "",
  bio: "This host has not added a bio yet.",
  phone: "",
  responseTimeLabel: "Response time not available yet",
  yearsHosting: 0,
  verified: false,
  rating: 0,
  reviewCount: 0,
};
