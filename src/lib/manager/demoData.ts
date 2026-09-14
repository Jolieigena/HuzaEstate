import type { Listing } from './types';

// Keyed to real mockProperties ids (not fabricated ones) so that generating
// a tour here actually shows up when a buyer views that same property at
// /properties/[id] — see PropertyTourSection, which reads tours by
// propertyId from the same shared store.
export const LISTING_META: Record<string, Pick<Listing, 'status' | 'views' | 'saves' | 'leads' | 'trend'>> = {
  'prop-1': { status: 'Active', views: 1875, saves: 130, leads: 19, trend: [60, 70, 68, 80, 78, 90, 95, 100, 110, 105, 120, 130] },
  'prop-2': { status: 'Pending', views: 1420, saves: 215, leads: 8, trend: [120, 140, 135, 150, 145, 160, 158, 170, 165, 180, 190, 200] },
  'prop-3': { status: 'Active', views: 1240, saves: 84, leads: 12, trend: [40, 55, 42, 60, 58, 70, 65, 80, 75, 90, 95, 110] },
  'prop-4': { status: 'Active', views: 610, saves: 28, leads: 5, trend: [20, 25, 22, 30, 28, 35, 33, 40, 42, 45, 48, 52] },
  'prop-5': { status: 'Leased', views: 940, saves: 42, leads: 0, trend: [80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 28] },
};

// Any listed property without hand-authored stats (i.e. everything outside
// the 5 curated ids above) still needs to be manageable — it just gets
// sensible zeroed/default performance numbers instead of fabricated ones.
export const DEFAULT_META: Pick<Listing, 'status' | 'views' | 'saves' | 'leads' | 'trend'> = {
  status: 'Active',
  views: 0,
  saves: 0,
  leads: 0,
  trend: [0, 0],
};

export const REVENUE_TREND = [
  { month: 'Apr', value: 3400 },
  { month: 'May', value: 3900 },
  { month: 'Jun', value: 4100 },
  { month: 'Jul', value: 3950 },
  { month: 'Aug', value: 4350 },
  { month: 'Sep', value: 4700 },
];

export const ACTIVITY = [
  { id: 1, text: 'New lead on Downtown Loft', time: '2 hours ago', symbol: '★', bg: 'bg-blue-100 text-blue-600' },
  { id: 2, text: 'Rent payment received — Apt 4B', time: 'Today', symbol: '✓', bg: 'bg-green-100 text-green-600' },
  { id: 3, text: 'Alex Thompson approved as tenant', time: 'Yesterday', symbol: '✓', bg: 'bg-green-100 text-green-600' },
  { id: 4, text: 'Luxury Villa with Pool marked Pending', time: '2 days ago', symbol: '•', bg: 'bg-yellow-100 text-yellow-600' },
  { id: 5, text: 'Downtown Loft passed 1,800 views', time: '3 days ago', symbol: '↑', bg: 'bg-blue-100 text-blue-600' },
];
