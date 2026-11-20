// Keeps one kind of project (Build or Renovate) in step between this browser and the signed-in account.
//
// The screens keep working on the browser's own copy, exactly as before. This engine watches that copy and
//  - sends every new or changed project to the account a moment after the change, and every deletion too,
//  - on sign-in (and when the tab comes back after a while) pulls the account's projects and merges them in: the latest change to a project wins,
//  - never deletes anything it has not been told was deleted: a project the account does not have is sent up, not dropped.
// What it has already sent is remembered in the browser (the "registry": project id -> the updatedAt the account holds), so a change is
// recognised as a change and a project that is gone locally is recognised as a deletion.

import { externalise, internalise, toDataUrl } from "./assets";
import { deleteRemote, getRemoteAsset, listRemote, missingRemoteAssets, putRemote, putRemoteAsset, type ProjectKind } from "./api";

export interface SyncedProject {
  id: string;
  updatedAt: string;
}

export interface ProjectStore<T extends SyncedProject> {
  getSnapshot(): T[];
  replaceAll(list: T[]): void;
  subscribe(listener: () => void): () => void;
}

interface Registry {
  accountId: string | null;
  synced: Record<string, string>;
  /** Projects the app itself saw removed here that the account has not been told about yet. Only these are ever deleted from the account: a project that is merely missing here (unreadable or cleared storage) is brought back, never deleted. */
  deleted: Record<string, true>;
}

const MAX_PROJECT_JSON_BYTES = 800 * 1024;
const PUSH_DELAY_MS = 1500;
const RETRY_MS = 30 * 1000;

const ts = (value: string | undefined): number => Date.parse(value ?? "") || 0;

export class ProjectSyncEngine<T extends SyncedProject> {
  private token: string | null = null;
  private unsubscribe: (() => void) | null = null;
  private pushTimer: ReturnType<typeof setTimeout> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private flushing = false;
  private dirty = false;
  private applying = false;
  private blocked = new Map<string, string>();
  private reported = new Set<string>();
  private assetCache = new Map<string, string>();
  private registry: Registry = { accountId: null, synced: {}, deleted: {} };
  private lastIds: Set<string> = new Set();

  constructor(private kind: ProjectKind, private store: ProjectStore<T>, private onProblem: (message: string) => void) {}

  private get registryKey() {
    return `huzaestate_project_sync_v1_${this.kind}`;
  }

  private loadRegistry() {
    try {
      const raw = JSON.parse(window.localStorage.getItem(this.registryKey) || "null");
      this.registry = raw && typeof raw === "object" && raw.synced && typeof raw.synced === "object" ? { accountId: raw.accountId ?? null, synced: raw.synced, deleted: raw.deleted && typeof raw.deleted === "object" ? raw.deleted : {} } : { accountId: null, synced: {}, deleted: {} };
    } catch {
      this.registry = { accountId: null, synced: {}, deleted: {} };
    }
  }

  private saveRegistry() {
    try {
      window.localStorage.setItem(this.registryKey, JSON.stringify(this.registry));
    } catch {
      // Without it, the next sign-in simply compares everything again.
    }
  }

  private apply(list: T[]) {
    this.applying = true;
    try {
      this.store.replaceAll(list);
    } finally {
      this.applying = false;
    }
    this.lastIds = new Set(this.store.getSnapshot().map((p) => p.id));
  }

  /** Called when the app changed the list: a project that was synced and has now gone was removed on purpose, and is queued for deletion from the account. */
  private noteRemovals() {
    const current = new Set(this.store.getSnapshot().map((p) => p.id));
    let changed = false;
    for (const id of this.lastIds) {
      if (!current.has(id) && id in this.registry.synced && !this.registry.deleted[id]) {
        this.registry.deleted[id] = true;
        changed = true;
      }
    }
    this.lastIds = current;
    if (changed) this.saveRegistry();
  }

  private report(message: string) {
    if (this.reported.has(message)) return;
    this.reported.add(message);
    this.onProblem(message);
  }

  /** For a visitor who is not signed in: the projects that are safely on the account are removed from this browser, so the next person does not see them. Projects with changes not yet sent stay. */
  cleanupForSignedOut() {
    this.loadRegistry();
    if (!this.registry.accountId) return;
    const local = this.store.getSnapshot();
    const keep = local.filter((p) => this.registry.synced[p.id] !== p.updatedAt);
    for (const p of local) if (this.registry.synced[p.id] === p.updatedAt) delete this.registry.synced[p.id];
    this.saveRegistry();
    if (keep.length !== local.length) this.apply(keep);
  }

  async start(accountId: string, token: string): Promise<void> {
    this.stop();
    this.token = token;
    this.loadRegistry();
    if (this.registry.accountId && this.registry.accountId !== accountId) {
      // These projects belong to the account that used this browser before: they are on that account, so they are removed here.
      const local = this.store.getSnapshot();
      this.apply(local.filter((p) => !(p.id in this.registry.synced)));
      this.registry = { accountId, synced: {}, deleted: {} };
    } else {
      this.registry.accountId = accountId;
    }
    this.saveRegistry();
    this.lastIds = new Set(this.store.getSnapshot().map((p) => p.id));
    this.unsubscribe = this.store.subscribe(() => {
      if (this.applying) return;
      this.noteRemovals();
      this.schedule();
    });
    await this.pull();
    await this.flush();
  }

  stop() {
    this.unsubscribe?.();
    this.unsubscribe = null;
    if (this.pushTimer) clearTimeout(this.pushTimer);
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.pushTimer = this.retryTimer = null;
    this.token = null;
  }

  /** Looks at the account again (for when the tab comes back), then sends anything waiting. */
  async refresh(): Promise<void> {
    if (!this.token) return;
    await this.pull();
    await this.flush();
  }

  private schedule(delay = PUSH_DELAY_MS) {
    if (!this.token) return;
    if (this.pushTimer) clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => void this.flush(), delay);
  }

  private async lookup(hash: string): Promise<string | null> {
    const cached = this.assetCache.get(hash);
    if (cached) return cached;
    if (!this.token) return null;
    const asset = await getRemoteAsset(this.token, hash);
    if (!asset) return null;
    const url = toDataUrl(asset.mime, asset.data);
    this.assetCache.set(hash, url);
    return url;
  }

  private hydrate(data: unknown): Promise<T | null> {
    return internalise<T>(data, (hash) => this.lookup(hash));
  }

  /** Brings the account's projects into this browser. */
  private async pull(): Promise<void> {
    const token = this.token;
    if (!token) return;
    const remote = await listRemote(token, this.kind);
    if (!remote || this.token !== token) return;
    let next = [...this.store.getSnapshot()];
    let changed = false;
    for (const r of remote) {
      const local = next.find((p) => p.id === r.id);
      if (r.deleted) {
        // Deleted elsewhere: it goes here too, unless it was changed here after that.
        if (local && ts(local.updatedAt) <= ts(r.deletedAt)) {
          next = next.filter((p) => p.id !== r.id);
          delete this.registry.synced[r.id];
          changed = true;
        }
        delete this.registry.deleted[r.id];
        continue;
      }
      // Removed here on purpose and the account not told yet: it stays removed (the next flush sends the deletion), unless it was edited elsewhere
      // after that, in which case the edit wins and it comes back. A project that is merely missing here, with no recorded removal, is restored.
      if (!local && this.registry.deleted[r.id]) {
        if (ts(r.updatedAt) > ts(this.registry.synced[r.id])) delete this.registry.deleted[r.id];
        else continue;
      }
      if (!local || ts(r.updatedAt) > ts(local.updatedAt)) {
        const project = await this.hydrate(r.data);
        if (!project) continue; // its pictures could not be fetched this time; tried again next time
        project.updatedAt = r.updatedAt;
        next = local ? next.map((p) => (p.id === r.id ? project : p)) : [project, ...next];
        this.registry.synced[r.id] = r.updatedAt;
        changed = true;
      } else if (ts(r.updatedAt) === ts(local.updatedAt)) {
        this.registry.synced[r.id] = r.updatedAt;
      }
      // A local project newer than the account's is left as it is: the next flush sends it.
    }
    this.saveRegistry();
    if (changed && this.token === token) this.apply(next);
  }

  /** Sends what has changed since the last time, and what has been deleted. */
  async flush(): Promise<void> {
    if (!this.token) return;
    if (this.flushing) {
      this.dirty = true;
      return;
    }
    this.flushing = true;
    try {
      do {
        this.dirty = false;
        await this.flushOnce();
      } while (this.dirty && this.token);
    } finally {
      this.flushing = false;
    }
  }

  private async flushOnce(): Promise<void> {
    const token = this.token;
    if (!token) return;
    let retry = false;
    const local = this.store.getSnapshot();
    const localIds = new Set(local.map((p) => p.id));

    for (const id of Object.keys(this.registry.deleted)) {
      if (localIds.has(id)) {
        delete this.registry.deleted[id]; // it came back, so there is nothing to delete
        this.saveRegistry();
        continue;
      }
      if (await deleteRemote(token, this.kind, id)) {
        delete this.registry.deleted[id];
        delete this.registry.synced[id];
        this.saveRegistry();
      } else retry = true;
    }

    for (const project of local) {
      if (!this.token) return;
      if (this.registry.synced[project.id] === project.updatedAt) continue;
      if (this.blocked.get(project.id) === project.updatedAt) continue;
      if ((await this.push(token, project)) === "retry") retry = true;
    }
    if (retry && this.token) {
      if (this.retryTimer) clearTimeout(this.retryTimer);
      this.retryTimer = setTimeout(() => void this.flush(), RETRY_MS);
    }
  }

  private async uploadAssets(token: string, assets: { hash: string; mime: string; base64: string }[]): Promise<"ok" | "retry" | "blocked"> {
    const missing = await missingRemoteAssets(token, assets.map((a) => a.hash));
    if (missing === null) return "retry";
    for (const asset of assets.filter((a) => missing.includes(a.hash))) {
      const res = await putRemoteAsset(token, asset.hash, asset.mime, asset.base64);
      if (!res.ok) {
        if (res.reason === "storage_full") {
          this.report(res.message);
          return "blocked";
        }
        return "retry";
      }
    }
    return "ok";
  }

  private async push(token: string, project: T): Promise<"done" | "retry" | "blocked"> {
    let sent;
    try {
      sent = await externalise(project);
    } catch {
      return "retry";
    }
    if (new TextEncoder().encode(JSON.stringify(sent.data)).length > MAX_PROJECT_JSON_BYTES) {
      this.report("This project is too large to save to your account.");
      this.blocked.set(project.id, project.updatedAt);
      return "blocked";
    }
    const uploaded = await this.uploadAssets(token, sent.assets);
    if (uploaded === "retry") return "retry";
    if (uploaded === "blocked") {
      this.blocked.set(project.id, project.updatedAt);
      return "blocked";
    }

    let outcome = await putRemote(token, this.kind, project.id, sent.data, project.updatedAt);
    if (!outcome.ok && outcome.reason === "missing_assets") {
      // A picture was removed from the account in the meantime: send them all again, once.
      for (const asset of sent.assets) await putRemoteAsset(token, asset.hash, asset.mime, asset.base64);
      outcome = await putRemote(token, this.kind, project.id, sent.data, project.updatedAt);
    }
    if (outcome.ok) {
      const stored = outcome.updatedAt;
      if (stored && stored !== project.updatedAt) {
        // The account recorded an earlier time (this device's clock runs ahead). Adopt it, so edits made on other devices are picked up here instead of
        // looking older than this one forever.
        const current = this.store.getSnapshot().find((p) => p.id === project.id);
        if (current && current.updatedAt === project.updatedAt) this.apply(this.store.getSnapshot().map((p) => (p.id === project.id ? { ...p, updatedAt: stored } : p)));
        this.registry.synced[project.id] = stored;
      } else {
        this.registry.synced[project.id] = project.updatedAt;
      }
      this.saveRegistry();
      return "done";
    }
    switch (outcome.reason) {
      case "newer_on_server": {
        const newer = await this.hydrate(outcome.server.data);
        if (!newer) return "retry";
        newer.updatedAt = outcome.server.updatedAt;
        this.apply(this.store.getSnapshot().map((p) => (p.id === project.id ? newer : p)));
        this.registry.synced[project.id] = outcome.server.updatedAt;
        this.saveRegistry();
        return "done";
      }
      case "deleted":
        this.apply(this.store.getSnapshot().filter((p) => p.id !== project.id));
        delete this.registry.synced[project.id];
        this.saveRegistry();
        return "done";
      case "limit":
      case "storage_full":
      case "too_large":
        this.report(outcome.message);
        this.blocked.set(project.id, project.updatedAt);
        return "blocked";
      default:
        return "retry";
    }
  }
}
