import path from "node:path";
import { assertPropertyId } from "./validation";

export function resolveTourStoragePath(root: string, propertyId: string, filename?: string): string {
  assertPropertyId(propertyId);
  const directory = path.resolve(root);
  const target = filename === undefined
    ? path.resolve(directory, `${propertyId}.json`)
    : path.resolve(directory, propertyId, filename);
  const relative = path.relative(directory, target);
  if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error("Tour storage path must stay inside its storage directory.");
  }
  return target;
}
