import { imageForUpload } from "@/lib/imageUpload";

const PROPERTY_API_URL = process.env.NEXT_PUBLIC_PROPERTY_API_URL || "http://localhost:8081/api/property-service";

/** What an application can carry: a degree or certificate, a business registration, proof of work, an ID. */
export type DocumentKind = "qualification" | "work" | "business" | "id";

export interface VerificationDocument {
  kind: DocumentKind;
  /** The file's name as the person knew it, so the reviewer sees what it is. */
  name: string;
  /** Where it is kept (private). Never an address anyone can open. */
  key: string;
}

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const MAX_DOCUMENTS_PER_KIND = 4;
export const DOCUMENT_ACCEPT = "application/pdf,image/*";

/** A reason the file cannot be sent, or null when it can. */
export function documentProblem(file: File): string | null {
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  const isImage = file.type.startsWith("image/");
  if (!isPdf && !isImage) return "Send a PDF or a photo.";
  if (isPdf && file.size > MAX_DOCUMENT_BYTES) return "That PDF is larger than 10 MB.";
  return null;
}

/** Sends one document to private storage and returns it ready to be put in the application. A photo is turned into a JPEG first (phone formats too). */
export async function uploadVerificationDocument(file: File, kind: DocumentKind, token: string): Promise<VerificationDocument> {
  let blob: Blob = file;
  let contentType = "application/pdf";
  if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) ({ blob, contentType } = await imageForUpload(file));
  const slot = await fetch(`${PROPERTY_API_URL}/media/private-upload-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ contentType }),
  });
  if (!slot.ok) {
    const data = await slot.json().catch(() => null);
    throw new Error(data?.message || "Could not prepare the upload.");
  }
  const { uploadUrl, key } = await slot.json();
  const put = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: blob });
  if (!put.ok) throw new Error("Upload failed. Please try again.");
  return { kind, name: file.name.slice(0, 80), key: key as string };
}

/** Administrators: opens a document in a new tab through a link that works for ten minutes. */
export async function openVerificationDocument(key: string, token: string): Promise<string | null> {
  // The tab is opened first, in answer to the click, so the browser does not block it while the link is fetched.
  const tab = window.open("", "_blank");
  try {
    const res = await fetch(`${PROPERTY_API_URL}/media/private-url?key=${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.url) throw new Error(data?.message || "Could not open the document.");
    if (tab) tab.location.href = data.url;
    else window.location.href = data.url;
    return null;
  } catch (error) {
    tab?.close();
    return error instanceof Error ? error.message : "Could not open the document.";
  }
}
