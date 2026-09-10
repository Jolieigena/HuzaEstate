"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { type Property } from '@/lib/data';
import SellerTourControl from '@/components/SellerTourControl';
import { useAllProperties } from '@/lib/sellerListings/hooks';
import { SellerListingsStoreEngine } from '@/lib/sellerListings/store';
import { PropertyOverridesStoreEngine } from '@/lib/propertyOverrides/store';
import { AdminService } from '@/lib/admin/service';
import { useListingModerationStatus } from '@/lib/admin/listings';
import type { ListingModerationStatus } from '@/lib/admin/types';
import { useTenantApplications } from '@/lib/tenantApplications/hooks';
import { TenantApplicationsStoreEngine, deriveListingStatus } from '@/lib/tenantApplications/store';
import type { TenantApplication, ApplicationStage } from '@/lib/tenantApplications/types';
import { formatRelativeTime } from '@/lib/build/format';
import EditPropertyModal from '@/components/EditPropertyModal';
import ConfirmModal from '@/components/shared/ConfirmModal';

function ApplyGate() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-20">
      <div className="max-w-lg w-full text-center bg-white rounded-3xl border border-slate-100 shadow-sm p-10">
        <div className="w-16 h-16 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-3">Manager Portal is for approved sellers &amp; landlords</h1>
        <p className="text-slate-500 mb-8">Apply to become a HuzaEstate seller or landlord to unlock your listings dashboard, tenant screening, and rent collection tools.</p>
        <Link href="/become-a-seller" className="inline-flex items-center gap-2 bg-slate-900 hover:bg-[#2ec440] text-white font-bold px-8 py-3.5 rounded-xl transition-colors shadow-lg">
          Apply to become a seller
        </Link>
      </div>
    </div>
  );
}

// ---------- Mock data ----------

interface Listing {
  id: string;
  title: string;
  rent: number;
  status: 'Active' | 'Pending' | 'Leased';
  views: number;
  saves: number;
  leads: number;
  image: string;
  trend: number[];
  /** Full source record — SellerTourControl needs more than id/image to
   *  build a good generation prompt (bedrooms, bathrooms, location, ...). */
  property: Property;
  /** Only seller-posted listings (ids always "seller-<uuid>", see
   *  src/lib/sellerListings/store.ts) can be deleted — the curated
   *  mockProperties are static seed data a seller doesn't own. */
  isSellerPosted: boolean;
}

// Keyed to real mockProperties ids (not fabricated ones) so that generating
// a tour here actually shows up when a buyer views that same property at
// /properties/[id] — see PropertyTourSection, which reads tours by
// propertyId from the same shared store.
const LISTING_META: Record<string, Pick<Listing, 'status' | 'views' | 'saves' | 'leads' | 'trend'>> = {
  'prop-1': { status: 'Active', views: 1875, saves: 130, leads: 19, trend: [60, 70, 68, 80, 78, 90, 95, 100, 110, 105, 120, 130] },
  'prop-2': { status: 'Pending', views: 1420, saves: 215, leads: 8, trend: [120, 140, 135, 150, 145, 160, 158, 170, 165, 180, 190, 200] },
  'prop-3': { status: 'Active', views: 1240, saves: 84, leads: 12, trend: [40, 55, 42, 60, 58, 70, 65, 80, 75, 90, 95, 110] },
  'prop-4': { status: 'Active', views: 610, saves: 28, leads: 5, trend: [20, 25, 22, 30, 28, 35, 33, 40, 42, 45, 48, 52] },
  'prop-5': { status: 'Leased', views: 940, saves: 42, leads: 0, trend: [80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 28] },
};

// Any listed property without hand-authored stats (i.e. everything outside
// the 5 curated ids above) still needs to be manageable — it just gets
// sensible zeroed/default performance numbers instead of fabricated ones.
const DEFAULT_META: Pick<Listing, 'status' | 'views' | 'saves' | 'leads' | 'trend'> = {
  status: 'Active',
  views: 0,
  saves: 0,
  leads: 0,
  trend: [0, 0],
};

function toListing(property: Property, applications: TenantApplication[]): Listing {
  const meta = LISTING_META[property.id] ?? DEFAULT_META;
  // A real tenant application decides Pending/Leased when there is one —
  // the hardcoded/default meta status is only ever the fallback for a
  // property nothing has been applied to yet.
  const status = deriveListingStatus(property.id, applications) ?? meta.status;
  return {
    id: property.id,
    title: property.title,
    rent: property.price,
    image: property.imageUrl,
    property,
    isSellerPosted: property.id.startsWith('seller-'),
    ...meta,
    status,
  };
}

const REVENUE_TREND = [
  { month: 'Apr', value: 3400 },
  { month: 'May', value: 3900 },
  { month: 'Jun', value: 4100 },
  { month: 'Jul', value: 3950 },
  { month: 'Aug', value: 4350 },
  { month: 'Sep', value: 4700 },
];

const ACTIVITY = [
  { id: 1, text: 'New lead on Downtown Loft', time: '2 hours ago', symbol: '★', bg: 'bg-blue-100 text-blue-600' },
  { id: 2, text: 'Rent payment received — Apt 4B', time: 'Today', symbol: '✓', bg: 'bg-green-100 text-green-600' },
  { id: 3, text: 'Alex Thompson approved as tenant', time: 'Yesterday', symbol: '✓', bg: 'bg-green-100 text-green-600' },
  { id: 4, text: 'Luxury Villa with Pool marked Pending', time: '2 days ago', symbol: '•', bg: 'bg-yellow-100 text-yellow-600' },
  { id: 5, text: 'Downtown Loft passed 1,800 views', time: '3 days ago', symbol: '↑', bg: 'bg-blue-100 text-blue-600' },
];

const STATUS_BADGE: Record<Listing['status'], string> = {
  Active: 'bg-green-100 text-green-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Leased: 'bg-slate-100 text-slate-500',
};

const SERIES_COLOR = '#2563eb';

// ---------- Small building-block components ----------

function Sparkline({ data, color = SERIES_COLOR, width = 72, height = 28 }: { data: number[]; color?: string; width?: number; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data.map((v, i) => `${i * stepX},${height - ((v - min) / range) * height}`).join(' ');
  const lastX = (data.length - 1) * stepX;
  const lastY = height - ((data[data.length - 1] - min) / range) * height;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="flex-shrink-0" aria-hidden="true">
      <polyline points={points} fill="none" stroke="#c3c2b7" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r="3" fill={color} stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}

function StatTile({
  label,
  value,
  delta,
  deltaDirection,
  sparkline,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: 'up' | 'down';
  sparkline?: number[];
}) {
  const deltaColor = deltaDirection === 'up' ? 'text-[#0ca30c]' : deltaDirection === 'down' ? 'text-[#d03b3b]' : 'text-slate-500';
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
      <div className="text-sm font-semibold text-slate-500">{label}</div>
      <div className="flex items-end justify-between gap-4">
        <div className="text-3xl font-black text-slate-900 tracking-tight">{value}</div>
        {sparkline && <Sparkline data={sparkline} />}
      </div>
      {delta && (
        <div className={`text-xs font-bold ${deltaColor} flex items-center gap-1`}>
          {deltaDirection === 'up' && <span aria-hidden="true">↑</span>}
          {deltaDirection === 'down' && <span aria-hidden="true">↓</span>}
          {delta}
        </div>
      )}
    </div>
  );
}

interface BarBreakdownItem {
  label: string;
  value: number;
  color: string;
}

function BarBreakdown({ items, format }: { items: BarBreakdownItem[]; format?: (v: number) => string }) {
  const max = Math.max(...items.map(i => i.value), 1);
  const total = items.reduce((sum, i) => sum + i.value, 0);
  return (
    <div className="flex flex-col gap-4">
      {items.map(item => {
        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return (
          <div key={item.label} className="-mx-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                <span className="text-sm font-semibold text-slate-700">{item.label}</span>
              </div>
              <span className="text-sm font-bold text-slate-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {format ? format(item.value) : item.value}
                <span className="text-slate-400 font-medium"> ({pct}%)</span>
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const MARKET_STATUS_BADGE: Partial<Record<ListingModerationStatus, string>> = {
  unpublished: 'Off Market',
  archived: 'Archived',
};

function ListingActionsMenu({
  listing,
  marketStatus,
  onEdit,
  onDelete,
  onSetMarketStatus,
}: {
  listing: Listing;
  marketStatus: ListingModerationStatus;
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
  onSetMarketStatus: (property: Property, status: ListingModerationStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const isUnpublished = marketStatus === 'unpublished';
  const isArchived = marketStatus === 'archived';

  const item = (label: string, onClick: () => void, tone: 'default' | 'danger' = 'default') => (
    <button
      type="button"
      onClick={() => {
        onClick();
        setOpen(false);
      }}
      className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors ${
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
          {item(listing.status === 'Leased' ? 'Relist' : 'Edit', () => onEdit(listing.property))}
          {item(isUnpublished ? 'Relist to Market' : 'Remove from Market', () => onSetMarketStatus(listing.property, isUnpublished ? 'published' : 'unpublished'))}
          {item(isArchived ? 'Unarchive' : 'Archive', () => onSetMarketStatus(listing.property, isArchived ? 'published' : 'archived'))}
          {listing.isSellerPosted && (
            <div className="border-t border-slate-50 mt-1 pt-1">
              {item('Delete', () => onDelete(listing.property), 'danger')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ApplicationCard({
  application,
  propertyTitle,
  onAdvance,
  onReject,
}: {
  application: TenantApplication;
  propertyTitle: string;
  onAdvance: (id: string, next: ApplicationStage) => void;
  onReject: (id: string) => void;
}) {
  const accentClass =
    application.stage === 'screening' ? 'border-l-4 border-l-yellow-400' : application.stage === 'approved' ? 'border-l-4 border-l-[#2ec440]' : '';

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border border-slate-200 ${accentClass}`}>
      <div className="flex justify-between items-start mb-1 gap-2">
        <div className="font-bold text-slate-900">{application.applicantName}</div>
        <span className="text-xs font-bold text-slate-500 whitespace-nowrap">{formatRelativeTime(application.appliedAt)}</span>
      </div>
      <div className="text-xs text-slate-500 mb-2 truncate">{propertyTitle}</div>

      {application.stage === 'screening' && (
        <div className="flex items-center gap-2 text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded mb-3">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Awaiting background check
        </div>
      )}

      {application.incomeLabel && (
        <div className="text-xs text-slate-600 mb-1">Income: <span className="font-semibold text-green-600">{application.incomeLabel}</span></div>
      )}
      {application.creditScore && (
        <div className={`text-xs text-slate-600 ${application.stage === 'approved' ? 'mb-4' : 'mb-3'}`}>
          Credit: <span className={`font-semibold ${application.stage === 'approved' ? 'text-green-600' : ''}`}>{application.creditScore}</span>
        </div>
      )}

      {application.stage === 'new' && (
        <div className="flex gap-2">
          <button onClick={() => onAdvance(application.id, 'screening')} className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold py-1.5 rounded-lg text-xs transition-colors">
            Screen
          </button>
          <button onClick={() => onReject(application.id)} className="px-3 text-slate-400 hover:text-red-600 font-semibold text-xs transition-colors">
            Reject
          </button>
        </div>
      )}

      {application.stage === 'screening' && (
        <div className="flex gap-2">
          <button onClick={() => onAdvance(application.id, 'approved')} className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 font-semibold py-1.5 rounded-lg text-xs transition-colors">
            Approve
          </button>
          <button onClick={() => onReject(application.id)} className="px-3 text-slate-400 hover:text-red-600 font-semibold text-xs transition-colors">
            Reject
          </button>
        </div>
      )}

      {application.stage === 'approved' && (
        <button
          onClick={() => onAdvance(application.id, 'leased')}
          className="w-full bg-[#2ec440] hover:bg-[#28b039] text-white font-semibold py-2 rounded-lg text-xs transition-colors shadow-sm"
        >
          Send Lease Agreement
        </button>
      )}
    </div>
  );
}

function ListingCard({
  listing,
  onEdit,
  onDelete,
  onSetMarketStatus,
}: {
  listing: Listing;
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
  onSetMarketStatus: (property: Property, status: ListingModerationStatus) => void;
}) {
  const isLeased = listing.status === 'Leased';
  const marketStatus = useListingModerationStatus(listing.id);
  const marketBadge = MARKET_STATUS_BADGE[marketStatus];
  const isOffMarket = marketStatus !== 'published';

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow ${isOffMarket ? 'opacity-75' : ''}`}>
      <div className={`relative w-full h-36 ${isLeased || isOffMarket ? 'opacity-50 grayscale' : ''}`}>
        <Image src={listing.image} alt={listing.title} fill className="object-cover" />
        <span className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-md shadow-sm ${STATUS_BADGE[listing.status]}`}>
          {listing.status}
        </span>
        {marketBadge && (
          <span className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-md shadow-sm bg-slate-900/80 text-white">
            {marketBadge}
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col gap-4">
        <div>
          <div className={`font-bold leading-snug ${isLeased ? 'text-slate-400' : 'text-slate-900'}`}>{listing.title}</div>
          <div className={`text-xs mt-0.5 ${isLeased ? 'text-slate-400' : 'text-slate-500'}`}>${listing.rent.toLocaleString()}/mo</div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <div>
              <div className={`font-bold ${isLeased ? 'text-slate-400' : 'text-slate-700'}`}>{listing.views.toLocaleString()}</div>
              <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Views</div>
            </div>
            <div>
              <div className={`font-bold ${isLeased ? 'text-slate-400' : 'text-slate-700'}`}>{listing.saves}</div>
              <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Saves</div>
            </div>
            <div>
              <div className={`font-bold ${isLeased ? 'text-slate-400' : 'text-blue-600'}`}>{listing.leads}</div>
              <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Leads</div>
            </div>
          </div>
          <Sparkline data={listing.trend} color={isLeased ? '#94a3b8' : SERIES_COLOR} />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
          <SellerTourControl property={listing.property} />
          <ListingActionsMenu listing={listing} marketStatus={marketStatus} onEdit={onEdit} onDelete={onDelete} onSetMarketStatus={onSetMarketStatus} />
        </div>
      </div>
    </div>
  );
}

const CHART_W = 680;
const CHART_H = 260;
const MARGIN = { top: 20, right: 20, bottom: 30, left: 56 };
const PLOT_W = CHART_W - MARGIN.left - MARGIN.right;
const PLOT_H = CHART_H - MARGIN.top - MARGIN.bottom;
const Y_MAX = 6000;
const Y_TICKS = [0, 2000, 4000, 6000];

function RevenueTrendChart() {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const stepX = PLOT_W / (REVENUE_TREND.length - 1);
  const xAt = (i: number) => MARGIN.left + i * stepX;
  const yAt = (v: number) => MARGIN.top + PLOT_H - (v / Y_MAX) * PLOT_H;

  const linePoints = REVENUE_TREND.map((d, i) => `${xAt(i)},${yAt(d.value)}`).join(' ');
  const areaPoints = `${MARGIN.left},${MARGIN.top + PLOT_H} ${linePoints} ${xAt(REVENUE_TREND.length - 1)},${MARGIN.top + PLOT_H}`;

  const lastIndex = REVENUE_TREND.length - 1;
  const lastX = xAt(lastIndex);
  const lastY = yAt(REVENUE_TREND[lastIndex].value);

  const handlePointerMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = CHART_W / rect.width;
    const xInViewBox = (e.clientX - rect.left) * ratio;
    const clamped = Math.min(Math.max(xInViewBox, MARGIN.left), MARGIN.left + PLOT_W);
    const idx = Math.round((clamped - MARGIN.left) / stepX);
    setHoverIndex(idx);
  };

  const hovered = hoverIndex !== null ? REVENUE_TREND[hoverIndex] : null;
  const hoverX = hoverIndex !== null ? xAt(hoverIndex) : 0;
  const hoverY = hoverIndex !== null ? yAt(REVENUE_TREND[hoverIndex].value) : 0;

  return (
    <div className="relative w-full" style={{ aspectRatio: `${CHART_W} / ${CHART_H}` }}>
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full h-full" role="img" aria-label="Monthly revenue trend, last 6 months">
        {Y_TICKS.map(tick => (
          <g key={tick}>
            <line x1={MARGIN.left} x2={CHART_W - MARGIN.right} y1={yAt(tick)} y2={yAt(tick)} stroke="#e1e0d9" strokeWidth="1" />
            <text x={MARGIN.left - 10} y={yAt(tick) + 4} textAnchor="end" fill="#898781" fontSize="11" fontWeight="600">
              ${tick.toLocaleString()}
            </text>
          </g>
        ))}

        <polygon points={areaPoints} fill={SERIES_COLOR} opacity="0.1" />
        <polyline points={linePoints} fill="none" stroke={SERIES_COLOR} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {REVENUE_TREND.map((d, i) => (
          <text key={d.month} x={xAt(i)} y={CHART_H - 8} textAnchor="middle" fill="#898781" fontSize="11" fontWeight="600">
            {d.month}
          </text>
        ))}

        <circle cx={lastX} cy={lastY} r="5" fill={SERIES_COLOR} stroke="#fff" strokeWidth="2" />
        <text x={lastX - 10} y={lastY - 12} textAnchor="end" fill="#0b0b0b" fontSize="13" fontWeight="800">
          ${REVENUE_TREND[lastIndex].value.toLocaleString()}
        </text>

        {hoverIndex !== null && (
          <>
            <line x1={hoverX} x2={hoverX} y1={MARGIN.top} y2={MARGIN.top + PLOT_H} stroke="#c3c2b7" strokeWidth="1" />
            <circle cx={hoverX} cy={hoverY} r="6" fill={SERIES_COLOR} stroke="#fff" strokeWidth="2" />
          </>
        )}

        <rect
          x={MARGIN.left}
          y={MARGIN.top}
          width={PLOT_W}
          height={PLOT_H}
          fill="transparent"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverIndex(null)}
        />
      </svg>

      {hovered && (
        <div
          className="absolute pointer-events-none bg-slate-900 text-white text-xs font-semibold rounded-lg px-3 py-2 shadow-lg whitespace-nowrap z-10"
          style={{
            left: `${(hoverX / CHART_W) * 100}%`,
            top: `${(hoverY / CHART_H) * 100}%`,
            transform: 'translate(-50%, calc(-100% - 12px))',
          }}
        >
          <div className="text-slate-300 font-medium">{hovered.month}</div>
          <div>${hovered.value.toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}

const NAV_ITEMS: { id: 'overview' | 'listings' | 'applications' | 'payments'; label: string; iconPath: string; badge?: number; badgeTone?: 'default' | 'alert' }[] = [
  {
    id: 'overview',
    label: 'Overview',
    iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    id: 'listings',
    label: 'My Listings',
    iconPath: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m3-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
  {
    id: 'applications',
    label: 'Applications',
    iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    badge: 4,
    badgeTone: 'alert',
  },
  {
    id: 'payments',
    label: 'Payments',
    iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
];

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'applications' | 'payments'>('overview');
  const [listingSearch, setListingSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Listing['status'] | 'all'>('all');
  const [applicationPropertyFilter, setApplicationPropertyFilter] = useState('all');
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deletingProperty, setDeletingProperty] = useState<Property | null>(null);
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
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">

        {/* Dashboard Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">Landlord Mode</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">Rental Manager</h1>
            <p className="text-slate-500 font-medium">Manage your listings, screen tenants, and collect rent.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/post-property" className="bg-slate-900 hover:bg-[#2ec440] text-white font-semibold py-2.5 px-6 rounded-xl transition-colors shadow-sm text-sm">
              + Add Property
            </Link>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">

          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-28 flex flex-col gap-2">
              <nav className="flex flex-col gap-2">
                {NAV_ITEMS.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all ${
                      activeTab === item.id ? 'bg-blue-600/10 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.iconPath}></path></svg>
                      {item.label}
                    </div>
                    {(item.badge !== undefined || item.id === 'listings' || item.id === 'applications') && (
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full shadow-sm ${
                          item.badgeTone === 'alert' ? 'bg-red-500 text-white' : 'bg-white text-slate-900 border border-slate-100'
                        }`}
                      >
                        {item.id === 'listings' ? LISTINGS.length : item.id === 'applications' ? activeApplications.length : item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-grow min-w-0">

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="flex flex-col gap-6">
                {/* KPI Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                  <StatTile
                    label="Monthly Revenue"
                    value="$4,700"
                    delta="+8% vs last month"
                    deltaDirection="up"
                    sparkline={REVENUE_TREND.map(d => d.value)}
                  />
                  <StatTile label="Occupancy Rate" value="82%" delta="+4 pts vs last month" deltaDirection="up" sparkline={[70, 72, 75, 74, 78, 82]} />
                  <StatTile label="Active Leads" value="34" delta="+6 this week" deltaDirection="up" sparkline={[18, 20, 22, 21, 28, 34]} />
                  <StatTile label="Avg. Days to Lease" value="18 days" delta="3 days faster" deltaDirection="up" sparkline={[26, 24, 23, 21, 19, 18]} />
                </div>

                {/* Revenue chart + status breakdown */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
                    <div className="mb-6">
                      <h3 className="font-bold text-slate-900 text-lg">Revenue Trend</h3>
                      <p className="text-sm text-slate-500">Last 6 months</p>
                    </div>
                    <RevenueTrendChart />
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
                    <h3 className="font-bold text-slate-900 text-lg mb-1">Portfolio Status</h3>
                    <p className="text-sm text-slate-500 mb-6">{LISTINGS.length} total listings</p>
                    <BarBreakdown
                      items={[
                        { label: 'Active', value: statusCounts.Active, color: '#0ca30c' },
                        { label: 'Pending', value: statusCounts.Pending, color: '#fab219' },
                        { label: 'Leased', value: statusCounts.Leased, color: '#94a3b8' },
                      ]}
                    />
                  </div>
                </div>

                {/* Top performing + activity */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 md:p-8 pb-4">
                      <h3 className="font-bold text-slate-900 text-lg mb-1">Top Performing Listings</h3>
                      <p className="text-sm text-slate-500">Ranked by views this month</p>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {topListings.map(listing => (
                        <div key={listing.id} className="flex items-center gap-4 px-6 md:px-8 py-4">
                          <div className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0">
                            <Image src={listing.image} alt={listing.title} fill className="object-cover" />
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="font-bold text-slate-900 truncate">{listing.title}</div>
                            <div className="text-xs text-slate-500">{listing.views.toLocaleString()} views · {listing.leads} leads</div>
                          </div>
                          <Sparkline data={listing.trend} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
                    <h3 className="font-bold text-slate-900 text-lg mb-6">Recent Activity</h3>
                    <div className="flex flex-col gap-5">
                      {ACTIVITY.map(item => (
                        <div key={item.id} className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${item.bg}`}>
                            {item.symbol}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{item.text}</div>
                            <div className="text-xs text-slate-400">{item.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LISTINGS TAB */}
            {activeTab === 'listings' && (
              <div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {([
                    { status: 'Active' as const, label: 'Active', count: statusCounts.Active, labelColor: 'text-green-700', ring: 'ring-green-500/30' },
                    { status: 'Pending' as const, label: 'Pending', count: statusCounts.Pending, labelColor: 'text-yellow-700', ring: 'ring-yellow-500/30' },
                    { status: 'Leased' as const, label: 'Leased', count: statusCounts.Leased, labelColor: 'text-slate-500', ring: 'ring-slate-400/30' },
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
                      <ListingCard key={listing.id} listing={listing} onEdit={setEditingProperty} onDelete={setDeletingProperty} onSetMarketStatus={handleSetMarketStatus} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm py-16 px-6 text-center text-slate-400 text-sm">
                    No listings match &ldquo;{listingSearch}&rdquo;.
                  </div>
                )}
              </div>
            )}

            {/* APPLICATIONS TAB */}
            {activeTab === 'applications' && (
              <div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">New</div>
                    <div className="text-2xl font-black text-slate-900">{applications.filter((a) => a.stage === 'new').length}</div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className="text-xs font-bold text-yellow-700 uppercase tracking-wide mb-1">Screening</div>
                    <div className="text-2xl font-black text-slate-900">{applications.filter((a) => a.stage === 'screening').length}</div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">Approved</div>
                    <div className="text-2xl font-black text-slate-900">{applications.filter((a) => a.stage === 'approved').length}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Tenant Screening</h2>
                  <select
                    value={applicationPropertyFilter}
                    onChange={(e) => setApplicationPropertyFilter(e.target.value)}
                    className="bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="all">All Properties</option>
                    {Array.from(new Set(applications.map((a) => a.propertyId))).map((propertyId) => (
                      <option key={propertyId} value={propertyId}>
                        {propertyTitleById.get(propertyId) ?? propertyId}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kanban Board */}
                <div className="grid md:grid-cols-3 gap-6 overflow-x-auto pb-4">
                  {(['new', 'screening', 'approved'] as const).map((stage) => {
                    const stageApplications = applications.filter(
                      (a) => a.stage === stage && (applicationPropertyFilter === 'all' || a.propertyId === applicationPropertyFilter)
                    );
                    const columnLabel = stage === 'new' ? 'New' : stage === 'screening' ? 'Screening' : 'Approved';
                    return (
                      <div key={stage} className="bg-slate-100 rounded-2xl p-4 min-w-[280px]">
                        <div className="flex items-center justify-between mb-4 px-2">
                          <h3 className="font-bold text-slate-700">{columnLabel} ({stageApplications.length})</h3>
                        </div>
                        <div className="flex flex-col gap-3">
                          {stageApplications.map((application) => (
                            <ApplicationCard
                              key={application.id}
                              application={application}
                              propertyTitle={propertyTitleById.get(application.propertyId) ?? 'Unknown property'}
                              onAdvance={(id, next) => TenantApplicationsStoreEngine.setStage(id, next)}
                              onReject={(id) => TenantApplicationsStoreEngine.setStage(id, 'rejected')}
                            />
                          ))}
                          {stageApplications.length === 0 && (
                            <div className="text-xs text-slate-400 text-center py-6">No applications here.</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PAYMENTS TAB */}
            {activeTab === 'payments' && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <div className="text-sm font-semibold text-slate-500 mb-1">Total Collected</div>
                    <div className="text-2xl font-black text-slate-900">$4,700</div>
                    <div className="text-xs font-bold text-[#2ec440] mt-2">↑ +8% this month</div>
                  </div>
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <div className="text-sm font-semibold text-slate-500 mb-1">Outstanding</div>
                    <div className="text-2xl font-black text-red-500">$1,200</div>
                    <div className="text-xs font-bold text-red-500 mt-2">1 tenant late</div>
                  </div>
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm md:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm font-semibold text-slate-500">Next Payout</div>
                      <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-1 rounded">Nov 1st</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 mb-2">$3,500</div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-slate-900">Recent Transactions</h3>
                      <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">Download CSV</button>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">✓</div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">Rent Payment - Apt 4B</div>
                            <div className="text-xs text-slate-500">Jane Doe • Today</div>
                          </div>
                        </div>
                        <div className="font-black text-slate-900">+$1,200</div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">✓</div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">Security Deposit - Villa</div>
                            <div className="text-xs text-slate-500">Alex Thompson • Yesterday</div>
                          </div>
                        </div>
                        <div className="font-black text-slate-900">+$3,500</div>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-red-100 bg-red-50 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">!</div>
                          <div>
                            <div className="font-bold text-red-900 text-sm">Overdue Rent - Eco Home</div>
                            <div className="text-xs text-red-600">Mark Smith • 3 days late</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <button className="text-xs font-bold text-red-600 bg-white border border-red-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-red-50">Send Reminder</button>
                          <div className="font-black text-red-600">-$850</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-900 text-lg mb-1">Collections Breakdown</h3>
                    <p className="text-sm text-slate-500 mb-6">This billing cycle</p>
                    <BarBreakdown
                      format={(v) => `$${v.toLocaleString()}`}
                      items={[
                        { label: 'Collected', value: 4700, color: '#0ca30c' },
                        { label: 'Upcoming', value: 3500, color: SERIES_COLOR },
                        { label: 'Outstanding', value: 1200, color: '#d03b3b' },
                      ]}
                    />
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
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
    </div>
  );
}
