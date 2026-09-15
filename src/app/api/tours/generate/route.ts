import { NextResponse } from 'next/server';
import { getActiveTourProvider } from '@/lib/tours/provider';
import { TourProviderUnavailableError, TourProviderRequestError, type GenerationInput } from '@/lib/tours/provider/types';
import { buildPromptFromProperty, type PropertyPromptInput } from '@/lib/tours/promptBuilder';
import sharp from 'sharp';
import { upsertTourRecord } from '@/lib/tours/repository';
import type { TourScene } from '@/lib/tours/types';

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
  
  // Prioritize the most important rooms for the 4-image limit
  const PRIORITY_CATEGORIES = ['exterior_front', 'living_room', 'kitchen', 'bathroom'];
  
  const allUsablePhotos: { url: string; category?: string }[] = [];
  for (const photo of body?.photos ?? []) {
    if (isUsablePhotoUrl(photo?.url)) {
      allUsablePhotos.push({ url: photo.url, category: photo.category });
    }
  }

  // Sort photos so that priority categories appear first
  allUsablePhotos.sort((a, b) => {
    const idxA = a.category ? PRIORITY_CATEGORIES.indexOf(a.category) : -1;
    const idxB = b.category ? PRIORITY_CATEGORIES.indexOf(b.category) : -1;
    
    // If both are in priority list, sort by priority order
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    // If only a is in priority list, it comes first
    if (idxA !== -1) return -1;
    // If only b is in priority list, it comes first
    if (idxB !== -1) return 1;
    // Otherwise preserve original order
    return 0;
  });

  const inputList: { category: string; input: GenerationInput }[] = [];
  
  if (allUsablePhotos.length > 0) {
    // RECONSTRUCTION EXPERIMENT:
    const capped = allUsablePhotos.slice(0, 8);
    
    const processedImages = await Promise.all(capped.map(async (p) => {
      let buffer: Buffer;
      if (p.url.startsWith('data:')) {
        buffer = Buffer.from(p.url.split(',')[1], 'base64');
      } else {
        const res = await fetch(p.url);
        if (!res.ok) throw new Error(`Failed to fetch image: ${p.url}`);
        buffer = Buffer.from(await res.arrayBuffer());
      }
      
      const originalMetadata = await sharp(buffer).metadata();
      
      const processedBuffer = await sharp(buffer)
        .rotate() // auto-rotate based on EXIF orientation and remove the EXIF tag
        .resize(1024, 768, { fit: 'inside', withoutEnlargement: true }) // Consistent dimensions without upscaling
        .jpeg({ quality: 80 }) // strip all metadata and compress to save upload time
        .toBuffer();
        
      const newMetadata = await sharp(processedBuffer).metadata();
      
      console.log(`\n--- Image Processing Log ---`);
      console.log(`Original URL: ${p.url.substring(0, 50)}...`);
      console.log(`Original Dimensions: ${originalMetadata.width}x${originalMetadata.height}`);
      console.log(`Original EXIF Orientation: ${originalMetadata.orientation}`);
      console.log(`Corrected Orientation: ${originalMetadata.orientation && originalMetadata.orientation !== 1 ? 'Yes' : 'No'}`);
      console.log(`Final Dimensions: ${newMetadata.width}x${newMetadata.height}`);
      
      return `data:image/jpeg;base64,${processedBuffer.toString('base64')}`;
    }));
    
    const newPrompt = "Reconstruct this real indoor property accurately from the provided photographs. Preserve the spatial structure shown in the source images. Maintain natural upright orientation, vertical walls, horizontal floors and ceilings, realistic room proportions, and consistent geometry. Do not rotate, invert, mirror, or flip the environment.";
    
    // Notice: azimuth is completely omitted
    const images = processedImages.map(url => ({ url }));
    
    console.log(`\nSending ${images.length} images to World Labs...`);
    console.log(`Prompt: ${newPrompt}`);
    
    if (images.length >= 2) {
      inputList.push({ category: 'whole_house_reconstruction', input: { mode: 'multiImage', images, prompt: newPrompt, reconstructImages: true } });
    } else {
      inputList.push({ category: 'exterior_front', input: { mode: 'image', imageUrl: images[0].url, prompt: newPrompt } });
    }
  } else if (imageUrl) {
    inputList.push({ category: 'exterior_front', input: { mode: 'image', imageUrl, prompt } });
  } else {
    inputList.push({ category: 'default', input: { mode: 'text', prompt } });
  }

  const propertyId = typeof body?.propertyId === 'string' && body.propertyId.length > 0 ? body.propertyId : undefined;
  const provider = getActiveTourProvider();

  try {
    
    // Fire all generation requests in parallel
    const promises = inputList.map(async ({ category, input }): Promise<TourScene> => {
      try {
        const result = await provider.generateTour(input);
        return {
          id: result.operationId || `local_${Date.now()}_${Math.random()}`,
          category,
          status: result.status,
          phase: result.status === 'failed' ? 'failed' : 'generating',
          operationId: result.operationId,
          worldId: result.worldId,
          viewerUrl: result.viewerUrl,
          error: result.error,
          providerMode: provider.mode,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Tour generation failed.';
        return {
          id: `local_${Date.now()}_${Math.random()}`,
          category,
          status: 'failed',
          phase: 'failed',
          error: message,
          providerMode: provider.mode,
        };
      }
    });

    const generatedScenes = await Promise.all(promises);
    const overallStatus = generatedScenes.every(s => s.status === 'ready') ? 'ready' : generatedScenes.some(s => s.status === 'failed') ? 'failed' : 'pending';

    if (propertyId) {
      await upsertTourRecord(propertyId, {
        status: overallStatus,
        phase: overallStatus === 'failed' ? 'failed' : 'generating',
        scenes: generatedScenes,
        providerMode: provider.mode,
      });
    }

    return NextResponse.json({ scenes: generatedScenes, providerId: provider.id, providerMode: provider.mode, prompt });
  } catch (err) {
    const message = err instanceof TourProviderUnavailableError || err instanceof TourProviderRequestError ? err.message : err instanceof Error ? err.message : 'Tour generation failed.';

    if (propertyId) {
      await upsertTourRecord(propertyId, { status: 'failed', phase: 'failed', error: message, providerMode: provider.mode, scenes: [] });
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
