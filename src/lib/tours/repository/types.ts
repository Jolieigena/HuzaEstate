import type { TourRecord } from "../types";

// Server-only — never import from client code.
export interface TourRepository {
  readonly id: string;
  get(propertyId: string): Promise<TourRecord | null>;
  set(propertyId: string, record: TourRecord): Promise<void>;
}
