import { NextResponse } from 'next/server';
import { getActiveTourProvider } from '@/lib/tours/provider';
import { TourProviderUnavailableError, TourProviderRequestError } from '@/lib/tours/provider/types';
import { persistReadyGeneration } from '@/lib/tours/assetPipeline';
import { isValidPropertyId } from '@/lib/tours/validation';

// Same rationale as status/route.ts — the download-and-store pipeline needs
// more headroom than a platform's default function timeout.
export const maxDuration = 60;

const STATUS_BY_ERROR_KIND: Record<TourProviderRequestError['kind'], number> = {
  auth: 401,
  payment: 402,
  validation: 422,
  upstream: 502,
  network: 502,
};

interface RequestBody {
  propertyId?: string;
  /** A World Labs world_id, e.g. copied from the "ID" column of the
   *  Generations table at platform.worldlabs.ai. */
  worldId?: string;
}

/**
 * Attaches an already-generated World Labs world to a property instead of
 * starting a brand new (billed) generation — looks the world up directly by
 * id (GET /marble/v1/worlds/{world_id}) and runs it through the same
 * download/store pipeline a fresh generation would go through.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RequestBody | null;
  const propertyId = typeof body?.propertyId === 'string' ? body.propertyId.trim() : '';
  const worldId = typeof body?.worldId === 'string' ? body.worldId.trim() : '';

  if (!isValidPropertyId(propertyId)) return NextResponse.json({ error: 'A valid propertyId is required.' }, { status: 400 });
  if (!worldId) return NextResponse.json({ error: 'worldId is required.' }, { status: 400 });

  const provider = getActiveTourProvider();
  if (!provider.getWorldById) {
    return NextResponse.json({ error: `${provider.displayName} does not support attaching an existing world by id.` }, { status: 501 });
  }

  try {
    const result = await provider.getWorldById(worldId);
    const record = await persistReadyGeneration(propertyId, `world:${worldId}`, result, provider.mode);
    const scene = record.scenes.find((scene) => scene.operationId === `world:${worldId}`);
    return NextResponse.json({ ...scene, providerId: provider.id, providerMode: provider.mode });
  } catch (err) {
    const message = err instanceof TourProviderUnavailableError || err instanceof TourProviderRequestError ? err.message : err instanceof Error ? err.message : 'Failed to attach the existing world.';

    if (err instanceof TourProviderUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof TourProviderRequestError) {
      return NextResponse.json({ error: err.message, kind: err.kind }, { status: STATUS_BY_ERROR_KIND[err.kind] });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
