import { NextResponse } from 'next/server';
import { getActiveTourProvider } from '@/lib/tours/provider';
import { TourProviderUnavailableError, TourProviderRequestError, type GenerationInput } from '@/lib/tours/provider/types';
import { buildPromptFromProperty, type PropertyPromptInput } from '@/lib/tours/promptBuilder';
import { getAzimuthForCategory } from '@/lib/photoCategories';
import { upsertTourRecord } from '@/lib/tours/repository';

const STATUS_BY_ERROR_KIND: Record<TourProviderRequestError['kind'], number> = {
  auth: 401,
  payment: 402,
  validation: 422,
  upstream: 502,
  network: 502,
};

// Only these fields are ever read from the request body. The frontend
// cannot send display_name, model, or a raw world_prompt — this route is
// the only place that constructs the actual World Labs payload, per the
// "don't let the frontend send arbitrary World Labs fields" requirement.
// imageUrl/photos are the property's own photos (http(s) URLs for
// seeded/mock listings, data: URLs for uploaded ones) — still just
// whitelisted property fields, not an arbitrary World Labs payload shape.
// Note photos[].category is looked up server-side (getAzimuthForCategory)
// rather than trusting a client-sent azimuth number.
interface RequestBody {
  /** Required in the production flow (so the initial record can be
   *  persisted server-side under the right property — see
   *  src/lib/tours/repository); absent only from the dev test panel, which
   *  has no real property and skips persistence entirely. */
  propertyId?: string;
  property?: PropertyPromptInput;
  imageUrl?: string;
  photos?: { url?: string; category?: string }[];
  /** Developer/test-panel escape hatch only — see src/app/dev/worldlabs-test.
   *  Never surfaced in the production "Generate 3D Tour" UI. */
  promptOverride?: string;
}

const MAX_PROMPT_OVERRIDE_LENGTH = 500;
// Photos are already downscaled to <=1600px JPEG before upload (see
// src/lib/imageUpload.ts), so a legitimate one is a few hundred KB; this is
// a generous ceiling against a malformed/oversized payload, not a realistic
// limit for an actual property photo.
const MAX_IMAGE_DATA_URL_LENGTH = 12_000_000;

function isUsablePhotoUrl(url: unknown): url is string {
  return typeof url === 'string' && url.length > 0 && url.length <= MAX_IMAGE_DATA_URL_LENGTH;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RequestBody | null;

  const promptOverride = typeof body?.promptOverride === 'string' ? body.promptOverride.trim().slice(0, MAX_PROMPT_OVERRIDE_LENGTH) : undefined;
  const prompt = promptOverride || buildPromptFromProperty(body?.property);

  const imageUrl = isUsablePhotoUrl(body?.imageUrl) ? body.imageUrl : undefined;

  // The user explicitly requested to send ALL images (interior & exterior) to the AI.
  // We collect all usable photos and assign them evenly spaced azimuths (0 to 360) 
  // so World Labs accepts the payload. Note: World Labs is designed for single objects, 
  // so mixing inside/outside photos in one request will force the model to attempt 
  // stitching them into a single continuous shape.
  const allUsablePhotos: string[] = [];
  for (const photo of body?.photos ?? []) {
    if (isUsablePhotoUrl(photo?.url)) {
      allUsablePhotos.push(photo.url);
    }
  }

  let input: GenerationInput;
  if (allUsablePhotos.length >= 2) {
    // World Labs API enforces a strict maximum of 4 images for multiImage generation.
    const cappedPhotos = allUsablePhotos.slice(0, 4);
    // Distribute the images evenly around a 360-degree circle
    const step = 360 / cappedPhotos.length;
    const images = cappedPhotos.map((url, index) => ({
      url,
      azimuth: Math.round(index * step),
    }));
    input = { mode: 'multiImage', images, prompt };
  } else if (imageUrl) {
    input = { mode: 'image', imageUrl, prompt };
  } else {
    input = { mode: 'text', prompt };
  }

  const propertyId = typeof body?.propertyId === 'string' && body.propertyId.length > 0 ? body.propertyId : undefined;
  const provider = getActiveTourProvider();

  try {
    const result = await provider.generateTour(input);

    // Persist immediately so the record exists server-side (visible to any
    // browser/device asking for this property's tour) from the moment
    // generation starts, not only once it finishes.
    if (propertyId) {
      await upsertTourRecord(propertyId, {
        status: result.status,
        phase: result.status === 'failed' ? 'failed' : 'generating',
        operationId: result.operationId,
        worldId: result.worldId,
        viewerUrl: result.viewerUrl,
        error: result.error,
        providerMode: provider.mode,
      });
    }

    return NextResponse.json({ ...result, providerId: provider.id, providerMode: provider.mode, prompt });
  } catch (err) {
    const message = err instanceof TourProviderUnavailableError || err instanceof TourProviderRequestError ? err.message : err instanceof Error ? err.message : 'Tour generation failed.';

    if (propertyId) {
      await upsertTourRecord(propertyId, { status: 'failed', phase: 'failed', error: message, providerMode: provider.mode });
    }

    if (err instanceof TourProviderUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof TourProviderRequestError) {
      return NextResponse.json({ error: err.message, kind: err.kind }, { status: STATUS_BY_ERROR_KIND[err.kind] });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
