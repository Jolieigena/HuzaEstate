import Image from 'next/image';

export default function CoShoppingTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Co-shopping</h2>
          <p className="text-slate-500 text-sm font-medium">Invite family or friends to search, save, and vote on homes together.</p>
        </div>
        <button className="bg-slate-900 hover:bg-[#2ec440] text-white font-semibold py-2.5 px-6 rounded-xl transition-colors text-sm flex items-center gap-2 shadow-md">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Invite Person
        </button>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Team Members */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <h3 className="font-bold text-slate-900">Your Team</h3>
          
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden relative">
                 <Image src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop" alt="User" fill className="object-cover" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">Jane Doe (You)</div>
                <div className="text-xs text-slate-500">Owner</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden relative">
                 <Image src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=100&auto=format&fit=crop" alt="User" fill className="object-cover" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">Mark Doe</div>
                <div className="text-xs text-[#2ec440] font-semibold">Joined 2 days ago</div>
              </div>
            </div>
            <button className="text-slate-400 hover:text-red-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>

        {/* Shared Activity */}
        <div className="md:col-span-2">
           <h3 className="font-bold text-slate-900 mb-4">Recent Activity</h3>
           <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <div className="flex gap-4 mb-6">
                <div className="w-8 h-8 rounded-full bg-[#2ec440]/10 text-[#2ec440] flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                </div>
                <div>
                  <p className="text-sm text-slate-900"><span className="font-bold">Mark Doe</span> favorited a new property.</p>
                  <p className="text-xs text-slate-500 mb-3">2 hours ago</p>
                  <div className="flex gap-4 p-3 border border-slate-100 rounded-xl bg-slate-50">
                    <div className="w-16 h-16 rounded-lg overflow-hidden relative flex-shrink-0">
                      <Image src="https://images.unsplash.com/photo-1708772565588-33785e13aa46?q=80&w=400&auto=format&fit=crop" alt="Property" fill className="object-cover" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Eco-Friendly Family Home</div>
                      <div className="text-xs font-semibold text-slate-500">$280,000</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <div>
                  <p className="text-sm text-slate-900"><span className="font-bold">You</span> scheduled a tour for Luxury Villa.</p>
                  <p className="text-xs text-slate-500">Yesterday at 3:15 PM</p>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
