import Image from 'next/image';

export default function ApplicationsTab() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Rental Applications</h2>
      
      <div className="flex flex-col gap-6">
        {/* Application 1 */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden relative shadow-md flex-shrink-0">
                <Image src="https://images.unsplash.com/photo-6vKo_e01VYY?q=80&w=400&auto=format&fit=crop" alt="Property" fill className="object-cover" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Modern City Apartment</h3>
                <p className="text-sm font-medium text-slate-500">Kiyovu, Kigali</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-slate-900">$1,200/mo</div>
              <div className="text-xs font-bold text-[#2ec440] bg-[#2ec440]/10 px-2 py-1 rounded-md inline-block mt-1">Under Review</div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="relative">
            <div className="absolute top-4 left-0 w-full h-1 bg-slate-100 rounded-full -z-10"></div>
            <div className="absolute top-4 left-0 w-1/2 h-1 bg-[#2ec440] rounded-full -z-10"></div>
            
            <div className="flex justify-between text-center relative z-10">
              <div className="w-8 h-8 rounded-full bg-[#2ec440] text-white flex items-center justify-center font-bold text-sm shadow-md mx-auto mb-2">✓</div>
              <div className="w-8 h-8 rounded-full bg-[#2ec440] text-white flex items-center justify-center font-bold text-sm shadow-md mx-auto mb-2">2</div>
              <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 text-slate-400 flex items-center justify-center font-bold text-sm mx-auto mb-2">3</div>
              <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 text-slate-400 flex items-center justify-center font-bold text-sm mx-auto mb-2">4</div>
            </div>
            <div className="flex justify-between text-center text-xs font-semibold text-slate-500 mt-2">
              <div className="flex-1 text-slate-900">Submitted</div>
              <div className="flex-1 text-slate-900">Screening</div>
              <div className="flex-1">Landlord Review</div>
              <div className="flex-1">Lease Sign</div>
            </div>
          </div>
        </div>

        {/* Application 2 */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm opacity-75 hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden relative shadow-md flex-shrink-0">
                <Image src="https://images.unsplash.com/photo-1689013398932-b576a11e07a1?q=80&w=400&auto=format&fit=crop" alt="Property" fill className="object-cover" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Downtown Penthouse Suite</h3>
                <p className="text-sm font-medium text-slate-500">Kiyovu, Kigali</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-slate-900">$1,200/mo</div>
              <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md inline-block mt-1">Approved</div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="relative">
            <div className="absolute top-4 left-0 w-full h-1 bg-[#2ec440] rounded-full -z-10"></div>
            
            <div className="flex justify-between text-center relative z-10">
              <div className="w-8 h-8 rounded-full bg-[#2ec440] text-white flex items-center justify-center font-bold text-sm shadow-md mx-auto mb-2">✓</div>
              <div className="w-8 h-8 rounded-full bg-[#2ec440] text-white flex items-center justify-center font-bold text-sm shadow-md mx-auto mb-2">✓</div>
              <div className="w-8 h-8 rounded-full bg-[#2ec440] text-white flex items-center justify-center font-bold text-sm shadow-md mx-auto mb-2">✓</div>
              <div className="w-8 h-8 rounded-full bg-[#2ec440] text-white flex items-center justify-center font-bold text-sm shadow-md mx-auto mb-2">✓</div>
            </div>
            <div className="flex justify-between text-center text-xs font-semibold text-slate-500 mt-2">
              <div className="flex-1 text-slate-900">Submitted</div>
              <div className="flex-1 text-slate-900">Screening</div>
              <div className="flex-1 text-slate-900">Landlord Review</div>
              <div className="flex-1 text-slate-900">Lease Sign</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
