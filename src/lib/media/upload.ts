const PROPERTY_API_URL = process.env.NEXT_PUBLIC_PROPERTY_API_URL || 'http://localhost:8081/api/property-service';

/** Largest video accepted; the server's proxy allows 200 MB. */
export const MAX_VIDEO_BYTES = 150 * 1024 * 1024;

const VIDEO_TYPES_BY_EXTENSION: Record<string, string> = { mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm' };

/** The type to upload a video as. Some Android phones and file managers give no type at all or a made-up one, so the file ending decides then. Null when it is not a supported video. */
export function videoContentType(file: File): string | null {
  if (['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type)) return file.type;
  return VIDEO_TYPES_BY_EXTENSION[file.name.split('.').pop()?.toLowerCase() ?? ''] ?? null;
}

/** Uploads one file, trying once more if the connection drops (common on mobile data). A sign-in problem is not retried. */
export async function uploadMedia(file: Blob, contentType: string, token: string | null): Promise<string> {
  try {
    return await uploadMediaOnce(file, contentType, token);
  } catch (error) {
    if (!token || (error instanceof Error && !/Upload failed|Failed to fetch|NetworkError|Load failed/i.test(error.message))) throw error;
    return uploadMediaOnce(file, contentType, token);
  }
}

/** Uploads one file to MinIO via property-service's presigned-URL endpoint and returns the
 *  public URL to save (into imageUrl/galleryImages/photos/videoUrl). The file's bytes go
 *  straight from this browser to MinIO — property-service never sees them. */
async function uploadMediaOnce(file: Blob, contentType: string, token: string | null): Promise<string> {
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
