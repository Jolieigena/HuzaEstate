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

function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.onload = () => {
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
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export async function fileToUploadedUrl(file: File, token: string | null): Promise<string> {
  const blob = await compressImage(file);
  return uploadMedia(blob, COMPRESSED_CONTENT_TYPE, token);
}

/** Uploads multiple files independently, skipping (rather than aborting on) any that fail
 *  to read/decode/upload so one bad file doesn't block the rest. */
export async function filesToUploadedUrls(files: File[], token: string | null): Promise<{ urls: string[]; failedCount: number; reasons: string[] }> {
  const results = await Promise.all(
    files.map((file) =>
      uploadWithRetry(file, token)
        .then((url) => ({ ok: true as const, url }))
        .catch((error: unknown) => ({ ok: false as const, reason: failureReason(file, error) }))
    )
  );
  const urls = results.filter((r): r is { ok: true; url: string } => r.ok).map((r) => r.url);
  const reasons = [...new Set(results.flatMap((r) => (r.ok ? [] : [r.reason])))];
  return { urls, failedCount: results.length - urls.length, reasons };
}

/** A weak mobile connection often fails the first try, so a failed upload is tried once more. A sign-in problem is not retried. */
async function uploadWithRetry(file: File, token: string | null): Promise<string> {
  try {
    return await fileToUploadedUrl(file, token);
  } catch (error) {
    if (error instanceof Error && /sign in/i.test(error.message)) throw error;
    return fileToUploadedUrl(file, token);
  }
}

function failureReason(file: File, error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (/sign in/i.test(message)) return 'Your session has expired. Sign in again.';
  if (message === 'Failed to decode image' || message === 'Failed to read file') {
    return /hei[cf]/i.test(`${file.type} ${file.name}`)
      ? 'HEIC photos are not supported. Take the photo as JPEG or choose another one.'
      : 'That photo could not be opened. Try a JPEG or PNG.';
  }
  if (message === 'Upload failed. Please try again.' || /failed to fetch|networkerror|load failed/i.test(message)) return 'The connection dropped. Check your internet and try again.';
  return message || 'Try again.';
}
