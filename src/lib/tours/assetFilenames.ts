// Fixed, known set of file KINDS a tour can ever store — never derived from
// user input. The actual filename appends whatever extension the real
// source URL uses (World Labs returns thumbnail.webp and panorama.png, not
// .jpg — confirmed from a real generation, not assumed), computed by
// filenameFor() below. Shared by the storage layer (server) and the
// serving route's whitelist check, so the two can't drift apart.
export const TOUR_ASSET_BASENAMES = {
  splat: "world",
  panorama: "panorama",
  thumbnail: "thumbnail",
  collider: "collider",
} as const;

export type TourAssetKind = keyof typeof TOUR_ASSET_BASENAMES;

const DEFAULT_EXTENSIONS: Record<TourAssetKind, string> = {
  splat: "spz",
  panorama: "png",
  thumbnail: "webp",
  collider: "glb",
};

const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  spz: "application/octet-stream",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  glb: "model/gltf-binary",
};

/** Extracts a lowercase, alphanumeric-only extension from a URL's path —
 *  falls back to each kind's default if the URL has none/an unexpected one,
 *  rather than trusting an attacker-influenced or malformed string. */
function extensionFromUrl(url: string, kind: TourAssetKind): string {
  try {
    const pathname = new URL(url).pathname;
    const match = /\.([a-z0-9]{2,5})$/i.exec(pathname);
    if (match) return match[1].toLowerCase();
  } catch {
    // fall through to the default below
  }
  return DEFAULT_EXTENSIONS[kind];
}

/** The exact filename we store an asset under — real extension, not an
 *  assumed one (see module comment). */
export function filenameFor(kind: TourAssetKind, sourceUrl: string): string {
  return `${TOUR_ASSET_BASENAMES[kind]}.${extensionFromUrl(sourceUrl, kind)}`;
}

const FILENAME_PATTERN = new RegExp(`^(${Object.values(TOUR_ASSET_BASENAMES).join("|")})\\.[a-z0-9]{2,5}$`, "i");

/** Whitelist check for the asset-serving route — matches "<known
 *  kind>.<short alphanumeric extension>" only, so a request can never read
 *  an arbitrary path off disk. */
export function isKnownTourAssetFilename(filename: string): boolean {
  return FILENAME_PATTERN.test(filename);
}

export function contentTypeForFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_CONTENT_TYPES[ext] ?? "application/octet-stream";
}
