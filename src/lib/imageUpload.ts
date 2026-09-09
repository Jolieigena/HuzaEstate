// Property photos are stored as data URLs inside Property.imageUrl (this
// prototype has no object storage / upload endpoint — everything lives in
// localStorage). Raw camera photos can be several MB, which risks blowing
// the ~5MB localStorage quota after just a couple of listings, so every
// upload is downscaled and re-encoded as JPEG before it's ever stored.
const MAX_IMAGE_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

/** Soft cap on photos per listing — keeps a single property's data URLs
 *  from eating the whole ~5MB localStorage quota by itself. */
export const MAX_IMAGES_PER_PROPERTY = 12;

export function fileToCompressedDataUrl(file: File): Promise<string> {
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
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** Converts multiple files independently, skipping (rather than aborting
 *  on) any that fail to read/decode so one bad file doesn't block the rest. */
export async function filesToCompressedDataUrls(files: File[]): Promise<{ dataUrls: string[]; failedCount: number }> {
  const results = await Promise.all(
    files.map((file) =>
      fileToCompressedDataUrl(file)
        .then((url) => ({ ok: true as const, url }))
        .catch(() => ({ ok: false as const }))
    )
  );
  const dataUrls = results.filter((r): r is { ok: true; url: string } => r.ok).map((r) => r.url);
  return { dataUrls, failedCount: results.length - dataUrls.length };
}
