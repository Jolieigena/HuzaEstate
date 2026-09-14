import Image from 'next/image';

export default function ToursTab() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Upcoming Tours</h2>
      
      <div className="flex flex-col gap-6">
        {/* Tour 1 */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-2 bg-[#2ec440]"></div>
          
          <div className="text-center md:text-left min-w-[120px]">
            <div className="text-sm font-bold text-[#2ec440] uppercase tracking-wider mb-1">Tomorrow</div>
            <div className="text-4xl font-black text-slate-900 mb-1">10:30</div>
            <div className="text-sm font-semibold text-slate-500">AM</div>
          </div>
          
          <div className="flex-grow flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-2xl overflow-hidden relative flex-shrink-0 shadow-md">
              <Image src="https://images.unsplash.com/photo-1667504320745-eade6c25e053?q=80&w=400&auto=format&fit=crop" alt="Property" fill className="object-cover" />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold text-slate-900 mb-1">Luxury Villa with Pool</h3>
              <p className="text-sm font-medium text-slate-500 mb-3">Nyarutarama, Kigali</p>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <div className="w-6 h-6 rounded-full overflow-hidden relative">
                   <Image src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=100&auto=format&fit=crop" alt="Agent" fill className="object-cover" />
                </div>
                <span className="text-xs font-semibold text-slate-600">Meeting with Agent David</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full md:w-auto">
            <button className="bg-slate-900 hover:bg-[#2ec440] text-white font-semibold py-2.5 px-6 rounded-xl transition-colors whitespace-nowrap">Reschedule</button>
            <button className="bg-white hover:bg-red-50 text-red-500 border border-slate-200 hover:border-red-200 font-semibold py-2.5 px-6 rounded-xl transition-colors whitespace-nowrap">Cancel Tour</button>
          </div>
        </div>

        {/* Tour 2 */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-2 bg-slate-300"></div>
          
          <div className="text-center md:text-left min-w-[120px]">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Nov 12</div>
            <div className="text-4xl font-black text-slate-900 mb-1">02:00</div>
            <div className="text-sm font-semibold text-slate-500">PM</div>
          </div>
          
          <div className="flex-grow flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-2xl overflow-hidden relative flex-shrink-0 shadow-md">
              <Image src="https://images.unsplash.com/photo-1708772565599-2c4e4b3ed9db?q=80&w=400&auto=format&fit=crop" alt="Property" fill className="object-cover" />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold text-slate-900 mb-1">Modern City Apartment</h3>
              <p className="text-sm font-medium text-slate-500 mb-3">Kiyovu, Kigali</p>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <div className="w-6 h-6 rounded-full overflow-hidden relative">
                   <Image src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=100&auto=format&fit=crop" alt="Agent" fill className="object-cover" />
                </div>
                <span className="text-xs font-semibold text-slate-600">Meeting with Agent Sarah</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full md:w-auto">
            <button className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold py-2.5 px-6 rounded-xl transition-colors whitespace-nowrap">Reschedule</button>
            <button className="bg-white hover:bg-red-50 text-red-500 border border-slate-200 hover:border-red-200 font-semibold py-2.5 px-6 rounded-xl transition-colors whitespace-nowrap">Cancel Tour</button>
          </div>
        </div>
      </div>
    </div>
  );
}
