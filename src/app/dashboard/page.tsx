import { Suspense } from 'react';
import DashboardContent from '@/components/dashboard/DashboardContent';
import DashboardFallback from '@/components/dashboard/DashboardFallback';

export default function ConsumerDashboard() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent />
    </Suspense>
  );
}
