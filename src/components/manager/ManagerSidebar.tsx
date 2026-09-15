import type { ManagerTab } from '@/lib/manager/types';

const NAV_ITEMS: { id: ManagerTab; label: string; iconPath: string }[] = [
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
    label: 'Offers & Inquiries',
    iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    id: 'payments',
    label: 'Payments',
    iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
];

interface ManagerNavLinksProps {
  activeTab: ManagerTab;
  setActiveTab: (tab: ManagerTab) => void;
  listingCount: number;
  applicationCount: number;
}

/** Same nav-item structure/styling as AdminNavLinks — these are buttons switching an
 *  internal tab (not routes, since Manager Portal doesn't have sub-pages), but they
 *  should look identical to every other dashboard-style nav in the app. Exported
 *  separately so the mobile drawer can reuse it, matching AdminSidebar's pattern. */
export function ManagerNavLinks({ activeTab, setActiveTab, listingCount, applicationCount }: ManagerNavLinksProps) {
  const countFor = (id: ManagerTab) => (id === 'listings' ? listingCount : id === 'applications' ? applicationCount : undefined);

  return (
    <nav aria-label="Manager navigation" className="flex flex-col gap-1 px-2">
      {NAV_ITEMS.map((item) => {
        const active = activeTab === item.id;
        const count = countFor(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            aria-current={active ? "page" : undefined}
            className={`flex items-center justify-between gap-3 px-3 py-3 rounded-xl font-semibold transition-all text-left ${active ? "bg-[#2ec440]/10 text-[#2ec440]" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
          >
            <span className="flex items-center gap-3 min-w-0">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.iconPath} />
              </svg>
              <span className="truncate">{item.label}</span>
            </span>
            {count !== undefined && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${active ? "bg-[#2ec440] text-white" : "bg-slate-200 text-slate-600"}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

/** Desktop manager sidebar — same sticky full-height rail as AdminSidebar. */
export default function ManagerSidebar(props: ManagerNavLinksProps) {
  return (
    <aside className="hidden lg:flex flex-col flex-shrink-0 border-r border-slate-100 bg-white sticky top-[65px] h-[calc(100vh-65px)] w-64">
      <div className="flex-grow overflow-y-auto py-4">
        <ManagerNavLinks {...props} />
      </div>
    </aside>
  );
}
