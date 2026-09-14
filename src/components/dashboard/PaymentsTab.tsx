import Link from 'next/link';

export default function PaymentsTab() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Payments</h2>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 md:p-12 text-center">
        <div className="w-14 h-14 rounded-full bg-[#2ec440]/10 text-[#2ec440] flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Payments now live at a dedicated page</h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">Invoices, milestone funding, receipts and refunds have moved to secure, provider-based pages that never collect a card CVV, PIN or one-time code in the browser.</p>
        <Link href="/payments" className="inline-block bg-slate-900 hover:bg-[#2ec440] text-white font-bold px-8 py-3.5 rounded-xl transition-colors shadow-lg">
          Go to Payments
        </Link>
      </div>
    </div>
  );
}
