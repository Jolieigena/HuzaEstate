import { NextResponse } from 'next/server';
import { getTourRepository } from '@/lib/tours/repository';

/**
 * Returns the server-persisted tour record for a property, if one exists —
 * the authoritative cross-device source (see
 * src/lib/tours/repository/fileRepository.ts) a buyer on any browser reads
 * from, not just the browser that generated the tour. Called by
 * src/lib/tours/hooks.ts on mount to reconcile the fast local cache with
 * the real record.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get('propertyId');

  if (!propertyId) {
    return NextResponse.json({ error: 'propertyId is required.' }, { status: 400 });
  }

  const record = await getTourRepository().get(propertyId);
  if (!record) {
    return NextResponse.json({ error: 'No tour recorded for this property.' }, { status: 404 });
  }

  return NextResponse.json(record);
}
