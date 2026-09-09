import { newId } from "../ids";
import type { TourProvider } from "./types";

// How long a mock generation stays "pending" before resolving, purely to
// exercise the real polling UI without making a demo wait ~5 real minutes
// (that's how long an actual Marble generation takes).
const MOCK_PENDING_MS = 6_000;

interface PendingOperation {
  startedAt: number;
  resolved?: { worldId: string; viewerUrl: string };
}

// Module-scope map — fine for a single Node process serving this API route,
// matching the "prototype storage" bar set by the rest of this app's
// localStorage-backed stores (see src/lib/finance/storage.ts).
const operations = new Map<string, PendingOperation>();

/**
 * Always-working demonstration provider. It never calls World Labs and never
 * fabricates a viewer URL that claims to be generated from real property
 * data — that would be presenting fake content as real. Instead, once the
 * simulated generation completes, it points at World Labs' own real, public
 * Marble gallery so the "Open 3D Tour" link genuinely works, clearly
 * labeled by the caller as a demo. Set WORLD_LABS_API_KEY to switch to
 * worldLabsProvider and generate real tours.
 */
export const mockTourProvider: TourProvider = {
  id: "huza_mock_tour_provider",
  displayName: "HuzaEstate Mock 3D Tour Provider (demo mode)",
  mode: "mock",

  async generateTour() {
    const operationId = newId("mock_tour_op");
    operations.set(operationId, { startedAt: Date.now() });
    return { operationId, status: "pending" };
  },

  async getGenerationStatus(operationId) {
    const op = operations.get(operationId);
    if (!op) return { operationId, status: "failed", error: "Unknown or expired operation." };

    const elapsed = Date.now() - op.startedAt;
    if (elapsed < MOCK_PENDING_MS) return { operationId, status: "pending" };

    if (!op.resolved) {
      op.resolved = { worldId: newId("mock_world"), viewerUrl: "https://marble.worldlabs.ai/" };
    }

    return {
      operationId,
      status: "ready",
      worldId: op.resolved.worldId,
      viewerUrl: op.resolved.viewerUrl,
    };
  },
};
