import { TourProviderUnavailableError, TourProviderRequestError, type TourProvider, type TourGenerationResult, type GenerationInput } from "./types";

// https://docs.worldlabs.ai/api — the World API for Marble (World Labs).
// Endpoints and response shapes below were confirmed against the official
// docs (docs.worldlabs.ai/api/reference/worlds/generate.md,
// .../operations/index.md, .../worlds/get.md, .../errors.md) — not guessed.
const API_BASE = "https://api.worldlabs.ai";

function requireApiKey(): string {
  const apiKey = process.env.WORLD_LABS_API_KEY;
  if (!apiKey) throw new TourProviderUnavailableError("WORLD_LABS_API_KEY is not configured on the server.");
  return apiKey;
}

interface GenerateWorldResponse {
  operation_id: string;
  done: boolean;
  response?: WorldObject | null;
  error?: { message?: string } | null;
}

interface WorldObject {
  // World Labs' published schema (docs.worldlabs.ai/api/reference/worlds/get)
  // names this field world_id. A real generation observed in this app came
  // back with the id under `id` instead, with world_id absent — whether
  // that's API version drift or a docs inaccuracy, we don't guess which one
  // is "right": both are read defensively below (worldId: world.world_id ??
  // world.id) so this can't silently go undefined again either way.
  world_id?: string;
  id?: string;
  world_marble_url: string;
  assets?: {
    thumbnail_url?: string | null;
    caption?: string | null;
    imagery?: { pano_url?: string | null } | null;
    mesh?: {
      hq_mesh_url?: string | null;
      full_res_mesh_url?: string | null;
      collider_mesh_url?: string | null;
    } | null;
    splats?: {
      // Open dictionary — World Labs' schema documents this only as
      // "additionalProperties: string", without publishing the actual key
      // names (their own docs describe two splat tiers, "Splats (SPZ)"
      // ~2M and "Splats (low-res SPZ)" ~500k, without giving the dict keys
      // those come back under). Treated generically — see
      // pickPrimarySpzSourceUrl in ../assetPipeline.ts — rather than
      // assuming specific keys like "full"/"low_res" exist.
      spz_urls?: Record<string, string> | null;
      semantics_metadata?: {
        ground_plane_offset?: number | null;
        metric_scale_factor?: number | null;
      } | null;
    } | null;
  } | null;
}

/** Turns a World Labs error response into a typed, specific error rather
 *  than a generic "request failed" — see errors.md: 402 = insufficient
 *  credits, 422 = validation, 401/403 = auth, anything else = upstream. */
async function errorFromResponse(res: Response): Promise<TourProviderRequestError> {
  let detail = "";
  try {
    const body = await res.json();
    detail = typeof body?.detail === "string" ? body.detail : Array.isArray(body?.detail) ? body.detail.map((d: { msg?: string }) => d.msg).join("; ") : "";
  } catch {
    // body wasn't JSON (e.g. plain 400) — fall through with no extra detail
  }

  if (res.status === 401 || res.status === 403) {
    return new TourProviderRequestError("World Labs rejected the API key (unauthorized). Check WORLD_LABS_API_KEY.", "auth");
  }
  if (res.status === 402) {
    return new TourProviderRequestError(detail || "World Labs account has insufficient API credits.", "payment");
  }
  if (res.status === 422) {
    return new TourProviderRequestError(detail || "World Labs rejected the request payload as invalid.", "validation");
  }
  return new TourProviderRequestError(detail || `World Labs API error (HTTP ${res.status}).`, "upstream");
}

const DATA_URL_PATTERN = /^data:image\/(\w+);base64,(.+)$/i;

/** World Labs' image_prompt accepts a plain http(s) URL directly ("uri") or
 *  raw base64 bytes ("data_base64") — property photos are one or the other
 *  depending on where they came from (a seeded/mock https URL vs an
 *  uploaded photo, which src/lib/imageUpload.ts stores as a data: URL). */
function toImagePrompt(imageUrl: string) {
  if (/^https?:\/\//i.test(imageUrl)) {
    return { source: "uri" as const, uri: imageUrl };
  }

  const match = DATA_URL_PATTERN.exec(imageUrl);
  if (!match) {
    throw new TourProviderRequestError("Property photo must be an http(s) URL or an image data: URL.", "validation");
  }
  const [, extension, data] = match;
  return { source: "data_base64" as const, data_base64: data, extension: extension.toLowerCase() === "jpeg" ? "jpg" : extension.toLowerCase() };
}

function toWorldPrompt(input: GenerationInput) {
  switch (input.mode) {
    case "text":
      return { type: "text" as const, text_prompt: input.prompt };
    case "image":
      return { type: "image" as const, image_prompt: toImagePrompt(input.imageUrl), text_prompt: input.prompt };
    case "multiImage":
      return {
        type: "multi-image" as const,
        multi_image_prompt: input.images.map(({ url, azimuth }) => ({ azimuth, content: toImagePrompt(url) })),
        text_prompt: input.prompt,
      };
    // video is modeled in the type system for a future upgrade (see
    // types.ts) but not wired up yet — reaching here means a caller tried
    // to use it before that work is done.
    default:
      throw new TourProviderRequestError(`Generation mode "${input.mode}" is not implemented yet — only "text", "image", and "multiImage" are supported.`, "validation");
  }
}

/** Shared by generateTour (when World Labs returns done:true immediately)
 *  and getGenerationStatus — a single place that turns a raw
 *  GenerateWorldResponse into our typed result, so both call sites report
 *  the same full asset set instead of generateTour's instant-done path
 *  silently dropping everything but operationId/status (the previous bug:
 *  it never read `data.response` at all). */
function toGenerationResult(operationId: string, data: GenerateWorldResponse): TourGenerationResult {
  if (data.error) {
    return { operationId, status: "failed", error: data.error.message ?? "World generation failed." };
  }
  if (!data.done || !data.response) {
    return { operationId, status: "pending" };
  }

  const world = data.response;
  const assets = world.assets;
  const mesh = assets?.mesh;
  const splats = assets?.splats;
  const semantics = splats?.semantics_metadata;

  return {
    operationId,
    status: "ready",
    // See the WorldObject comment above — defensive dual mapping because
    // docs and an observed real response disagree on the field name.
    worldId: world.world_id ?? world.id,
    viewerUrl: world.world_marble_url,
    thumbnailUrl: assets?.thumbnail_url ?? undefined,
    panoUrl: assets?.imagery?.pano_url ?? undefined,
    spzUrls: splats?.spz_urls ?? undefined,
    colliderUrl: mesh?.collider_mesh_url ?? undefined,
    hqMeshUrl: mesh?.hq_mesh_url ?? undefined,
    fullResMeshUrl: mesh?.full_res_mesh_url ?? undefined,
    caption: assets?.caption ?? undefined,
    semanticsMetadata:
      semantics?.ground_plane_offset != null || semantics?.metric_scale_factor != null
        ? { groundPlaneOffsetMeters: semantics?.ground_plane_offset ?? undefined, metricScaleFactor: semantics?.metric_scale_factor ?? undefined }
        : undefined,
  };
}

/**
 * Real provider, backed by World Labs' Marble World API. Only ever
 * instantiated server-side (see provider/index.ts) so WORLD_LABS_API_KEY
 * never reaches the client bundle.
 */
export const worldLabsProvider: TourProvider = {
  id: "world_labs_marble",
  displayName: "World Labs Marble",
  mode: "live",

  async generateTour(input) {
    const apiKey = requireApiKey();
    const world_prompt = toWorldPrompt(input);

    let res: Response;
    try {
      res = await fetch(`${API_BASE}/marble/v1/worlds:generate`, {
        method: "POST",
        headers: {
          "WLT-Api-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          display_name: "HuzaEstate Property Tour",
          model: "marble-1.1",
          world_prompt,
          // Worlds default to fully private (permission.public/allow_id_access
          // both false) — viewable only by the account whose API key created
          // them. Buyers opening world_marble_url in their own, unauthenticated
          // browser would otherwise always hit "You don't have permission to
          // view this world". allow_id_access makes it viewable by anyone with
          // the link without also listing it in World Labs' public/community
          // gallery (which `public: true` would do). This only matters for the
          // debug/fallback viewerUrl now (see TourRecord.viewerUrl) — normal
          // buyer viewing loads our own stored assets instead.
          permission: { allow_id_access: true },
        }),
      });
    } catch (err) {
      throw new TourProviderRequestError(`Could not reach World Labs: ${err instanceof Error ? err.message : "network error"}.`, "network");
    }

    if (!res.ok) throw await errorFromResponse(res);

    let data: GenerateWorldResponse;
    try {
      data = (await res.json()) as GenerateWorldResponse;
    } catch {
      throw new TourProviderRequestError("World Labs returned a malformed response to the generate request.", "upstream");
    }
    if (!data.operation_id) {
      throw new TourProviderRequestError("World Labs' generate response was missing operation_id.", "upstream");
    }

    return toGenerationResult(data.operation_id, data);
  },

  async getGenerationStatus(operationId) {
    const apiKey = requireApiKey();

    let res: Response;
    try {
      res = await fetch(`${API_BASE}/marble/v1/operations/${encodeURIComponent(operationId)}`, {
        headers: { "WLT-Api-Key": apiKey },
      });
    } catch (err) {
      throw new TourProviderRequestError(`Could not reach World Labs: ${err instanceof Error ? err.message : "network error"}.`, "network");
    }

    if (!res.ok) throw await errorFromResponse(res);

    let data: GenerateWorldResponse;
    try {
      data = (await res.json()) as GenerateWorldResponse;
    } catch {
      throw new TourProviderRequestError("World Labs returned a malformed response to the operation status request.", "upstream");
    }

    const result = toGenerationResult(operationId, data);
    if (result.status === "ready" && !result.worldId) {
      // Both world_id and id came back empty — genuinely malformed, not
      // just a field-name mismatch. Surface this loudly rather than
      // quietly proceeding with an undefined world id.
      return { operationId, status: "failed", error: "World Labs marked generation done but the response had no world id." };
    }
    return result;
  },
};
