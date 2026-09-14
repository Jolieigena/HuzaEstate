import Image from 'next/image';
import Link from 'next/link';
import type { SavedHome } from '@/lib/dashboard/types';

export default function SavedHomeCard({ property }: { property: SavedHome }) {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
      <div className="relative h-56 overflow-hidden">
        <Image src={property.image} alt={property.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider text-slate-900">
          {property.status}
        </div>
        <button className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-white hover:scale-110 transition-all shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <div className="p-6">
        <div className="text-2xl font-black text-slate-900 mb-1">{property.price}</div>
        <div className="text-sm font-semibold text-slate-500 mb-3">{property.specs}</div>
        <h3 className="text-lg font-bold text-slate-900 mb-1 truncate">{property.title}</h3>
        <p className="text-sm text-slate-500 flex items-center gap-1 mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path></svg>
          {property.location}
        </p>
        <Link href={`/properties/${property.id}`} className="block text-center w-full bg-white border border-slate-200 hover:border-[#2ec440] hover:bg-[#2ec440]/5 hover:text-[#2ec440] text-slate-700 font-semibold py-3 rounded-xl transition-all">
          View Details
        </Link>
      </div>
    </div>
  );
}
