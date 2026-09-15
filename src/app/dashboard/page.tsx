import { Suspense } from 'react';
import RequireAuth from '@/components/shared/RequireAuth';
import DashboardContent from '@/components/dashboard/DashboardContent';
import DashboardFallback from '@/components/dashboard/DashboardFallback';

export default function ConsumerDashboard() {
  return (
    <RequireAuth>
      <Suspense fallback={<DashboardFallback />}>
        <DashboardContent />
      </Suspense>
    </RequireAuth>
  );
}
