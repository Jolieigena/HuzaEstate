import type { ProfessionalProfile } from "./types";

// Professional accounts are created directly by an administrator and go
// through the real access-service backend (see lib/professional/api.ts) —
// there is no more self-serve application flow, so this local mock directory
// starts empty rather than carrying fabricated profiles.
export const DEMO_PROFILES: ProfessionalProfile[] = [];
