import { NextResponse } from 'next/server';
import { getActiveTourProvider } from '@/lib/tours/provider';
import { TourProviderUnavailableError, TourProviderRequestError } from '@/lib/tours/provider/types';
import { buildPromptFromProperty, type PropertyPromptInput } from '@/lib/tours/promptBuilder';

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
interface RequestBody {
  property?: PropertyPromptInput;
  /** Developer/test-panel escape hatch only — see src/app/dev/worldlabs-test.
   *  Never surfaced in the production "Generate 3D Tour" UI. */
  promptOverride?: string;
}

const MAX_PROMPT_OVERRIDE_LENGTH = 500;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RequestBody | null;

  const promptOverride = typeof body?.promptOverride === 'string' ? body.promptOverride.trim().slice(0, MAX_PROMPT_OVERRIDE_LENGTH) : undefined;
  const prompt = promptOverride || buildPromptFromProperty(body?.property);

  const provider = getActiveTourProvider();

  try {
    const result = await provider.generateTour({ mode: 'text', prompt });
    return NextResponse.json({ ...result, providerId: provider.id, providerMode: provider.mode, prompt });
  } catch (err) {
    if (err instanceof TourProviderUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof TourProviderRequestError) {
      return NextResponse.json({ error: err.message, kind: err.kind }, { status: STATUS_BY_ERROR_KIND[err.kind] });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Tour generation failed.' }, { status: 500 });
  }
}
