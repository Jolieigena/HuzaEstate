import type { AiFeatureFlags } from "./types";

export const ADMIN_STORAGE_KEY = "huzaestate_admin_ops_v1";

export const DEFAULT_AI_FEATURE_FLAGS: AiFeatureFlags = {
  aiEnabled: true,
  buildGenerationEnabled: true,
  renovateGenerationEnabled: true,
  targetedEditingEnabled: true,
  maxGenerationCount: 6,
  maxUploadCount: 12,
  maxUploadSizeMb: 15,
  dailyLimit: 20,
  maintenanceMessage: "AI concept generation is temporarily unavailable while we perform maintenance. Please try again shortly.",
  safetyDisclaimer: "AI-generated concepts are indicative only and require professional review before construction.",
  conceptWatermark: true,
  mockServiceIndicator: "Mock generation service (prototype)",
};

/**
 * Dependency-free reader used by Build/Renovate's generation triggers to
 * check whether AI generation is currently allowed. Reads the admin store's
 * raw localStorage blob directly (no React, no service imports) so it can be
 * called from those modules without a circular dependency on
 * `src/lib/admin/service.ts`, which itself imports the Build/Renovate
 * services to keep project oversight in sync.
 */
export function readAiFeatureFlags(): AiFeatureFlags {
  try {
    const raw = window.localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return DEFAULT_AI_FEATURE_FLAGS;
    const parsed = JSON.parse(raw) as { aiFeatureFlags?: Partial<AiFeatureFlags> };
    return { ...DEFAULT_AI_FEATURE_FLAGS, ...parsed.aiFeatureFlags };
  } catch {
    return DEFAULT_AI_FEATURE_FLAGS;
  }
}

export function checkGenerationAllowed(module: "build" | "renovate"): { allowed: boolean; message: string } {
  const flags = readAiFeatureFlags();
  if (!flags.aiEnabled) return { allowed: false, message: flags.maintenanceMessage };
  if (module === "build" && !flags.buildGenerationEnabled) return { allowed: false, message: flags.maintenanceMessage };
  if (module === "renovate" && !flags.renovateGenerationEnabled) return { allowed: false, message: flags.maintenanceMessage };
  return { allowed: true, message: "" };
}
