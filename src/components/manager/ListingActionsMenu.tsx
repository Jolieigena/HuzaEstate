import { useEffect, useRef, useState } from 'react';
import type { Listing } from '@/lib/manager/types';
import type { Property } from '@/lib/properties/types';
import type { PropertyStatus } from '@/lib/properties/types';
import { useTourForProperty } from '@/lib/tours/hooks';
import { TourService } from '@/lib/tours/tourService';

export default function ListingActionsMenu({
  listing,
  marketStatus,
  onEdit,
  onDelete,
  onSetMarketStatus,
  onAttachExistingWorld,
}: {
  listing: Listing;
  marketStatus: PropertyStatus;
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
  onSetMarketStatus: (property: Property, status: PropertyStatus) => void;
  onAttachExistingWorld: (property: Property) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const tour = useTourForProperty(listing.property.id);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const isUnpublished = marketStatus === 'unpublished';
  const isRejected = marketStatus === 'rejected';
  const isArchived = marketStatus === 'archived';

  const item = (label: string, onClick: () => void, tone: 'default' | 'danger' = 'default', disabled: boolean = false) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        onClick();
        setOpen(false);
      }}
      className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
        tone === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        aria-label="More actions"
        aria-expanded={open}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 100-4 2 2 0 000 4zm0 6a2 2 0 100-4 2 2 0 000 4zm0 6a2 2 0 100-4 2 2 0 000 4z"></path></svg>
      </button>

      {open && (
        <div className="absolute right-0 bottom-full mb-2 w-52 bg-white rounded-xl border border-slate-100 shadow-lg py-1.5 z-20">
          {item('Edit', () => onEdit(listing.property))}
          
          {tour && (tour.status === 'ready' || tour.status === 'failed') && (
            item('Regenerate 3D Tour', () => { TourService.requestTour(listing.property); })
          )}
          {(!tour || tour.status === 'ready' || tour.status === 'failed') && (
            item('Attach Existing World ID', () => onAttachExistingWorld(listing.property))
          )}

          {!isRejected && item(isUnpublished ? 'Relist to Market' : 'Remove from Market', () => onSetMarketStatus(listing.property, isUnpublished ? 'published' : 'unpublished'))}
          {!isRejected && item(isArchived ? 'Unarchive' : 'Archive', () => onSetMarketStatus(listing.property, isArchived ? 'published' : 'archived'))}
          <div className="border-t border-slate-50 mt-1 pt-1">
            {item('Delete', () => onDelete(listing.property), 'danger')}
          </div>
        </div>
      )}
    </div>
  );
}
