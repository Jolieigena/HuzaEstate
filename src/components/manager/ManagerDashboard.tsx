"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import type { Property, PropertyStatus } from '@/lib/properties/types';
import { PropertyApi, type Inquiry } from '@/lib/properties/api';
import type { Listing, ManagerTab } from '@/lib/manager/types';
import { useToast } from '@/lib/toast-context';
import { toListing } from '@/lib/manager/listings';
import { TourService } from '@/lib/tours/tourService';
import { useMyProperties, notifyPropertiesChanged } from '@/lib/sellerListings/hooks';
import { PageFrame } from '@/components/admin/ui';
import EditPropertyModal from '@/components/EditPropertyModal';
import ConfirmModal from '@/components/shared/ConfirmModal';
import ApplyGate from './ApplyGate';
import ManagerHeader from './ManagerHeader';
import ManagerSidebar from './ManagerSidebar';
import ManagerMobileDrawer from './ManagerMobileDrawer';
import OverviewTab from './OverviewTab';
import ListingsTab from './ListingsTab';
import InquiriesTab from './InquiriesTab';
import MarketInsightsTab from './MarketInsightsTab';
import LandlordProfileTab from './LandlordProfileTab';

const PROPERTY_API_URL = process.env.NEXT_PUBLIC_PROPERTY_API_URL || 'http://localhost:8081/api/property-service';

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState<ManagerTab>('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [listingSearch, setListingSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Listing['status'] | 'all'>('all');
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deletingProperty, setDeletingProperty] = useState<Property | null>(null);
  const [attachingProperty, setAttachingProperty] = useState<Property | null>(null);
  const [attachWorldId, setAttachWorldId] = useState('');
  const [attachError, setAttachError] = useState<string | null>(null);
  const { isApprovedSeller, token } = useAuth();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { showToast } = useToast();
  const { properties: myProperties } = useMyProperties();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inquiryVersion, setInquiryVersion] = useState(0);

  useEffect(() => {
    if (!token || !isApprovedSeller) return;
    let cancelled = false;
    PropertyApi.myInquiries(token).then((result) => {
      if (!cancelled && result.ok) setInquiries(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [token, isApprovedSeller, inquiryVersion]);

  if (!isApprovedSeller) {
    return <ApplyGate />;
  }

  // Visibility changes go to property-service, so buyers see them immediately and an
  // administrator's decisions can't be undone from another browser.
  const handleSetMarketStatus = async (property: Property, status: PropertyStatus) => {
    if (!token) return;
    const result = await PropertyApi.setStatus(token, property.id, status);
    if (result.ok) {
      notifyPropertiesChanged();
      showToast(status === 'published' ? 'Listing is live again.' : status === 'archived' ? 'Listing archived.' : 'Listing removed from the market.');
    } else {
      showToast(result.error, 'error');
    }
  };

  const openInquiries = inquiries.filter((inquiry) => inquiry.status !== 'closed');
  const leadsByProperty = new Map<string, number>();
  for (const inquiry of inquiries) leadsByProperty.set(inquiry.propertyId, (leadsByProperty.get(inquiry.propertyId) ?? 0) + 1);

  const LISTINGS: Listing[] = myProperties.map((property) => ({ ...toListing(property), leads: leadsByProperty.get(property.id) ?? 0 }));

  const filteredListings = LISTINGS.filter((l) => {
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchesSearch =
      !listingSearch.trim() || `${l.title} ${l.property.location} ${l.property.city}`.toLowerCase().includes(listingSearch.trim().toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    Live: LISTINGS.filter(l => l.status === 'Live').length,
    'Off market': LISTINGS.filter(l => l.status === 'Off market').length,
    'Needs attention': LISTINGS.filter(l => l.status === 'Needs attention').length,
    Expired: LISTINGS.filter(l => l.status === 'Expired').length,
  };

  const topListings = [...LISTINGS].sort((a, b) => b.leads - a.leads).slice(0, 4);

  return (
    <div className="min-h-full bg-slate-50 flex flex-col">
      <ManagerHeader onOpenMobileSidebar={() => setMobileOpen(true)} />
      <div className="flex flex-grow min-w-0">
        <ManagerSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          listingCount={LISTINGS.length}
          inquiryCount={openInquiries.length}
        />
        <ManagerMobileDrawer
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          listingCount={LISTINGS.length}
          inquiryCount={openInquiries.length}
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-grow min-w-0">
          <PageFrame
            title="Property Manager"
            description="Manage your listings and answer buyer and renter inquiries."
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

            {/* INQUIRIES TAB */}
            {activeTab === 'inquiries' && (
              <InquiriesTab inquiries={inquiries} onChanged={() => setInquiryVersion((v) => v + 1)} />
            )}

            {/* MARKET INSIGHTS TAB */}
            {activeTab === 'insights' && (
              <MarketInsightsTab LISTINGS={LISTINGS} />
            )}

            {/* LANDLORD PROFILE TAB */}
            {activeTab === 'profile' && (
              <LandlordProfileTab />
            )}
          </PageFrame>
        </main>
      </div>

      <EditPropertyModal property={editingProperty} onClose={() => setEditingProperty(null)} />

      <ConfirmModal
        open={deletingProperty !== null}
        onClose={() => { setDeletingProperty(null); setDeleteError(null); }}
        onConfirm={async () => {
          if (!deletingProperty) return;
          if (token) {
            try {
              const res = await fetch(`${PROPERTY_API_URL}/properties/${deletingProperty.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!res.ok) {
                const data = await res.json().catch(() => null);
                setDeleteError(data?.message || 'Could not delete this listing. Please try again.');
                return;
              }
            } catch {
              setDeleteError('Could not reach the server. Please try again.');
              return;
            }
          }
          notifyPropertiesChanged();
          setDeletingProperty(null);
          setDeleteError(null);
        }}
        title="Delete this listing?"
        description={
          <>
            {deleteError ? (
              <span className="text-red-600 font-semibold">{deleteError}</span>
            ) : (
              <>
                <span className="font-semibold text-slate-700">{deletingProperty?.title}</span> will be removed from HuzaEstate immediately. Buyers will no
                longer be able to view it, and this can&apos;t be undone.
              </>
            )}
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
