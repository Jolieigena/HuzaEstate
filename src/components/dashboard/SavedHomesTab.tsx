import PropertyCard from '@/components/PropertyCard';
import { useAllProperties } from '@/lib/sellerListings/hooks';
import { useFavoriteProperties } from '@/lib/favorites/hooks';

export default function SavedHomesTab() {
  const allProperties = useAllProperties();
  const savedProperties = useFavoriteProperties(allProperties);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Saved Homes</h2>
      </div>

      {savedProperties.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-2">No saved homes yet</h3>
          <p className="text-slate-500 text-sm">Tap the heart icon on any listing to save it here.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {savedProperties.map(property => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
