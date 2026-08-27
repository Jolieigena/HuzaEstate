import Image from 'next/image';
import Link from 'next/link';
import { Property } from '@/lib/data';

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  return (
    <div className="bg-white rounded-[1.75rem] border border-gray-100 p-2 sm:p-2.5 pb-5 hover:shadow-xl transition-shadow duration-300">
      <Link href={`/properties/${property.id}`} className="block relative w-full h-[220px] sm:h-[240px] rounded-2xl overflow-visible mb-4 group">
        {/* Main Image */}
        <div className="relative w-full h-full rounded-2xl overflow-hidden">
          <Image
            src={property.imageUrl}
            alt={property.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
        </div>

        {/* Top Right Photo Count Pill */}
        <div className="absolute top-3 right-3 bg-slate-900/40 backdrop-blur-sm rounded-xl px-2.5 py-1 flex items-center gap-1.5 text-white text-sm font-semibold border border-white/30">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          {(property.title.length % 15) + 5}
        </div>

      </Link>

      {/* Property Details */}
      <div className="px-3 sm:px-4 flex flex-col gap-3">
        {/* Status and Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#2ec440]"></div>
            <span className="text-sm font-semibold text-[#2ec440] capitalize">
              For {property.type}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.location}, ${property.city}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-[#2ec440]/10 hover:text-[#2ec440] hover:border-[#2ec440] transition-all"
              title="View on Map"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
            </a>
            <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-[#2ec440]/10 hover:text-[#2ec440] hover:border-[#2ec440] transition-all" title="Save Property">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
            </button>
          </div>
        </div>

        {/* Price */}
        <div>
          <span className="text-2xl font-extrabold text-gray-900 tracking-tight">
            ${property.price.toLocaleString()}
          </span>
          {property.type === 'rent' && <span className="text-gray-500 text-sm font-medium ml-1">/mo</span>}
        </div>

        {/* Specs */}
        <div className="flex items-center gap-3 text-[15px]">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            <span className="font-bold text-gray-900">{property.bedrooms}</span>
            <span className="text-gray-500">bed</span>
          </div>
          <div className="w-px h-3 bg-gray-300"></div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            <span className="font-bold text-gray-900">{property.bathrooms}</span>
            <span className="text-gray-500">bath</span>
          </div>
          <div className="w-px h-3 bg-gray-300"></div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
            <span className="font-bold text-gray-900">{property.sqm}</span>
            <span className="text-gray-500">sqm</span>
          </div>
        </div>

        {/* Address */}
        <div className="text-[14.5px] text-gray-500 leading-snug mt-1 line-clamp-1">
          {property.location}, {property.city}
        </div>

        {/* Footer */}
        <div className="text-[13px] text-gray-400 italic mt-1 pt-3 border-t border-gray-100">
          Listed by HuzaEstate Group, Inc.
        </div>
      </div>
    </div>
  );
}
