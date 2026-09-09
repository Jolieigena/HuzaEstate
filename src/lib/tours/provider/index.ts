import { mockTourProvider } from "./mockProvider";
import { worldLabsProvider } from "./worldLabsProvider";
import type { TourProvider } from "./types";

/**
 * Resolves the active 3D tour provider. Live mode only activates once
 * WORLD_LABS_API_KEY is set on the server — until then every request is
 * served by the mock provider, which always works. This is the single
 * place that decision is made (server-side only: see src/app/api/tours/*),
 * so no client component hardcodes one provider. Mirrors
 * src/lib/finance/provider/index.ts's getActiveProvider.
 */
export function getActiveTourProvider(): TourProvider {
  if (process.env.WORLD_LABS_API_KEY) return worldLabsProvider;
  return mockTourProvider;
}

export * from "./types";
