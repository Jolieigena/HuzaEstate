import type { LandlordProfile } from "./types";

// Keyed by account id, matching DEMO_ACCOUNTS in auth-context.tsx. Manager
// Portal currently has no per-listing ownership model — any approved seller
// can manage every listing (see ManagerDashboard.tsx's useAllProperties()) —
// so there's one landlord profile per seller account, not per property.
export const SEED_LANDLORD_PROFILES: LandlordProfile[] = [
  {
    ownerId: "seller-user",
    displayName: "Jane Doe",
    photoUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&auto=format&fit=crop",
    bio: "Managing family-owned rental properties across Kigali since 2018. I respond fast and keep units well maintained.",
    phone: "+250 788 555 210",
    responseTimeLabel: "Usually responds within an hour",
    yearsHosting: 6,
    verified: true,
    rating: 4.8,
    reviewCount: 37,
  },
];

export const DEFAULT_LANDLORD_PROFILE: LandlordProfile = SEED_LANDLORD_PROFILES[0];
