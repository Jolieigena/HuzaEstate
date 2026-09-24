import type { Property, PropertyStatus } from '@/lib/properties/types';
import type { Listing, ListingStatusCounts, ListingStatusFilter } from '@/lib/manager/types';
import ListingCard from './ListingCard';

export default function ListingsTab({ statusCounts, statusFilter, setStatusFilter, listingSearch, setListingSearch, filteredListings, setEditingProperty, setDeletingProperty, handleSetMarketStatus, onAttachExistingWorld }: {
  statusCounts: ListingStatusCounts;
  statusFilter: ListingStatusFilter;
  setStatusFilter: (status: ListingStatusFilter) => void;
  listingSearch: string;
  setListingSearch: (search: string) => void;
  filteredListings: Listing[];
  setEditingProperty: (property: Property) => void;
  setDeletingProperty: (property: Property) => void;
  handleSetMarketStatus: (property: Property, status: PropertyStatus) => void;
  onAttachExistingWorld: (property: Property) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {([
          { status: 'Live' as const, label: 'Live', count: statusCounts.Live, labelColor: 'text-green-700', ring: 'ring-green-500/30' },
          { status: 'Off market' as const, label: 'Off market', count: statusCounts['Off market'], labelColor: 'text-slate-500', ring: 'ring-slate-400/30' },
          { status: 'Needs attention' as const, label: 'Needs attention', count: statusCounts['Needs attention'], labelColor: 'text-red-700', ring: 'ring-red-500/30' },
          { status: 'Expired' as const, label: 'Expired', count: statusCounts.Expired, labelColor: 'text-yellow-700', ring: 'ring-yellow-500/30' },
        ]).map((tile) => {
          const isActive = statusFilter === tile.status;
          return (
            <button
              key={tile.status}
              type="button"
              onClick={() => setStatusFilter(isActive ? 'all' : tile.status)}
              className={`text-left bg-white rounded-2xl border shadow-sm p-5 transition-all hover:-translate-y-0.5 ${
                isActive ? `border-transparent ring-2 ${tile.ring}` : 'border-slate-100'
              }`}
            >
              <div className={`text-xs font-bold uppercase tracking-wide mb-1 ${tile.labelColor}`}>{tile.label}</div>
              <div className="text-2xl font-black text-slate-900">{tile.count}</div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-900">{statusFilter === 'all' ? 'All Listings' : `${statusFilter} Listings`}</h2>
          {statusFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors"
            >
              Clear filter
            </button>
          )}
        </div>
        <div className="relative w-full sm:w-72">
          <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input
            type="text"
            value={listingSearch}
            onChange={(e) => setListingSearch(e.target.value)}
            placeholder="Search all listings by title or location…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
          />
        </div>
      </div>

      {filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onEdit={setEditingProperty}
              onDelete={setDeletingProperty}
              onSetMarketStatus={handleSetMarketStatus}
              onAttachExistingWorld={onAttachExistingWorld}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm py-16 px-6 text-center text-slate-400 text-sm">
          {listingSearch.trim() || statusFilter !== 'all' ? <>No listings match your filters.</> : <>You haven&apos;t posted any listings yet.</>}
        </div>
      )}
    </div>
  );
}
