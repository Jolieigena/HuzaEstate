import { DEFAULT_AI_FEATURE_FLAGS } from "./featureFlags";
import type { AdminState, PlatformSettings } from "./types";

const DEFAULT_SETTINGS: PlatformSettings = {
  general: { platformName: "HuzaEstate", supportContact: "support@huzaestate.com", defaultCountry: "Rwanda", defaultCurrency: "RWF", defaultTimezone: "Africa/Kigali", maintenanceNotice: "" },
  listings: { allowedPropertyTypes: ["house", "apartment", "land"], imageLimit: 12, reviewRequired: true, listingExpiryDays: 90, reportThreshold: 3 },
  build: { availableStyles: ["Modern", "Contemporary", "Traditional Rwandan", "Minimalist", "Colonial"], generationLimit: 6, conceptDisclaimer: "AI-generated concepts are indicative only and require professional review before construction.", professionalReviewReminderDays: 3 },
  renovate: { categories: ["Kitchen", "Bathroom", "Living areas", "Roofing", "Flooring", "Painting", "Landscaping", "Electrical", "Plumbing"], uploadLimit: 12, generationLimit: 6, safetyDisclaimer: "Renovation concepts are indicative only. A safety or structural concern requires an on-site professional inspection.", quotationPrerequisite: "A shared scope and at least one accepted professional review" },
  professionals: { requiredDocuments: ["Identity document", "Professional certificate", "Business registration document", "Insurance document"], credentialExpiryWarningDays: 30, maximumActiveRequests: 8 },
  quotations: { defaultValidityDays: 30, allowedCurrencies: ["RWF", "USD"], requiredInclusionFields: ["Included work", "Customer-provided materials"], requiredExclusionFields: ["Excluded work", "Assumptions"] },
  files: { supportedTypes: ["pdf", "jpg", "jpeg", "png", "webp"], maxFileSizeMb: 15, retentionLabel: "Prototype files are retained for the local session only." },
  notifications: { reminderTimingHours: 24, escalationTimingHours: 48 },
  privacy: { retentionLabel: "Prototype data is stored locally in the browser and is not retained on a server.", accessReasons: ["customer_support", "active_dispute", "safety_investigation", "abuse_investigation", "legal_regulatory", "technical_recovery"], exportRule: "Exports are limited to the permissions of the requesting administrator." },
  demoMode: false,
  featureFlags: { build: true, renovate: true, professional_applications: true, professional_reviews: true, quotations: true, ai_agent: true, ai_image_generation: true, targeted_image_editing: true, public_demo_videos: true, new_registrations: true },
};

/** Base, empty admin store shape. Used only when no persisted state exists yet. */
export function buildInitialAdminState(): AdminState {
  return {
    version: 1,
    seeded: true,
    roleAssignments: [],
    users: {},
    listingModeration: {},
    verificationHistory: [],
    applicationAssignments: {},
    projectFlags: {},
    privilegedAccessLog: [],
    supportCases: [],
    disputes: [],
    aiGenerations: [],
    aiFeatureFlags: DEFAULT_AI_FEATURE_FLAGS,
    contentItems: [],
    auditLog: [],
    settings: DEFAULT_SETTINGS,
    notifications: [],
  };
}

/** No-op — real data now comes from access-service/property-service, not local
 *  fixtures. Kept as a pass-through so callers that still invoke it don't need
 *  to change. */
export function seedSharedRecords(state: AdminState): AdminState {
  return { ...state, seeded: true };
}
