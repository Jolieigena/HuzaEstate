"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import type { Property } from '@/lib/properties/types';
import type { Listing, ManagerTab } from '@/lib/manager/types';
import { toListing } from '@/lib/manager/listings';
import { TourService } from '@/lib/tours/tourService';
import { useAllProperties } from '@/lib/sellerListings/hooks';
import { SellerListingsStoreEngine } from '@/lib/sellerListings/store';
import { PropertyOverridesStoreEngine } from '@/lib/propertyOverrides/store';
import { AdminService } from '@/lib/admin/service';
import type { ListingModerationStatus } from '@/lib/admin/types';
import { useTenantApplications } from '@/lib/tenantApplications/hooks';
import { PageFrame } from '@/components/admin/ui';
import EditPropertyModal from '@/components/EditPropertyModal';
import ConfirmModal from '@/components/shared/ConfirmModal';
import ApplyGate from './ApplyGate';
import ManagerHeader from './ManagerHeader';
import ManagerSidebar from './ManagerSidebar';
import ManagerMobileDrawer from './ManagerMobileDrawer';
import OverviewTab from './OverviewTab';
import ListingsTab from './ListingsTab';
import ApplicationsTab from './ApplicationsTab';
import PaymentsTab from './PaymentsTab';

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState<ManagerTab>('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [listingSearch, setListingSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Listing['status'] | 'all'>('all');
  const [applicationPropertyFilter, setApplicationPropertyFilter] = useState('all');
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deletingProperty, setDeletingProperty] = useState<Property | null>(null);
  const [attachingProperty, setAttachingProperty] = useState<Property | null>(null);
  const [attachWorldId, setAttachWorldId] = useState('');
  const [attachError, setAttachError] = useState<string | null>(null);
  const { isApprovedSeller, account } = useAuth();
  // Every property a seller could manage — mockProperties (all 60-80 of
  // them, not just the 5 hand-curated ones) plus anything posted this
  // session, with saved edits already merged in.
  const allProperties = useAllProperties();
  const applications = useTenantApplications();

  if (!isApprovedSeller) {
    return <ApplyGate />;
  }

  // "Remove from Market" / "Archive" reuse the same admin moderation
  // overlay an administrator's Listings tool writes to (see
  // src/lib/admin/listings.ts) — a listing is either visible to buyers or
  // it isn't, regardless of who took it down, so this keeps one source of
  // truth instead of a second, seller-only visibility flag.
  const handleSetMarketStatus = (property: Property, status: ListingModerationStatus) => {
    const reason =
      status === 'unpublished' ? 'Removed from market by owner' : status === 'archived' ? 'Archived by owner' : 'Relisted by owner';
    AdminService.setListingStatus(property.id, status, account?.id ?? 'seller', account?.name ?? 'Seller', reason);
  };

  const LISTINGS: Listing[] = allProperties.map((property) => toListing(property, applications));
  const propertyTitleById = new Map(allProperties.map((p) => [p.id, p.title]));
  const activeApplications = applications.filter((a) => a.stage !== 'rejected' && a.stage !== 'leased');

  const filteredListings = LISTINGS.filter((l) => {
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchesSearch =
      !listingSearch.trim() || `${l.title} ${l.property.location} ${l.property.city}`.toLowerCase().includes(listingSearch.trim().toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    Active: LISTINGS.filter(l => l.status === 'Active').length,
    Pending: LISTINGS.filter(l => l.status === 'Pending').length,
    Leased: LISTINGS.filter(l => l.status === 'Leased').length,
  };

  const topListings = [...LISTINGS].sort((a, b) => b.views - a.views).slice(0, 4);

  return (
    <div className="min-h-full bg-slate-50 flex flex-col">
      <ManagerHeader onOpenMobileSidebar={() => setMobileOpen(true)} />
      <div className="flex flex-grow min-w-0">
        <ManagerSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          listingCount={LISTINGS.length}
          applicationCount={activeApplications.length}
        />
        <ManagerMobileDrawer
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          listingCount={LISTINGS.length}
          applicationCount={activeApplications.length}
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-grow min-w-0">
          <PageFrame
            title="Property Manager"
            description="Manage your listings, review offers, and track property performance."
          >
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <OverviewTab LISTINGS={LISTINGS} statusCounts={statusCounts} topListings={topListings} />
            )}

            {/* LISTINGS TAB */}
            {activeTab === 'listings' && (
              <ListingsTab
                statusCounts={statusCounts}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                listingSearch={listingSearch}
                setListingSearch={setListingSearch}
                filteredListings={filteredListings}
                setEditingProperty={setEditingProperty}
                setDeletingProperty={setDeletingProperty}
                handleSetMarketStatus={handleSetMarketStatus}
                onAttachExistingWorld={(property) => {
                  setAttachWorldId('');
                  setAttachError(null);
                  setAttachingProperty(property);
                }}
              />
            )}

            {/* APPLICATIONS TAB */}
            {activeTab === 'applications' && (
              <ApplicationsTab
                applications={applications}
                applicationPropertyFilter={applicationPropertyFilter}
                setApplicationPropertyFilter={setApplicationPropertyFilter}
                propertyTitleById={propertyTitleById}
              />
            )}

            {/* PAYMENTS TAB */}
            {activeTab === 'payments' && (
              <PaymentsTab />
            )}
          </PageFrame>
        </main>
      </div>

      <EditPropertyModal property={editingProperty} onClose={() => setEditingProperty(null)} />

      <ConfirmModal
        open={deletingProperty !== null}
        onClose={() => setDeletingProperty(null)}
        onConfirm={() => {
          if (!deletingProperty) return;
          SellerListingsStoreEngine.remove(deletingProperty.id);
          PropertyOverridesStoreEngine.clear(deletingProperty.id);
          setDeletingProperty(null);
        }}
        title="Delete this listing?"
        description={
          <>
            <span className="font-semibold text-slate-700">{deletingProperty?.title}</span> will be removed from HuzaEstate immediately. Buyers will no
            longer be able to view it, and this can&apos;t be undone.
          </>
        }
        confirmLabel="Delete Listing"
        destructive
      />

      <ConfirmModal
        open={attachingProperty !== null}
        onClose={() => setAttachingProperty(null)}
        onConfirm={async () => {
          if (!attachingProperty) return;
          const worldId = attachWorldId.trim();
          if (!worldId) {
            setAttachError('Enter a world ID.');
            return;
          }
          setAttachError(null);
          await TourService.attachExisting(attachingProperty.id, worldId);
          const result = TourService.getForProperty(attachingProperty.id);
          if (result?.status === 'failed') {
            setAttachError(result.error ?? 'Could not attach that world.');
            return;
          }
          setAttachingProperty(null);
        }}
        title="Attach an existing 3D tour"
        description={
          <>
            Link <span className="font-semibold text-slate-700">{attachingProperty?.title}</span> to a world that was already generated on the World Labs
            platform, instead of generating (and paying for) a new one. Open the generation&apos;s{' '}
            <a href="https://platform.worldlabs.ai/generations" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-semibold underline">
              World Labs Generations page
            </a>
            , click &quot;View trace&quot; on the one you want, and copy its <span className="font-semibold text-slate-700">full</span> world ID — the
            &quot;ID&quot; column on the table itself only shows a shortened version and won&apos;t work here.
          </>
        }
        confirmLabel="Attach"
      >
        <input
          type="text"
          value={attachWorldId}
          onChange={(e) => setAttachWorldId(e.target.value)}
          placeholder="e.g. 9cec3b9e-0dfb-4b5a-a660-4082e50d1fff"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300"
        />
        {attachError && <p className="text-xs font-semibold text-red-600 mt-2">{attachError}</p>}
      </ConfirmModal>
    </div>
  );
}
