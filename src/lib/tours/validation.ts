/** IDs become storage path segments, so validate them independently of UI callers. */
export function isValidPropertyId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9][a-z0-9_-]{0,127}$/i.test(value)
    && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(value);
}

export function assertPropertyId(propertyId: string): void {
  if (!isValidPropertyId(propertyId)) throw new Error("Invalid propertyId.");
}
