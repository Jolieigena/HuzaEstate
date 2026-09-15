import RequireAuth from '@/components/shared/RequireAuth';
import ManagerDashboard from '@/components/manager/ManagerDashboard';

export default function ManagerPage() {
  return (
    <RequireAuth>
      <ManagerDashboard />
    </RequireAuth>
  );
}
