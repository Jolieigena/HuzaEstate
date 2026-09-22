export interface SavedSearchCriteria {
  searchTerm: string;
  filterType: string;
  propertyTypeFilter: string;
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
}
