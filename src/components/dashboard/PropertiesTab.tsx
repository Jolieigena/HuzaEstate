import Image from 'next/image';

export default function PropertiesTab({ goToTab }: { goToTab: (tab: string) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Owned & Rented Properties</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Property 1 */}
        <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col">
          <div className="relative h-56 overflow-hidden">
            <Image src="https://images.unsplash.com/photo-1720605739861-9f5110c7e529?q=80&w=800&auto=format&fit=crop" alt="Active Lease" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#2ec440]"></div>
              Active Lease
            </div>
          </div>
          <div className="p-6 flex flex-col flex-grow">
            <div className="text-2xl font-black text-slate-900 mb-1">$1,200/mo</div>
            <div className="text-sm font-semibold text-slate-500 mb-3">Lease ends: Nov 30, 2027</div>
            <h3 className="text-lg font-bold text-slate-900 mb-1 truncate">Downtown Penthouse Suite</h3>
            <p className="text-sm text-slate-500 flex items-center gap-1 mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path></svg>
              Kiyovu, Kigali
            </p>
            <div className="mt-auto">
              <button onClick={() => goToTab('payments')} className="block text-center w-full bg-slate-900 hover:bg-[#2ec440] text-white font-semibold py-3 rounded-xl transition-all shadow-sm">
                Manage Lease
              </button>
            </div>
          </div>
        </div>

        {/* Property 2 */}
        <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col">
          <div className="relative h-56 overflow-hidden">
            <Image src="https://images.unsplash.com/photo-1682773083908-a0e9ffadd175?q=80&w=800&auto=format&fit=crop" alt="Owned Home" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-slate-400"></div>
              Owned Property
            </div>
          </div>
          <div className="p-6 flex flex-col flex-grow">
            <div className="text-2xl font-black text-slate-900 mb-1">$450,000</div>
            <div className="text-sm font-semibold text-slate-500 mb-3">Estimated Value</div>
            <h3 className="text-lg font-bold text-slate-900 mb-1 truncate">Gacuriro Family Villa</h3>
            <p className="text-sm text-slate-500 flex items-center gap-1 mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path></svg>
              Gacuriro, Kigali
            </p>
            <div className="mt-auto">
              <button className="block text-center w-full bg-white border border-slate-200 hover:border-[#2ec440] hover:bg-[#2ec440]/5 hover:text-[#2ec440] text-slate-700 font-semibold py-3 rounded-xl transition-all">
                Property Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
