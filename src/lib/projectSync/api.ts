// The calls to the account's saved Build and Renovate projects (access-service /projects).

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/access-service";

export type ProjectKind = "build" | "renovate";

export interface RemoteProject {
  id: string;
  updatedAt: string;
  deleted: boolean;
  deletedAt?: string;
  data: unknown;
}

export type PutOutcome =
  | { ok: true }
  | { ok: false; reason: "newer_on_server"; server: { updatedAt: string; data: unknown } }
  | { ok: false; reason: "deleted"; deletedAt?: string }
  | { ok: false; reason: "missing_assets"; missing: string[] }
  | { ok: false; reason: "limit" | "storage_full" | "too_large"; message: string }
  | { ok: false; reason: "failed"; message: string };

const headers = (token: string) => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json", "x-huza-client": "web" });

async function readBody(res: Response): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function listRemote(token: string, kind: ProjectKind): Promise<RemoteProject[] | null> {
  try {
    const res = await fetch(`${API_URL}/projects/${kind}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    return ((await res.json()).projects as RemoteProject[]) ?? [];
  } catch {
    return null;
  }
}

export async function putRemote(token: string, kind: ProjectKind, id: string, data: unknown, updatedAt: string): Promise<PutOutcome> {
  try {
    const res = await fetch(`${API_URL}/projects/${kind}/${encodeURIComponent(id)}`, { method: "PUT", headers: headers(token), body: JSON.stringify({ data, updatedAt }) });
    if (res.ok) return { ok: true };
    const body = await readBody(res);
    const message = typeof body.message === "string" ? body.message : "Could not save to your account.";
    if (res.status === 409) {
      const reason = body.reason;
      if (reason === "newer_on_server") return { ok: false, reason, server: body.server as { updatedAt: string; data: unknown } };
      if (reason === "deleted") return { ok: false, reason, deletedAt: body.deletedAt as string | undefined };
      if (reason === "missing_assets") return { ok: false, reason, missing: (body.missing as string[]) ?? [] };
      if (reason === "limit" || reason === "storage_full") return { ok: false, reason, message };
    }
    if (res.status === 413) return { ok: false, reason: "too_large", message };
    return { ok: false, reason: "failed", message };
  } catch {
    return { ok: false, reason: "failed", message: "No connection." };
  }
}

export async function deleteRemote(token: string, kind: ProjectKind, id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/projects/${kind}/${encodeURIComponent(id)}`, { method: "DELETE", headers: headers(token) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function missingRemoteAssets(token: string, hashes: string[]): Promise<string[] | null> {
  if (hashes.length === 0) return [];
  try {
    const res = await fetch(`${API_URL}/projects/assets/missing`, { method: "POST", headers: headers(token), body: JSON.stringify({ hashes }) });
    if (!res.ok) return null;
    return ((await res.json()).missing as string[]) ?? [];
  } catch {
    return null;
  }
}

export async function putRemoteAsset(token: string, hash: string, mime: string, base64: string): Promise<{ ok: true } | { ok: false; reason: "storage_full" | "failed"; message: string }> {
  try {
    const res = await fetch(`${API_URL}/projects/assets/${hash}`, { method: "PUT", headers: headers(token), body: JSON.stringify({ mime, data: base64 }) });
    if (res.ok) return { ok: true };
    const body = await readBody(res);
    const message = typeof body.message === "string" ? body.message : "Could not save a picture to your account.";
    return { ok: false, reason: body.reason === "storage_full" ? "storage_full" : "failed", message };
  } catch {
    return { ok: false, reason: "failed", message: "No connection." };
  }
}

export async function getRemoteAsset(token: string, hash: string): Promise<{ mime: string; data: string } | null> {
  try {
    const res = await fetch(`${API_URL}/projects/assets/${hash}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    return (await res.json()) as { mime: string; data: string };
  } catch {
    return null;
  }
}
