import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { TourRecord } from "../types";
import type { TourRepository } from "./types";

// DEVELOPMENT-ONLY FALLBACK — same caveat as
// src/lib/tours/assetStorage/localFs.ts: this writes to the local
// filesystem, which most serverless hosts (Vercel included) reset between
// invocations/deploys, so it is NOT durable in production.
//
// It is still a real improvement over the old architecture though: this
// lives on the SERVER, not in a visitor's browser, so — for as long as this
// server process's filesystem persists — any browser or device asking this
// server for a property's tour sees the same record. Browser localStorage
// could never do that; a tour generated on one device would only ever be
// visible on that same device/browser. A real deployment should replace
// this with a proper database (Postgres/Supabase/Vercel KV/etc.) by writing
// a new TourRepository implementation and switching the resolver in
// index.ts — no other file needs to change.
const RECORDS_DIR = path.join(process.cwd(), ".tour-records");

function recordPath(propertyId: string): string {
  // propertyId is always one of our own generated ids (prop-N / seller-<uuid>),
  // never free-text user input, so this can't be used for path traversal.
  return path.join(RECORDS_DIR, `${propertyId}.json`);
}

export const fileTourRepository: TourRepository = {
  id: "file_repository",

  async get(propertyId) {
    try {
      const raw = await readFile(recordPath(propertyId), "utf-8");
      return JSON.parse(raw) as TourRecord;
    } catch {
      return null;
    }
  },

  async set(propertyId, record) {
    await mkdir(RECORDS_DIR, { recursive: true });
    await writeFile(recordPath(propertyId), JSON.stringify(record, null, 2), "utf-8");
  },
};
