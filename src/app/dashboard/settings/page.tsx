import RequireAuth from '@/components/shared/RequireAuth';
import SettingsTab from '@/components/dashboard/SettingsTab';

export default function DashboardSettingsPage() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-slate-50 py-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <SettingsTab />
        </div>
      </div>
    </RequireAuth>
  );
}
