import { TourProviderUnavailableError, TourProviderRequestError, type TourProvider, type GenerationInput } from "./types";

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
  world_id: string;
  world_marble_url: string;
  assets?: {
    thumbnail_url?: string | null;
    imagery?: { pano_url?: string | null } | null;
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

function toWorldPrompt(input: GenerationInput) {
  switch (input.mode) {
    case "text":
      return { type: "text" as const, text_prompt: input.prompt };
    // image / multiImage / video are modeled in the type system for the
    // planned upgrade (see types.ts) but not wired up yet — reaching here
    // means a caller tried to use one before that work is done.
    default:
      throw new TourProviderRequestError(`Generation mode "${input.mode}" is not implemented yet — only "text" is supported.`, "validation");
  }
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
          // gallery (which `public: true` would do).
          permission: { allow_id_access: true },
        }),
      });
    } catch (err) {
      throw new TourProviderRequestError(`Could not reach World Labs: ${err instanceof Error ? err.message : "network error"}.`, "network");
    }

    if (!res.ok) throw await errorFromResponse(res);

    const data = (await res.json()) as GenerateWorldResponse;
    return { operationId: data.operation_id, status: data.done ? "ready" : "pending" };
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

    const data = (await res.json()) as GenerateWorldResponse;

    if (data.error) {
      return { operationId, status: "failed", error: data.error.message ?? "World generation failed." };
    }
    if (!data.done || !data.response) {
      return { operationId, status: "pending" };
    }

    const world = data.response;
    return {
      operationId,
      status: "ready",
      worldId: world.world_id,
      viewerUrl: world.world_marble_url,
      thumbnailUrl: world.assets?.thumbnail_url ?? world.assets?.imagery?.pano_url ?? undefined,
      panoUrl: world.assets?.imagery?.pano_url ?? undefined,
    };
  },
};
