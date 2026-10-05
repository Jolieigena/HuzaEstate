import type { Listing, ListingStatus, ListingStatusCounts } from '@/lib/manager/types';
import type { Property } from '@/lib/properties/types';

// In the order a listing moves through them, so the card reads as a pipeline.
const STATUS_ROWS: { status: ListingStatus; color: string }[] = [
  { status: 'Draft', color: '#94a3b8' },
  { status: 'Under Review', color: '#3b82f6' },
  { status: 'Live', color: '#0ca30c' },
  { status: 'Off market', color: '#64748b' },
  { status: 'Needs attention', color: '#d03b3b' },
  { status: 'Expired', color: '#fab219' },
];

const TYPE_ROWS: { type: Property['propertyType'] | 'unspecified'; label: string }[] = [
  { type: 'apartment', label: 'Apartments' },
  { type: 'house', label: 'Houses' },
  { type: 'land', label: 'Land' },
  // A draft can be saved before a type is chosen.
  { type: 'unspecified', label: 'Type not set' },
];

function Row({ label, count, total, color, detail, onClick }: { label: string; count: number; total: number; color: string; detail?: string; onClick?: () => void }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const content = (
    <>
      <div className="flex items-center justify-between mb-1.5 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <span className="text-sm font-semibold text-slate-700">{label}</span>
          {detail && <span className="text-xs text-slate-400 truncate">{detail}</span>}
        </div>
        <span className="text-sm font-bold text-slate-900 flex-shrink-0" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {count}
          <span className="text-slate-400 font-medium"> ({pct}%)</span>
        </span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </>
  );
  const className = '-mx-2 px-2 py-1.5 rounded-lg block w-full text-left';
  return onClick ? (
    <button type="button" onClick={onClick} className={`${className} hover:bg-slate-50 transition-colors`} title={`Show ${label.toLowerCase()} listings`}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}

/** The owner's whole portfolio at a glance: how many listings of each kind (apartments, houses,
 *  land), and where every one of them sits in the posting pipeline. Both breakdowns add up to the
 *  total, and each status row opens My Listings filtered to that status. */
export default function PortfolioOverview({ listings, statusCounts, onOpenListings }: {
  listings: Listing[];
  statusCounts: ListingStatusCounts;
  onOpenListings: (status: ListingStatus | 'all') => void;
}) {
  const total = listings.length;

  const types = TYPE_ROWS.map(({ type, label }) => {
    const matching = listings.filter((l) => (l.property.propertyType ?? 'unspecified') === type);
    const forSale = matching.filter((l) => l.property.type === 'sale').length;
    const forRent = matching.filter((l) => l.property.type === 'rent').length;
    const parts = [forSale ? `${forSale} for sale` : '', forRent ? `${forRent} for rent` : ''].filter(Boolean);
    return { type, label, count: matching.length, detail: parts.join(' · ') };
  }).filter((row) => row.count > 0);

  const statuses = STATUS_ROWS.filter((row) => statusCounts[row.status] > 0);
  const needsAttention = statusCounts['Needs attention'];

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
      <h3 className="font-bold text-slate-900 text-lg mb-1">Portfolio Overview</h3>
      <p className="text-sm text-slate-500 mb-6">
        {total} total {total === 1 ? 'listing' : 'listings'}
      </p>

      {total === 0 ? (
        <p className="text-sm text-slate-500">Your listings will be broken down by type and status here once you post one.</p>
      ) : (
        <div className="flex flex-col gap-7">
          <section aria-label="Listings by type">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">By type</h4>
            <div className="flex flex-col gap-2">
              {types.map((row) => (
                <Row key={row.type} label={row.label} count={row.count} total={total} color="#334155" detail={row.detail} />
              ))}
            </div>
          </section>

          <section aria-label="Listings by status">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">By status</h4>
            <div className="flex flex-col gap-2">
              {statuses.map((row) => (
                <Row key={row.status} label={row.status} count={statusCounts[row.status]} total={total} color={row.color} onClick={() => onOpenListings(row.status)} />
              ))}
            </div>
            {needsAttention > 0 && (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                A moderator asked for changes to, or rejected, {needsAttention} {needsAttention === 1 ? 'listing' : 'listings'}.{' '}
                <button type="button" onClick={() => onOpenListings('Needs attention')} className="font-bold underline">
                  See what they said
                </button>
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
