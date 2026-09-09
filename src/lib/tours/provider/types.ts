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
 * What a generation request is built from. Only "text" is implemented
 * right now (see product decision: no per-generation user prompt in the
 * production flow — the text prompt is derived server-side from property
 * data). "image" / "multiImage" / "video" are modeled here so the provider
 * interface doesn't need to change shape again when those are implemented;
 * for now World Labs would reject them as unimplemented, and no caller
 * constructs them yet.
 */
export type GenerationInput =
  | { mode: "text"; prompt: string }
  | { mode: "image"; imageUrl: string; prompt?: string }
  | { mode: "multiImage"; imageUrls: string[]; prompt?: string }
  | { mode: "video"; videoUrl: string; prompt?: string };

export interface TourGenerationResult {
  operationId: string;
  status: TourGenerationStatus;
  worldId?: string;
  viewerUrl?: string;
  thumbnailUrl?: string;
  /** Equirectangular 360° panorama for the generated world, straight from
   *  World Labs (imagery.pano_url) — the caller (the tours API route) is
   *  responsible for downloading and re-hosting it; providers just report
   *  the source URL. */
  panoUrl?: string;
  error?: string;
}

export interface TourProvider {
  readonly id: string;
  readonly displayName: string;
  readonly mode: TourProviderMode;

  generateTour(input: GenerationInput): Promise<TourGenerationResult>;
  getGenerationStatus(operationId: string): Promise<TourGenerationResult>;
}
