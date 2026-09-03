import { ADMIN_DEMO_ACCOUNTS, DEMO_ACCOUNTS } from "@/lib/auth-context";
import { mockProperties } from "@/lib/data";
import { ProfessionalService } from "@/lib/professional/service";
import type { ProfessionalServiceOffering } from "@/lib/professional/types";
import { DEFAULT_AI_FEATURE_FLAGS } from "./featureFlags";
import type { AccountDirectoryType, AccountStatus, AdminRole, AdminRoleAssignment, AdminState, AdminUserRecord, AiGenerationRecord, AuditLogEntry, ContentItem, Dispute, ListingModerationRecord, PlatformSettings, SupportCase, VerificationHistoryEntry } from "./types";

const isoNow = () => new Date().toISOString();
const isoDaysAgo = (days: number) => { const date = new Date(); date.setDate(date.getDate() - days); return date.toISOString(); };
const isoInDays = (days: number) => { const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString(); };
const id = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const FIRST_NAMES = ["Jean", "Marie", "Eric", "Alice", "Patrick", "Claudine", "Emmanuel", "Solange", "Vincent", "Yvonne", "Olivier", "Chantal", "Fabrice", "Josiane", "Innocent", "Immaculee", "Theo", "Beatrice", "Christian", "Delphine", "Robert", "Francoise", "Samuel", "Consolee", "David", "Grace", "Kevin", "Sandrine"];
const LAST_NAMES = ["Uwimana", "Mugisha", "Niyonsenga", "Ingabire", "Habimana", "Mukamana", "Ndayisenga", "Uwase", "Bizimana", "Iradukunda", "Nkurunziza", "Mutoni", "Rugamba", "Nsengimana", "Umutoni", "Twagirayezu", "Ishimwe", "Kagabo", "Gatete", "Nyiraneza"];

/**
 * Seeded prototype directory rows so User Management filters (account type
 * x status) have realistic volume beyond the handful of real demo logins.
 * Deterministic (index-based, not Math.random) so the seed is stable.
 */
function buildSyntheticUsers(): AdminUserRecord[] {
  const specs: { type: AccountDirectoryType; count: number }[] = [
    { type: "customer", count: 22 },
    { type: "seller_manager", count: 8 },
    { type: "professional", count: 6 },
    { type: "contractor", count: 4 },
  ];
  const users: AdminUserRecord[] = [];
  let n = 0;
  for (const spec of specs) {
    for (let i = 0; i < spec.count; i++) {
      n += 1;
      const first = FIRST_NAMES[n % FIRST_NAMES.length];
      const last = LAST_NAMES[(n * 7) % LAST_NAMES.length];
      const daysAgo = 5 + ((n * 37) % 480);
      const status: AccountStatus = n % 17 === 0 ? "suspended" : n % 13 === 0 ? "restricted" : n % 9 === 0 ? "pending" : n % 29 === 0 ? "closed" : "active";
      users.push({
        accountId: `synthetic_${spec.type}_${n}`,
        name: `${first} ${last}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}${n}@example-huza.rw`,
        phone: `+2507${String(80000000 + ((n * 7919) % 19999999)).slice(0, 8)}`,
        accountType: spec.type,
        status,
        verification: spec.type === "professional" || spec.type === "contractor" ? (n % 2 === 0 ? "demo_verified" : "pending") : "unverified",
        registeredAt: isoDaysAgo(daysAgo),
        lastActivityAt: isoDaysAgo(Math.max(0, daysAgo - (n % 20))),
        synthetic: true,
        restrictions: [],
        notes: [],
        statusHistory: [],
      });
    }
  }
  return users;
}

function buildRealAccountUsers(): AdminUserRecord[] {
  const real = [...DEMO_ACCOUNTS, ...ADMIN_DEMO_ACCOUNTS];
  return real.map((account, idx) => {
    const accountType: AccountDirectoryType = account.roles.includes("administrator") ? "administrator" : account.roles.includes("contractor") ? "contractor" : account.roles.includes("professional") ? "professional" : account.isApprovedSeller ? "seller_manager" : "customer";
    return {
      accountId: account.id,
      name: account.name,
      email: account.email,
      accountType,
      status: "active",
      verification: accountType === "professional" || accountType === "contractor" ? "demo_verified" : "unverified",
      registeredAt: isoDaysAgo(240 - idx * 6),
      lastActivityAt: isoDaysAgo(idx % 6),
      synthetic: false,
      restrictions: [],
      notes: [],
      statusHistory: [],
    };
  });
}

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
  demoMode: true,
  featureFlags: { build: true, renovate: true, professional_applications: true, professional_reviews: true, quotations: true, ai_agent: true, ai_image_generation: true, targeted_image_editing: true, public_demo_videos: true, new_registrations: true },
};

/** Base, empty admin store shape. Used only when no persisted state exists yet. */
export function buildInitialAdminState(): AdminState {
  const roleAssignments: AdminRoleAssignment[] = ADMIN_DEMO_ACCOUNTS.filter((account) => account.adminRole).map((account) => ({
    accountId: account.id,
    role: account.adminRole as AdminRole,
    assignedAt: isoNow(),
    assignedBy: "system",
    reason: "Seeded demo staff account.",
  }));

  return {
    version: 1,
    seeded: false,
    roleAssignments,
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

function svc(id: string, name: string, description: string): ProfessionalServiceOffering {
  return { id, name, description, deliveryTime: "3–5 business days", deliveryMode: "both", priceAfterAssessment: true, requiredInformation: "Project brief and shared documents" };
}

/**
 * Seeds a handful of professional applications in varied non-approved
 * statuses through `ProfessionalService`'s real, already-public application
 * API (`saveApplication` / `submitApplication` / `updateProfile`) rather
 * than a parallel admin-only mock — so the verification queue operates on
 * the SAME `ProfessionalProfile` records the professional workspace reads,
 * and approving one here genuinely unlocks that workspace. One applicant
 * (`moses-user`) has a real demo login so the approve journey can be
 * verified end-to-end; the others are directory-only.
 */
function seedProfessionalApplications(): { users: AdminUserRecord[]; history: VerificationHistoryEntry[] } {
  const history: VerificationHistoryEntry[] = [];
  const users: AdminUserRecord[] = [];

  if (!ProfessionalService.getProfileForAccount("moses-user")) {
    ProfessionalService.saveApplication("moses-user", {
      kind: "individual_professional", displayName: "Moses Karenzi", legalName: "Moses Karenzi",
      email: "electrical@huzaestate.com", phone: "+250 788 100 106", country: "Rwanda", city: "Kigali", address: "Nyarugenge, Kigali",
      biography: "Electrical engineer focused on residential and light-commercial installations.",
      yearsExperience: 6, languages: ["Kinyarwanda", "English"], primarySpecialisation: "Electrical Engineer", secondarySpecialisations: [],
      registrationNumber: "DEMO-EE-2201", licensingBody: "Prototype registration record",
      services: [svc("svc-elec-review", "Electrical review", "Review circuit layout, load assumptions and safety clearances.")],
      serviceAreas: ["Kigali"], travelRadiusKm: 40, remoteAvailable: true, onsiteAvailable: true, travelFeeApproach: "Distance based",
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], workingHours: "08:00–17:00", consultationDuration: 45,
      minimumNoticeHours: 24, acceptingNewWork: true, maximumActiveRequests: 5, responseTime: "Within 2 business days",
      pricingApproaches: ["Quotation after assessment"], availability: "available",
    });
    ProfessionalService.submitApplication("moses-user");
    const profile = ProfessionalService.getProfileForAccount("moses-user");
    if (profile) history.push({ id: id("verification"), profileId: profile.id, action: "submitted", actorAccountId: "moses-user", actorName: "Moses Karenzi", detail: "Application submitted for review.", at: isoDaysAgo(2) });
  }

  if (!ProfessionalService.getProfileForAccount("app-accessibility-1")) {
    ProfessionalService.saveApplication("app-accessibility-1", {
      kind: "individual_professional", displayName: "Consolee Nyirahabimana", legalName: "Consolee Nyirahabimana",
      email: "consolee.accessibility@example-huza.rw", phone: "+250 788 100 107", country: "Rwanda", city: "Kigali", address: "Kicukiro, Kigali",
      biography: "Accessibility specialist advising on universal design for residential renovations.",
      yearsExperience: 5, languages: ["Kinyarwanda", "English"], primarySpecialisation: "Accessibility Specialist", secondarySpecialisations: [],
      registrationNumber: "DEMO-AS-3301", licensingBody: "Prototype registration record",
      services: [svc("svc-access-review", "Accessibility review", "Review circulation, thresholds and universal-design compliance gaps.")],
      serviceAreas: ["Kigali"], travelRadiusKm: 30, remoteAvailable: true, onsiteAvailable: true, travelFeeApproach: "Included within Kigali",
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], workingHours: "09:00–17:00", consultationDuration: 45,
      minimumNoticeHours: 24, acceptingNewWork: true, maximumActiveRequests: 4, responseTime: "Within 2 business days",
      pricingApproaches: ["Fixed review fee"], availability: "available",
    });
    ProfessionalService.submitApplication("app-accessibility-1");
    ProfessionalService.updateProfile(ProfessionalService.getProfileForAccount("app-accessibility-1")?.id ?? "", { status: "under_review" });
    const profile = ProfessionalService.getProfileForAccount("app-accessibility-1");
    if (profile) {
      history.push({ id: id("verification"), profileId: profile.id, action: "submitted", actorAccountId: "app-accessibility-1", actorName: "Consolee Nyirahabimana", detail: "Application submitted for review.", at: isoDaysAgo(6) });
      history.push({ id: id("verification"), profileId: profile.id, action: "assigned", actorAccountId: "admin-verify", actorName: "Patrick Ndayisenga", detail: "Assigned for review.", at: isoDaysAgo(4) });
    }
    users.push({ accountId: "app-accessibility-1", name: "Consolee Nyirahabimana", email: "consolee.accessibility@example-huza.rw", accountType: "professional", status: "pending", verification: "pending", registeredAt: isoDaysAgo(6), lastActivityAt: isoDaysAgo(4), synthetic: true, restrictions: [], notes: [], statusHistory: [] });
  }

  if (!ProfessionalService.getProfileForAccount("app-sustainability-1")) {
    ProfessionalService.saveApplication("app-sustainability-1", {
      kind: "individual_professional", displayName: "Theo Bizumuremyi", legalName: "Theo Bizumuremyi",
      email: "theo.sustainability@example-huza.rw", phone: "+250 788 100 108", country: "Rwanda", city: "Kigali", address: "Gasabo, Kigali",
      biography: "Sustainability specialist advising on passive cooling, water and energy efficiency.",
      yearsExperience: 4, languages: ["Kinyarwanda", "English", "French"], primarySpecialisation: "Sustainability Specialist", secondarySpecialisations: [],
      registrationNumber: "", licensingBody: "",
      services: [svc("svc-sustain-review", "Sustainability review", "Review passive design, water and energy assumptions.")],
      serviceAreas: ["Kigali"], travelRadiusKm: 25, remoteAvailable: true, onsiteAvailable: false, travelFeeApproach: "Not applicable — remote only",
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday"], workingHours: "10:00–16:00", consultationDuration: 30,
      minimumNoticeHours: 48, acceptingNewWork: true, maximumActiveRequests: 3, responseTime: "Within 3 business days",
      pricingApproaches: ["Quotation after assessment"], availability: "limited",
    });
    ProfessionalService.submitApplication("app-sustainability-1");
    ProfessionalService.updateProfile(ProfessionalService.getProfileForAccount("app-sustainability-1")?.id ?? "", { status: "more_information_required" });
    const profile = ProfessionalService.getProfileForAccount("app-sustainability-1");
    if (profile) {
      history.push({ id: id("verification"), profileId: profile.id, action: "submitted", actorAccountId: "app-sustainability-1", actorName: "Theo Bizumuremyi", detail: "Application submitted for review.", at: isoDaysAgo(9) });
      history.push({ id: id("verification"), profileId: profile.id, action: "info_requested", actorAccountId: "admin-verify", actorName: "Patrick Ndayisenga", detail: "Registration number and licensing body are missing. Please provide a registration number or confirm none applies, and upload a professional certificate.", at: isoDaysAgo(7) });
    }
    users.push({ accountId: "app-sustainability-1", name: "Theo Bizumuremyi", email: "theo.sustainability@example-huza.rw", accountType: "professional", status: "pending", verification: "pending", registeredAt: isoDaysAgo(9), lastActivityAt: isoDaysAgo(7), synthetic: true, restrictions: [], notes: [], statusHistory: [] });
  }

  // One approved demo credential set to expire soon, so the credential-monitoring view has a real row.
  const structural = ProfessionalService.getProfile("pro-structural");
  if (structural && !structural.licenceExpiry) {
    ProfessionalService.updateProfile("pro-structural", { licenceExpiry: isoInDays(21) });
  }

  return { users, history };
}

/**
 * Seeds the listing-moderation overlay: 3 of the 80 existing properties
 * "awaiting moderation" + 1 "reported", matching the admin spec's seed
 * requirement exactly. All other properties are left with no override,
 * which `isListingVisible()` treats as published/live — unchanged from
 * today's behavior for the other 76+.
 */
function seedListingModeration(): Record<string, ListingModerationRecord> {
  const picks = [mockProperties[4], mockProperties[17], mockProperties[32], mockProperties[41]].filter(Boolean);
  const records: Record<string, ListingModerationRecord> = {};
  picks.forEach((property, index) => {
    const isReported = index === picks.length - 1;
    records[property.id] = {
      propertyId: property.id,
      status: isReported ? "reported" : "awaiting_moderation",
      reason: isReported ? "Reported by a platform user for suspected inaccurate pricing." : "New submission awaiting first review.",
      reportCount: isReported ? 2 : 0,
      updatedAt: isoDaysAgo(index + 1),
      history: [{ status: isReported ? "reported" : "awaiting_moderation", at: isoDaysAgo(index + 1), actorAccountId: "system" }],
    };
  });
  return records;
}

/** Three support cases at different priorities + one quotation dispute, matching the admin spec's seed requirement. */
function seedSupportAndDisputes(): { supportCases: SupportCase[]; disputes: Dispute[] } {
  const supportCases: SupportCase[] = [
    {
      id: id("support"), reference: "SUP-1001", requesterAccountId: "demo-user", requesterName: "Jane Doe",
      category: "renovation_project", priority: "high", status: "assigned",
      subject: "Uploaded photos not appearing in assessment", description: "I uploaded 6 site photos for the kitchen renovation but only 2 are showing in the assessment step.",
      assignedTo: "admin-ops", createdAt: isoDaysAgo(3), updatedAt: isoDaysAgo(1),
      messages: [{ id: id("support_msg"), caseId: "", authorAccountId: "demo-user", authorName: "Jane Doe", visibility: "customer", text: "I uploaded 6 site photos for the kitchen renovation but only 2 are showing in the assessment step.", createdAt: isoDaysAgo(3) }],
      statusHistory: [{ status: "new", at: isoDaysAgo(3), actorAccountId: "demo-user" }, { status: "assigned", at: isoDaysAgo(1), actorAccountId: "admin-ops" }],
    },
    {
      id: id("support"), reference: "SUP-1002", requesterAccountId: "seller-user", requesterName: "Jane Doe",
      category: "property_listing", priority: "urgent", status: "new",
      subject: "Listing shows wrong price after edit", description: "I updated the price on my Kimihurura listing but the public page still shows the old amount.",
      createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1),
      messages: [{ id: id("support_msg"), caseId: "", authorAccountId: "seller-user", authorName: "Jane Doe", visibility: "customer", text: "I updated the price on my Kimihurura listing but the public page still shows the old amount.", createdAt: isoDaysAgo(1) }],
      statusHistory: [{ status: "new", at: isoDaysAgo(1), actorAccountId: "seller-user" }],
    },
    {
      id: id("support"), reference: "SUP-1003", requesterAccountId: "aline-user", requesterName: "Aline Uwase",
      category: "professional_review", priority: "normal", status: "waiting_customer",
      subject: "Customer has not responded to clarification in 5 days", description: "I requested clarification on the family-home brief and have not heard back.",
      assignedTo: "admin-support", createdAt: isoDaysAgo(6), updatedAt: isoDaysAgo(2),
      messages: [
        { id: id("support_msg"), caseId: "", authorAccountId: "aline-user", authorName: "Aline Uwase", visibility: "customer", text: "I requested clarification on the family-home brief and have not heard back.", createdAt: isoDaysAgo(6) },
        { id: id("support_msg"), caseId: "", authorAccountId: "admin-support", authorName: "Eric Bizimana", visibility: "internal", text: "Following up with the customer directly.", createdAt: isoDaysAgo(2) },
      ],
      statusHistory: [{ status: "new", at: isoDaysAgo(6), actorAccountId: "aline-user" }, { status: "assigned", at: isoDaysAgo(5), actorAccountId: "admin-support" }, { status: "waiting_customer", at: isoDaysAgo(2), actorAccountId: "admin-support" }],
    },
  ];

  const disputes: Dispute[] = [
    {
      id: id("dispute"), reference: "DIS-2001", complainantAccountId: "demo-user", complainantName: "Jane Doe",
      respondentAccountId: "imara-user", respondentName: "Imara Construction Ltd",
      category: "contractor_quotation", status: "under_review",
      description: "The submitted quotation total is significantly higher than the indicative AI estimate with no itemised explanation for the difference.",
      desiredResolution: "A revised, itemised quotation or a clear explanation of the cost difference.",
      urgency: "normal", safetyConcern: false,
      evidence: [{ id: id("evidence"), label: "Original quotation PDF", submittedByAccountId: "demo-user", submittedByName: "Jane Doe", submittedAt: isoDaysAgo(4) }],
      internalNotes: [], respondentResponse: undefined, proposedResolution: undefined, finalOutcome: undefined,
      createdAt: isoDaysAgo(4), updatedAt: isoDaysAgo(2),
      statusHistory: [{ status: "submitted", at: isoDaysAgo(4), actorAccountId: "demo-user" }, { status: "screening", at: isoDaysAgo(3), actorAccountId: "admin-support" }, { status: "under_review", at: isoDaysAgo(2), actorAccountId: "admin-support" }],
    },
  ];

  return { supportCases, disputes };
}

/** One flagged/failed AI generation + a handful of successful ones, and a small starter content library — matching the admin spec's seed requirements. */
function seedAiAndContent(): { aiGenerations: AiGenerationRecord[]; contentItems: ContentItem[] } {
  const aiGenerations: AiGenerationRecord[] = [
    { id: id("ai_gen"), accountId: "demo-user", projectId: "unknown", module: "renovate", generationType: "concept_generation", status: "failed", createdAt: isoDaysAgo(2), durationMs: 42000, modelIndicator: "Mock generation service (prototype)", errorCategory: "generation_timeout", safetyFlag: false, usageUnits: 1, resolved: false, promptSummary: "Renovate concept generation for a kitchen and living-area refresh." },
    { id: id("ai_gen"), accountId: "demo-user", projectId: "unknown", module: "build", generationType: "concept_generation", status: "succeeded", createdAt: isoDaysAgo(5), durationMs: 18500, modelIndicator: "Mock generation service (prototype)", safetyFlag: false, usageUnits: 1, promptSummary: "Family home concept generation from confirmed brief." },
    { id: id("ai_gen"), accountId: "demo-user", projectId: "unknown", module: "renovate", generationType: "targeted_edit", status: "succeeded", createdAt: isoDaysAgo(6), durationMs: 9800, modelIndicator: "Mock generation service (prototype)", safetyFlag: false, usageUnits: 1, promptSummary: "Targeted edit: replace flooring in the living area concept." },
  ];

  const now = isoNow();
  const contentItems: ContentItem[] = [
    { id: id("content"), area: "build_faq", title: "How long does AI concept generation take?", slug: "build-faq-generation-time", content: "Generation typically completes within a few minutes. If it takes longer, you can cancel and try again.", status: "published", order: 1, updatedAt: isoDaysAgo(30), updatedBy: "Divine Ingabire", versions: [{ version: 1, content: "Generation typically completes within a few minutes. If it takes longer, you can cancel and try again.", savedAt: isoDaysAgo(30), savedBy: "Divine Ingabire" }] },
    { id: id("content"), area: "renovate_faq", title: "Do I need to move out during renovation planning?", slug: "renovate-faq-occupancy", content: "No — the planning and concept stage does not require you to vacate the property.", status: "published", order: 1, updatedAt: isoDaysAgo(28), updatedBy: "Divine Ingabire", versions: [{ version: 1, content: "No — the planning and concept stage does not require you to vacate the property.", savedAt: isoDaysAgo(28), savedBy: "Divine Ingabire" }] },
    { id: id("content"), area: "announcement", title: "Professionals workspace now live", slug: "announcement-professionals-live", content: "HuzaEstate now supports professional reviews and contractor quotations for Build and Renovate projects.", status: "scheduled", order: 1, publishAt: isoInDays(3), updatedAt: now, updatedBy: "Divine Ingabire", versions: [{ version: 1, content: "HuzaEstate now supports professional reviews and contractor quotations for Build and Renovate projects.", savedAt: now, savedBy: "Divine Ingabire" }] },
  ];

  return { aiGenerations, contentItems };
}

/** Representative audit events so `/admin/audit` and the dashboard's platform-activity panel aren't empty before any live staff action has happened. */
function seedAuditLog(): AuditLogEntry[] {
  const entries: [string, string, string, string, string, string, number][] = [
    // [actorAccountId, actorName, actorRole, action, resourceType, resourceId/summary, daysAgo]
    ["admin-super", "Sam Nkurunziza", "super_admin", "role_assigned", "administrative_role", "admin-ops", 14],
    ["admin-verify", "Patrick Ndayisenga", "verification_officer", "professional_approved", "professional_application", "pro-1", 12],
    ["admin-listing", "Claudine Iradukunda", "listing_moderator", "listing_status_changed", "property_listing", "prop-6", 9],
    ["admin-support", "Eric Bizimana", "support_dispute_officer", "support_case_created", "support_case", "SUP-1001", 3],
    ["admin-content", "Divine Ingabire", "content_manager", "content_created", "content_item", "build-faq-generation-time", 30],
    ["admin-ops", "Grace Mutoni", "operations_admin", "support_case_assigned", "support_case", "SUP-1001", 1],
  ];
  return entries.map(([actorAccountId, actorName, actorRole, action, resourceType, resourceId, daysAgo]) => ({
    id: id("audit"), at: isoDaysAgo(daysAgo), actorAccountId, actorName, actorRole: actorRole as AdminRole, action, resourceType, resourceId, result: "success" as const,
  }));
}

/**
 * Populates prototype directory/queue records the first time the store
 * loads (gated by `state.seeded`, mirroring `ProfessionalService`'s
 * `seedSharedCustomerRecords`). Extended by later batches with listing
 * moderation records, support cases, disputes, AI records and content
 * items so every admin list page has realistic prototype data from a
 * single seeding pass.
 */
export function seedSharedRecords(state: AdminState): AdminState {
  if (state.seeded) return state;

  const users: Record<string, AdminUserRecord> = { ...state.users };
  for (const user of [...buildRealAccountUsers(), ...buildSyntheticUsers()]) {
    if (!users[user.accountId]) users[user.accountId] = user;
  }

  const applications = seedProfessionalApplications();
  for (const user of applications.users) {
    if (!users[user.accountId]) users[user.accountId] = user;
  }

  const listingModeration = { ...seedListingModeration(), ...state.listingModeration };
  const { supportCases, disputes } = seedSupportAndDisputes();
  const { aiGenerations, contentItems } = seedAiAndContent();

  return {
    ...state,
    users,
    listingModeration,
    verificationHistory: [...state.verificationHistory, ...applications.history],
    supportCases: [...state.supportCases, ...supportCases],
    disputes: [...state.disputes, ...disputes],
    aiGenerations: [...state.aiGenerations, ...aiGenerations],
    contentItems: [...state.contentItems, ...contentItems],
    auditLog: [...state.auditLog, ...seedAuditLog()],
    seeded: true,
  };
}
