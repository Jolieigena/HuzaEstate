"use client";

import SavedHomesTab from './SavedHomesTab';
import { useLanguage } from '@/lib/i18n/language';

export default function DashboardContent() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 mb-2">{t('My HuzaEstate')}</h1>
          <p className="text-slate-500 font-medium">{t("The homes you've saved, on every device you sign in from.")}</p>
        </div>
        <main>
          <SavedHomesTab />
        </main>
      </div>
    </div>
  );
}
