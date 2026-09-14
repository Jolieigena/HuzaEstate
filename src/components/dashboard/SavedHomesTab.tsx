import { savedProperties } from '@/lib/dashboard/demoData';
import SavedHomeCard from './SavedHomeCard';

export default function SavedHomesTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Saved Homes</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-500">Sort by:</span>
          <select className="bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20">
            <option>Recently Added</option>
            <option>Price (High to Low)</option>
            <option>Price (Low to High)</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {savedProperties.map(property => (
          <SavedHomeCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
}
