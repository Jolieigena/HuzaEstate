import Image from 'next/image';
import type { Listing, ListingStatusCounts } from '@/lib/manager/types';
import { ACTIVITY, REVENUE_TREND } from '@/lib/manager/demoData';
import StatTile from '@/components/charts/StatTile';
import TrendChart from '@/components/charts/TrendChart';
import BarBreakdown from '@/components/charts/BarBreakdown';
import Sparkline from '@/components/charts/Sparkline';

export default function OverviewTab({ LISTINGS, statusCounts, topListings }: {
  LISTINGS: Listing[];
  statusCounts: ListingStatusCounts;
  topListings: Listing[];
}) {
  return (
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
          <TrendChart
            data={REVENUE_TREND.map(d => ({ label: d.month, value: d.value }))}
            format={(v) => `$${v.toLocaleString()}`}
            yMax={6000}
            ariaLabel="Monthly revenue trend, last 6 months"
          />
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
  );
}
