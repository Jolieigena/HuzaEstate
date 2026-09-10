import type { TenantApplication } from "./types";

// Demo starting data, tied to real curated property ids so the Manager
// Portal's "My Listings" status isn't just decorative — prop-2 shows
// "Pending" because Alex Thompson's application is genuinely `approved`
// (lease drawn up, not yet finalized) and prop-5 shows "Leased" because
// Grace Uwimana's lease has genuinely been finalized. Advancing/rejecting
// an application (see store.ts) changes the owning property's computed
// status live — see deriveListingStatus.
export const SEED_APPLICATIONS: TenantApplication[] = [
  {
    id: "app-1",
    propertyId: "prop-3",
    applicantName: "Michael Smith",
    incomeLabel: "$85k/yr",
    creditScore: 720,
    stage: "new",
    appliedAt: "2026-09-08T10:00:00.000Z",
    updatedAt: "2026-09-08T10:00:00.000Z",
  },
  {
    id: "app-2",
    propertyId: "prop-1",
    applicantName: "Sarah Johnson",
    incomeLabel: "$110k/yr",
    creditScore: 780,
    stage: "new",
    appliedAt: "2026-09-07T14:30:00.000Z",
    updatedAt: "2026-09-07T14:30:00.000Z",
  },
  {
    id: "app-3",
    propertyId: "prop-4",
    applicantName: "David & Emma",
    incomeLabel: "$140k/yr",
    stage: "screening",
    appliedAt: "2026-09-05T09:00:00.000Z",
    updatedAt: "2026-09-06T11:00:00.000Z",
  },
  {
    id: "app-4",
    propertyId: "prop-2",
    applicantName: "Alex Thompson",
    incomeLabel: "$95k/yr",
    creditScore: 810,
    stage: "approved",
    appliedAt: "2026-08-28T09:00:00.000Z",
    updatedAt: "2026-09-01T16:00:00.000Z",
  },
  {
    id: "app-5",
    propertyId: "prop-5",
    applicantName: "Grace Uwimana",
    incomeLabel: "$120k/yr",
    creditScore: 790,
    stage: "leased",
    appliedAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-15T09:00:00.000Z",
  },
];
