import { NextResponse } from 'next/server';
import { readLocalTourAsset } from '@/lib/tours/assetStorage/localFs';
import { isKnownTourAssetFilename, contentTypeForFilename } from '@/lib/tours/assetFilenames';

// Serves the local-filesystem dev fallback's cached files (see
// src/lib/tours/assetStorage/localFs.ts). When BLOB_READ_WRITE_TOKEN is
// set, storeFromUrl() returns a real Vercel Blob public URL instead of one
// pointing here, so this route is only ever hit in dev/no-storage-configured
// mode. `file` is checked against the known kind/extension pattern — never
// treated as a free-form path — so this can't be used for path traversal.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get('propertyId');
  const file = searchParams.get('file');

  if (!propertyId || !file) {
    return NextResponse.json({ error: 'propertyId and file are required.' }, { status: 400 });
  }
  if (!isKnownTourAssetFilename(file)) {
    return NextResponse.json({ error: 'Unknown asset file.' }, { status: 400 });
  }

  const buffer = await readLocalTourAsset(propertyId, file);
  if (!buffer) {
    return NextResponse.json({ error: 'No such asset stored for this property yet.' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': contentTypeForFilename(file),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
