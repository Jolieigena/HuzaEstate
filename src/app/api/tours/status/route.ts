import { NextResponse } from 'next/server';
import { getActiveTourProvider } from '@/lib/tours/provider';
import { TourProviderUnavailableError, TourProviderRequestError } from '@/lib/tours/provider/types';
import { ensurePanoCached } from '@/lib/tours/assetStorage';

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

    // Once the tour is ready, mirror the panorama onto our own domain so
    // buyers view it from HuzaEstate instead of hotlinking World Labs — see
    // src/lib/tours/assetStorage.ts. Best-effort: if the download fails for
    // any reason, the tour still comes back "ready" via the World Labs
    // viewer link, it just won't have an embedded panorama this poll.
    let panoUrl: string | undefined;
    if (result.status === 'ready' && propertyId && result.panoUrl) {
      try {
        await ensurePanoCached(propertyId, result.panoUrl);
        panoUrl = `/api/tours/panorama?propertyId=${encodeURIComponent(propertyId)}`;
      } catch {
        panoUrl = undefined;
      }
    }

    return NextResponse.json({ ...result, panoUrl, providerId: provider.id, providerMode: provider.mode });
  } catch (err) {
    if (err instanceof TourProviderUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof TourProviderRequestError) {
      return NextResponse.json({ error: err.message, kind: err.kind }, { status: STATUS_BY_ERROR_KIND[err.kind] });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not check tour status.' }, { status: 500 });
  }
}
