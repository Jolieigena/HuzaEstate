// Provider abstraction for AI-generated 3D property tours (World Labs'
// Marble World API), mirroring the finance/provider/types.ts pattern: a
// narrow interface, a mock implementation that always works, and a real
// implementation gated behind live credentials.

export type TourProviderMode = "mock" | "live";

export class TourProviderUnavailableError extends Error {
  constructor(message = "3D tour generation is not configured yet.") {
    super(message);
    this.name = "TourProviderUnavailableError";
  }
}

/** Thrown for World Labs error responses we can attribute to a specific,
 *  known cause (auth, credits, validation) rather than a generic failure —
 *  see errorFromResponse() in worldLabsProvider.ts. */
export class TourProviderRequestError extends Error {
  constructor(
    message: string,
    public readonly kind: "auth" | "payment" | "validation" | "upstream" | "network"
  ) {
    super(message);
    this.name = "TourProviderRequestError";
  }
}

export type TourGenerationStatus = "pending" | "ready" | "failed";

/**
 * What a generation request is built from — the text prompt is always
 * derived server-side from property data (see product decision: no
 * per-generation user prompt in the production flow), and is attached
 * alongside an image/multiImage input as extra guidance. "text" and
 * "image" and "multiImage" are implemented (see
 * src/app/api/tours/generate/route.ts for how a property's photos pick
 * one); "video" is modeled here so the provider interface doesn't need to
 * change shape again when it's implemented, but no caller constructs it
 * yet and World Labs would reject it as unimplemented.
 */
export type GenerationInput =
  | { mode: "text"; prompt: string }
  | { mode: "image"; imageUrl: string; prompt?: string }
  | { mode: "multiImage"; images: { url: string; azimuth: number }[]; prompt?: string; reconstructImages?: boolean }
  | { mode: "video"; videoUrl: string; prompt?: string };

export interface TourGenerationResult {
  operationId: string;
  status: TourGenerationStatus;
  worldId?: string;
  /** World Labs' own hosted viewer (world_marble_url) — debug/fallback
   *  only, see TourRecord.viewerUrl. */
  viewerUrl?: string;
  thumbnailUrl?: string;
  /** Equirectangular 360° panorama for the generated world
   *  (assets.imagery.pano_url). */
  panoUrl?: string;
  /** Every Gaussian-splat resolution World Labs returned
   *  (assets.splats.spz_urls — an open dictionary; World Labs' own docs
   *  don't publish the exact key names, so callers shouldn't assume
   *  specific keys exist). All values are source URLs, not ours. */
  spzUrls?: Record<string, string>;
  /** Collider mesh (assets.mesh.collider_mesh_url) — simplified geometry
   *  meant for physics, not visual fidelity. */
  colliderUrl?: string;
  /** High-quality/full-resolution textured meshes
   *  (assets.mesh.hq_mesh_url / full_res_mesh_url). In practice these are
   *  usually absent: World Labs' docs describe high-quality mesh export as
   *  a separate, manual, up-to-1-hour process triggered from their web UI,
   *  not something the generate/operations API returns automatically. */
  hqMeshUrl?: string;
  fullResMeshUrl?: string;
  /** AI-generated description of the world (assets.caption). */
  caption?: string;
  /** assets.splats.semantics_metadata — lets a viewer convert the asset's
   *  raw coordinates to real-world scale. */
  semanticsMetadata?: { groundPlaneOffsetMeters?: number; metricScaleFactor?: number };
  /** All bare source URLs above (panoUrl, spzUrls, colliderUrl, ...) are
   *  exactly what World Labs returned — the caller (the tours API route)
   *  is responsible for downloading and re-hosting them exactly once; a
   *  provider never re-hosts anything itself. */
  error?: string;
}

export interface TourProvider {
  readonly id: string;
  readonly displayName: string;
  readonly mode: TourProviderMode;

  generateTour(input: GenerationInput): Promise<TourGenerationResult>;
  getGenerationStatus(operationId: string): Promise<TourGenerationResult>;
  /** Fetches an already-generated world directly by its world_id (GET
   *  /marble/v1/worlds/{world_id}) so a previously generated World Labs
   *  world can be attached to a property instead of paying for a new
   *  generation. Optional: only worldLabsProvider implements it — the mock
   *  provider never creates real, independently-addressable worlds. */
  getWorldById?(worldId: string): Promise<TourGenerationResult>;
}
