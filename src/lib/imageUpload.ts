// Property photos are compressed client-side, then uploaded to MinIO (object storage) via
// property-service's presigned-URL endpoint — see src/lib/media/upload.ts. Only the resulting
// public URL is ever stored (in Property.imageUrl / galleryImages / photos[].url), not the
// image bytes themselves.
import { uploadMedia } from './media/upload';

const MAX_IMAGE_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;
const COMPRESSED_CONTENT_TYPE = 'image/jpeg';

/** Soft cap on photos per listing — matches the limit property-service enforces server-side. */
export const MAX_IMAGES_PER_PROPERTY = 12;

function compressImage(file: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // An object URL points at the file instead of copying it into memory as text, which keeps big camera photos from failing on phones with little free memory.
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Failed to decode image')); };
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas is not supported in this browser'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode image'))), COMPRESSED_CONTENT_TYPE, JPEG_QUALITY);
    };
    img.src = objectUrl;
  });
}

const isHeic = (file: File) => /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);

/** iPhones and some Samsung phones save HEIC, which browsers cannot open; it is turned into JPEG first. The converter loads only when needed. */
async function readableImage(file: File): Promise<File | Blob> {
  if (!isHeic(file)) return file;
  const { default: heic2any } = await import('heic2any');
  const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: JPEG_QUALITY });
  return Array.isArray(converted) ? converted[0] : converted;
}

export async function fileToUploadedUrl(file: File, token: string | null): Promise<string> {
  const blob = await compressImage(await readableImage(file));
  return uploadMedia(blob, COMPRESSED_CONTENT_TYPE, token);
}

/** Uploads multiple files independently, skipping (rather than aborting on) any that fail
 *  to read/decode/upload so one bad file doesn't block the rest. */
export async function filesToUploadedUrls(files: File[], token: string | null): Promise<{ urls: string[]; failedCount: number; reasons: string[] }> {
  const results = await Promise.all(
    files.map((file) =>
      fileToUploadedUrl(file, token)
        .then((url) => ({ ok: true as const, url }))
        .catch((error: unknown) => ({ ok: false as const, reason: failureReason(file, error) }))
    )
  );
  const urls = results.filter((r): r is { ok: true; url: string } => r.ok).map((r) => r.url);
  const reasons = [...new Set(results.flatMap((r) => (r.ok ? [] : [r.reason])))];
  return { urls, failedCount: results.length - urls.length, reasons };
}

function failureReason(file: File, error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (/sign in/i.test(message)) return 'Your session has expired. Sign in again.';
  if (message === 'Failed to decode image' || message === 'Failed to read file') {
    return 'That photo could not be opened. Try a JPEG or PNG.';
  }
  if (isHeic(file)) return 'That HEIC photo could not be converted. Take the photo as JPEG or choose another one.';
  if (message === 'Upload failed. Please try again.' || /failed to fetch|networkerror|load failed/i.test(message)) return 'The connection dropped. Check your internet and try again.';
  return message || 'Try again.';
}
