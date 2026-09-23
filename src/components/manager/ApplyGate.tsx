import Link from 'next/link';

export default function ApplyGate() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-20">
      <div className="max-w-lg w-full text-center bg-white rounded-3xl border border-slate-100 shadow-sm p-10">
        <div className="w-16 h-16 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-3">Manager Portal is for sellers &amp; landlords</h1>
        <p className="text-slate-500 mb-8">Become a seller to unlock your listings dashboard, tenant screening, and rent collection tools — it only takes a minute and there&apos;s no approval wait.</p>
        <Link href="/become-a-seller" className="inline-flex items-center justify-center bg-slate-900 hover:bg-[#2ec440] text-white font-bold px-6 py-3 rounded-xl transition-colors">
          Become a Seller
        </Link>
      </div>
    </div>
  );
}
