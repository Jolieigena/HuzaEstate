// Pictures inside a project are kept in the browser as data: addresses. On their way to the account each one is swapped for "asset:<sha256>" and sent
// once, separately; on the way back the references are turned into data: addresses again, so the Build and Renovate screens never see a difference.

export const MAX_ASSET_BYTES = 700 * 1024;
const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"];
const DATA_URL = /^data:([^;,]+)((?:;[^;,]+)*),([\s\S]*)$/;
const ASSET_REF = /^asset:([0-9a-f]{64})$/;

export interface OutgoingAsset {
  hash: string;
  mime: string;
  base64: string;
}

export interface Externalised {
  data: unknown;
  assets: OutgoingAsset[];
}

function bytesFromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** A picture that is too big for the account is redrawn smaller (still a JPEG) until it fits. Null when it cannot be done. */
async function shrink(dataUrl: string): Promise<string | null> {
  const image = await new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
  if (!image) return null;
  for (const [side, quality] of [[1600, 0.8], [1280, 0.75], [1024, 0.7], [800, 0.65]] as const) {
    const scale = Math.min(1, side / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
    const out = canvas.toDataURL("image/jpeg", quality);
    const match = DATA_URL.exec(out);
    if (match && (match[3].length * 3) / 4 <= MAX_ASSET_BYTES) return out;
  }
  return null;
}

/**
 * A copy of the project's JSON with every picture replaced by an asset reference, plus the pictures to send. The project itself is not changed.
 * Pictures that cannot be saved (a type the account does not take, or one that cannot be made small enough) and session-only blob: addresses
 * become empty text in the copy.
 */
export async function externalise(project: unknown): Promise<Externalised> {
  const assets = new Map<string, OutgoingAsset>();
  const cache = new Map<string, string>();

  async function convert(value: string): Promise<string> {
    if (value.startsWith("blob:")) return "";
    if (!value.startsWith("data:")) return value;
    const known = cache.get(value);
    if (known !== undefined) return known;
    let url = value;
    let match = DATA_URL.exec(url);
    let result = "";
    if (match && ALLOWED_MIMES.includes(match[1]) && match[2].includes(";base64")) {
      if ((match[3].length * 3) / 4 > MAX_ASSET_BYTES) {
        const smaller = await shrink(url);
        url = smaller ?? "";
        match = smaller ? DATA_URL.exec(smaller) : null;
      }
      if (match) {
        const bytes = bytesFromBase64(match[3]);
        const hash = await sha256Hex(bytes);
        if (!assets.has(hash)) assets.set(hash, { hash, mime: match[1], base64: match[3] });
        result = `asset:${hash}`;
      }
    }
    cache.set(value, result);
    return result;
  }

  async function walk(node: unknown): Promise<unknown> {
    if (typeof node === "string") return convert(node);
    if (Array.isArray(node)) return Promise.all(node.map(walk));
    if (node && typeof node === "object") {
      const entries = await Promise.all(Object.entries(node as Record<string, unknown>).map(async ([k, v]) => [k, await walk(v)] as const));
      return Object.fromEntries(entries);
    }
    return node;
  }

  return { data: await walk(project), assets: Array.from(assets.values()) };
}

/** Every asset reference a project's JSON holds. */
export function referencedAssets(data: unknown): string[] {
  const found = new Set<string>();
  (function visit(node: unknown) {
    if (typeof node === "string") {
      const match = ASSET_REF.exec(node);
      if (match) found.add(match[1]);
    } else if (Array.isArray(node)) node.forEach(visit);
    else if (node && typeof node === "object") Object.values(node as Record<string, unknown>).forEach(visit);
  })(data);
  return Array.from(found);
}

/** The project's JSON with every asset reference turned back into a data: address, using `lookup` to fetch each picture. Null if one cannot be had. */
export async function internalise<T>(data: unknown, lookup: (hash: string) => Promise<string | null>): Promise<T | null> {
  const urls = new Map<string, string>();
  for (const hash of referencedAssets(data)) {
    const url = await lookup(hash);
    if (url === null) return null;
    urls.set(hash, url);
  }
  return (function swap(node: unknown): unknown {
    if (typeof node === "string") {
      const match = ASSET_REF.exec(node);
      return match ? urls.get(match[1]) ?? node : node;
    }
    if (Array.isArray(node)) return node.map(swap);
    if (node && typeof node === "object") return Object.fromEntries(Object.entries(node as Record<string, unknown>).map(([k, v]) => [k, swap(v)]));
    return node;
  })(data) as T;
}

export const toDataUrl = (mime: string, base64: string) => `data:${mime};base64,${base64}`;
