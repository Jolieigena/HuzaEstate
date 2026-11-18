export interface SavedSearchCriteria {
  searchTerm: string;
  filterType: string;
  propertyTypeFilter: string;
  /** The kinds of home chosen as the four buckets (house, apartment, land, commercial), for matching on the server. Absent on searches saved before alerts existed; it is worked out from propertyTypeFilter then. */
  propertyTypes?: string[];
  minPrice: string;
  maxPrice: string;
  bedsFilter: string;
  bathsFilter: string;
  minSqm: string;
  maxSqm: string;
  city: string;
  keywords: string;
}

export interface SavedSearch {
  id: string;
  label: string;
  criteria: SavedSearchCriteria;
  createdAt: string;
  /** Whether the person is told when a new listing matches. Only signed-in accounts can have it on. */
  alerts?: boolean;
  /** The currency the min and max price were typed in. */
  priceCurrency?: string;
  /** True once the account on the server holds this search (so one deleted on another device can be dropped here, and one saved while signed out is sent up). */
  synced?: boolean;
}
