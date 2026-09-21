const TABS: { id: string; label: string }[] = [
  { id: 'saved', label: 'Saved Homes' },
  { id: 'properties', label: 'Portfolio' },
  { id: 'insights', label: 'Market Insights' },
  { id: 'payments', label: 'Payments' },
  { id: 'tours', label: 'Tours' },
  { id: 'applications', label: 'Applications' },
  { id: 'coshopping', label: 'Co-Shopping' },
];

/** The dashboard had no visible tab switcher at all — DashboardContent.tsx
 *  only read `?tab=` from the URL, so every tab besides the default "Saved
 *  Homes" was reachable only by typing the query string. This makes all of
 *  them clickable. */
export default function DashboardTabs({ activeTab, goToTab }: { activeTab: string; goToTab: (tab: string) => void }) {
  return (
    <nav aria-label="Dashboard sections" className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 border-b border-slate-200">
      {TABS.map(tab => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => goToTab(tab.id)}
            aria-current={active ? 'page' : undefined}
            className={`whitespace-nowrap px-4 py-2.5 rounded-full text-sm font-semibold transition-colors ${
              active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
