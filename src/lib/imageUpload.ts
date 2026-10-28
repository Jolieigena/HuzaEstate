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

type Sniffed = 'jpeg' | 'png' | 'webp' | 'heif' | 'avif' | 'tiff' | 'other';

/** What the file really is, from its first bytes. A phone can hand over a HEIC photo named .jpg or with no type, so the name and type cannot be trusted. */
async function sniff(file: Blob): Promise<Sniffed> {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
  if (bytes[0] === 0x89 && ascii(1, 4) === 'PNG') return 'png';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp';
  if (ascii(4, 8) === 'ftyp') {
    const brand = ascii(8, 12);
    if (brand === 'avif' || brand === 'avis') return 'avif';
    return 'heif'; // heic, heix, hevc, mif1, msf1 and the other HEIF brands
  }
  if ((bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a) || (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[3] === 0x2a)) return 'tiff';
  return 'other';
}

interface Decoded { source: CanvasImageSource; width: number; height: number; release: () => void }

/** Opens an image the browser can read. createImageBitmap is light on memory and applies the camera's rotation; the <img> route covers browsers without it. */
async function decode(file: Blob): Promise<Decoded> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
      // fall through to the <img> route
    }
  }
  // An object URL points at the file instead of copying it into memory as text.
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to decode image'));
      el.src = objectUrl;
    });
    return { source: img, width: img.naturalWidth || img.width, height: img.naturalHeight || img.height, release: () => {} };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** HEIC/HEIF becomes JPEG. The converter is large, so it loads only when a file like this comes in. */
async function heicToJpeg(file: Blob): Promise<Blob> {
  const { default: heic2any } = await import('heic2any');
  // The converter rejects with a plain object, not an Error.
  const converted = await heic2any({ blob: file, toType: COMPRESSED_CONTENT_TYPE, quality: JPEG_QUALITY }).catch(() => {
    throw new Error('Failed to decode image');
  });
  return Array.isArray(converted) ? converted[0] : converted;
}

/** Any photo in, a resized JPEG out. HEIC/HEIF is converted first; anything else the browser can open (JPEG, PNG, WebP, GIF, BMP, AVIF...) is drawn straight; a file the browser cannot open is tried as HEIC before giving up. */
async function toJpeg(file: Blob): Promise<Blob> {
  if (file.size === 0) throw new Error('Empty file');
  let input: Blob = file;
  let converted = false;
  if ((await sniff(file)) === 'heif') {
    input = await heicToJpeg(file);
    converted = true;
  }
  let decoded: Decoded;
  try {
    decoded = await decode(input);
  } catch (error) {
    if (converted) throw error;
    // Not recognised by its bytes or its name, but the browser cannot open it either: HEIC is the usual reason.
    try {
      decoded = await decode(await heicToJpeg(file));
    } catch {
      throw error;
    }
  }
  try {
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(decoded.width, decoded.height));
    const width = Math.max(1, Math.round(decoded.width * scale));
    const height = Math.max(1, Math.round(decoded.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not supported in this browser');
    // A transparent PNG or GIF would turn black as a JPEG; white is what a listing page expects behind it.
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(decoded.source, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode image'))), COMPRESSED_CONTENT_TYPE, JPEG_QUALITY));
  } finally {
    decoded.release();
  }
}

export async function fileToUploadedUrl(file: File, token: string | null): Promise<string> {
  const blob = await toJpeg(file);
  return uploadMedia(blob, COMPRESSED_CONTENT_TYPE, token);
}

/** For uploads that take a ready file (profile photos, logos, designs, shop products): JPEG, PNG and WebP go as they are, and anything else (HEIC, GIF, BMP, AVIF...) becomes a JPEG. The type is read from the file's bytes, not its name. */
export async function imageForUpload(file: Blob): Promise<{ blob: Blob; contentType: string }> {
  try {
    const known = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' } as const;
    const kind = await sniff(file);
    if (kind === 'jpeg' || kind === 'png' || kind === 'webp') return { blob: file, contentType: known[kind] };
    return { blob: await toJpeg(file), contentType: COMPRESSED_CONTENT_TYPE };
  } catch (error) {
    throw new Error(failureReason(error));
  }
}

/** Uploads multiple files independently, skipping (rather than aborting on) any that fail
 *  to read/decode/upload so one bad file doesn't block the rest. */
export async function filesToUploadedUrls(files: File[], token: string | null): Promise<{ urls: string[]; failedCount: number; reasons: string[] }> {
  const results = await Promise.all(
    files.map((file) =>
      fileToUploadedUrl(file, token)
        .then((url) => ({ ok: true as const, url }))
        .catch((error: unknown) => ({ ok: false as const, reason: failureReason(error) }))
    )
  );
  const urls = results.filter((r): r is { ok: true; url: string } => r.ok).map((r) => r.url);
  const reasons = [...new Set(results.flatMap((r) => (r.ok ? [] : [r.reason])))];
  return { urls, failedCount: results.length - urls.length, reasons };
}

function failureReason(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (/sign in/i.test(message)) return 'Your session has expired. Sign in again.';
  if (message === 'Empty file') return 'A photo is empty. If it is stored in the cloud, open it in your gallery so it downloads, then add it again.';
  if (message === 'Upload failed. Please try again.' || /failed to fetch|networkerror|load failed/i.test(message)) return 'The connection dropped. Check your internet and try again.';
  if (message === 'Failed to decode image' || message === 'Failed to encode image' || message === 'Canvas is not supported in this browser') {
    return 'That file could not be read as a photo. Choose another photo, or take a screenshot of it and add that.';
  }
  return message || 'Try again.';
}
