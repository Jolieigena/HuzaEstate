export type ApplicationStage = "new" | "screening" | "approved" | "leased" | "rejected";

export interface TenantApplication {
  id: string;
  propertyId: string;
  applicantName: string;
  incomeLabel?: string;
  creditScore?: number;
  stage: ApplicationStage;
  appliedAt: string;
  updatedAt: string;
}
