export interface SavedSearchCriteria {
  searchTerm: string;
  filterType: string;
  propertyTypeFilter: string;
  minPrice: string;
  maxPrice: string;
  bedsFilter: string;
  minSqm: string;
  maxSqm: string;
}

export interface SavedSearch {
  id: string;
  label: string;
  criteria: SavedSearchCriteria;
  createdAt: string;
}
