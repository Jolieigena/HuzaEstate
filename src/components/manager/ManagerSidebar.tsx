import type { ManagerTab } from '@/lib/manager/types';

const NAV_ITEMS: { id: ManagerTab; label: string; iconPath: string; badge?: number; badgeTone?: 'default' | 'alert' }[] = [
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

export default function ManagerSidebar({ activeTab, setActiveTab, listingCount, applicationCount }: {
  activeTab: ManagerTab;
  setActiveTab: (tab: ManagerTab) => void;
  listingCount: number;
  applicationCount: number;
}) {
  return (
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
                  {item.id === 'listings' ? listingCount : item.id === 'applications' ? applicationCount : item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
