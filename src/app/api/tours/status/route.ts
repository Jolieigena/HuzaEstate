import { NextResponse } from 'next/server';
import { getActiveTourProvider } from '@/lib/tours/provider';
import { TourProviderUnavailableError, TourProviderRequestError } from '@/lib/tours/provider/types';
import { downloadAndStoreTourAssets } from '@/lib/tours/assetPipeline';
import { upsertTourRecord } from '@/lib/tours/repository';

// Give the download-and-store pipeline below more headroom than a
// platform's default function timeout (e.g. Vercel Hobby defaults to 10s) —
// a Gaussian-splat file can be tens of MB. Hosts that don't recognize this
// export (plain `next dev`, non-Vercel platforms) just ignore it.
export const maxDuration = 60;

const STATUS_BY_ERROR_KIND: Record<TourProviderRequestError['kind'], number> = {
  auth: 401,
  payment: 402,
  validation: 422,
  upstream: 502,
  network: 502,
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const operationId = searchParams.get('operationId');
  const propertyId = searchParams.get('propertyId');

  if (!operationId) {
    return NextResponse.json({ error: 'operationId is required.' }, { status: 400 });
  }

  const provider = getActiveTourProvider();

  try {
    const result = await provider.getGenerationStatus(operationId);

    if (result.status !== 'ready') {
      if (propertyId) {
        await upsertTourRecord(propertyId, {
          status: result.status,
          phase: result.status === 'failed' ? 'failed' : 'generating',
          operationId,
          error: result.error,
          providerMode: provider.mode,
        });
      }
      return NextResponse.json({ ...result, providerId: provider.id, providerMode: provider.mode });
    }

    // World Labs is done. No propertyId means there's nowhere to persist to
    // (only the dev test panel omits it) — fall back to reporting World
    // Labs' own URLs directly, same as before this feature existed.
    if (!propertyId) {
      return NextResponse.json({ ...result, providerId: provider.id, providerMode: provider.mode });
    }

    // Download and store our own copies BEFORE ever telling the client this
    // tour is "ready" — normal viewing must never depend on World Labs'
    // URLs again after this point (they can be signed/expiring anyway).
    await upsertTourRecord(propertyId, {
      status: 'pending',
      phase: 'downloading_assets',
      operationId,
      worldId: result.worldId,
      viewerUrl: result.viewerUrl,
      providerMode: provider.mode,
    });

    let assets: Awaited<ReturnType<typeof downloadAndStoreTourAssets>> | undefined;
    let pipelineError: string | undefined;
    try {
      assets = await downloadAndStoreTourAssets(propertyId, result);
    } catch (err) {
      pipelineError = err instanceof Error ? err.message : 'Failed to download and store the generated tour assets.';
    }

    // A tour is only "ready" once something real is actually stored to view
    // — never mark it ready on World Labs' say-so alone.
    const hasViewableAsset = Boolean(assets?.spzUrl || assets?.panoUrl);
    if (!hasViewableAsset) {
      const record = await upsertTourRecord(propertyId, {
        status: 'failed',
        phase: 'failed',
        operationId,
        worldId: result.worldId,
        viewerUrl: result.viewerUrl,
        error: pipelineError ?? 'Generation finished but no viewable asset (splat or panorama) could be downloaded and stored.',
        providerMode: provider.mode,
      });
      return NextResponse.json({ ...record, providerId: provider.id });
    }

    const record = await upsertTourRecord(propertyId, {
      status: 'ready',
      phase: 'ready',
      operationId,
      worldId: result.worldId,
      viewerUrl: result.viewerUrl,
      thumbnailUrl: assets?.thumbnailUrl,
      panoUrl: assets?.panoUrl,
      spzUrl: assets?.spzUrl,
      rawSpzUrls: result.spzUrls,
      colliderUrl: assets?.colliderUrl,
      caption: result.caption,
      semanticsMetadata: result.semanticsMetadata,
      readyAt: new Date().toISOString(),
      providerMode: provider.mode,
    });

    return NextResponse.json({ ...record, providerId: provider.id });
  } catch (err) {
    const message =
      err instanceof TourProviderUnavailableError || err instanceof TourProviderRequestError
        ? err.message
        : err instanceof Error
          ? err.message
          : 'Could not check tour status.';

    if (propertyId) {
      await upsertTourRecord(propertyId, { status: 'failed', phase: 'failed', error: message, providerMode: provider.mode }).catch(() => {});
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
