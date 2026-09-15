const PROPERTY_API_URL = process.env.NEXT_PUBLIC_PROPERTY_API_URL || 'http://localhost:8081/api/property-service';

/** Uploads one file to MinIO via property-service's presigned-URL endpoint and returns the
 *  public URL to save (into imageUrl/galleryImages/photos/videoUrl). The file's bytes go
 *  straight from this browser to MinIO — property-service never sees them. */
export async function uploadMedia(file: Blob, contentType: string, token: string | null): Promise<string> {
  if (!token) throw new Error('Please sign in again.');

  const presignRes = await fetch(`${PROPERTY_API_URL}/media/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ contentType }),
  });
  if (!presignRes.ok) {
    const data = await presignRes.json().catch(() => null);
    throw new Error(data?.message || 'Could not prepare the upload.');
  }
  const { uploadUrl, publicUrl } = await presignRes.json();

  const putRes = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file });
  if (!putRes.ok) throw new Error('Upload failed. Please try again.');

  return publicUrl as string;
}
