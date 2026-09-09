import { NextResponse } from 'next/server';
import { readCachedPano } from '@/lib/tours/assetStorage';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get('propertyId');

  if (!propertyId) {
    return NextResponse.json({ error: 'propertyId is required.' }, { status: 400 });
  }

  const buffer = await readCachedPano(propertyId);
  if (!buffer) {
    return NextResponse.json({ error: 'No panorama stored for this property yet.' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
