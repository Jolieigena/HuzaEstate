"use client";

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import SavedHomesTab from './SavedHomesTab';
import PropertiesTab from './PropertiesTab';
import PaymentsTab from './PaymentsTab';
import ToursTab from './ToursTab';
import ApplicationsTab from './ApplicationsTab';
import CoShoppingTab from './CoShoppingTab';

const VALID_TABS = ['saved', 'properties', 'payments', 'tours', 'applications', 'coshopping'];

export default function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = VALID_TABS.includes(tabParam ?? '') ? (tabParam as string) : 'saved';
  const goToTab = (tab: string) => router.push(`/dashboard?tab=${tab}`);


  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        
        {/* Dashboard Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">My HuzaEstate</h1>
            <p className="text-slate-500 font-medium">Manage your saved homes, tours, applications, and construction tracking.</p>
          </div>
          <Link
            href="/execution"
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 whitespace-nowrap self-start md:self-auto"
          >
            <span>🏗️</span>
            <span>Construction Execution Tracking →</span>
          </Link>
        </div>

        <div>
          {/* Main Content Area */}
          <main>

            {/* SAVED HOMES TAB */}
            {activeTab === 'saved' && <SavedHomesTab />}

            {/* MY PROPERTIES TAB */}
            {activeTab === 'properties' && <PropertiesTab goToTab={goToTab} />}

            {/* PAYMENTS TAB — superseded by the dedicated Payments/Invoices/Contracts module, which never asks for a PIN, OTP or full card in the browser. */}
            {activeTab === 'payments' && <PaymentsTab />}

            {/* TOURS TAB */}
            {activeTab === 'tours' && <ToursTab />}

            {/* APPLICATIONS TAB */}
            {activeTab === 'applications' && <ApplicationsTab />}

            {/* CO-SHOPPING TAB */}
            {activeTab === 'coshopping' && <CoShoppingTab />}

          </main>
        </div>
      </div>
    </div>
  );
}
