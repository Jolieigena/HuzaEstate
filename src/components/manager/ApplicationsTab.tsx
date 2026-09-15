import type { TenantApplication } from '@/lib/tenantApplications/types';
import { TenantApplicationsStoreEngine } from '@/lib/tenantApplications/store';
import ApplicationCard from './ApplicationCard';

export default function ApplicationsTab({ applications, applicationPropertyFilter, setApplicationPropertyFilter, propertyTitleById }: {
  applications: TenantApplication[];
  applicationPropertyFilter: string;
  setApplicationPropertyFilter: (propertyId: string) => void;
  propertyTitleById: Map<string, string>;
}) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">New</div>
          <div className="text-2xl font-black text-slate-900">{applications.filter((a) => a.stage === 'new').length}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="text-xs font-bold text-yellow-700 uppercase tracking-wide mb-1">Under Review</div>
          <div className="text-2xl font-black text-slate-900">{applications.filter((a) => a.stage === 'screening').length}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">Accepted</div>
          <div className="text-2xl font-black text-slate-900">{applications.filter((a) => a.stage === 'approved').length}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Offers & Applications</h2>
        <select
          value={applicationPropertyFilter}
          onChange={(e) => setApplicationPropertyFilter(e.target.value)}
          className="bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">All Properties</option>
          {Array.from(new Set(applications.map((a) => a.propertyId))).map((propertyId) => (
            <option key={propertyId} value={propertyId}>
              {propertyTitleById.get(propertyId) ?? propertyId}
            </option>
          ))}
        </select>
      </div>

      {/* Kanban Board */}
      <div className="grid md:grid-cols-3 gap-6 overflow-x-auto pb-4">
        {(['new', 'screening', 'approved'] as const).map((stage) => {
          const stageApplications = applications.filter(
            (a) => a.stage === stage && (applicationPropertyFilter === 'all' || a.propertyId === applicationPropertyFilter)
          );
          const columnLabel = stage === 'new' ? 'New' : stage === 'screening' ? 'Under Review' : 'Accepted';
          return (
            <div key={stage} className="bg-slate-100 rounded-2xl p-4 min-w-[280px]">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-bold text-slate-700">{columnLabel} ({stageApplications.length})</h3>
              </div>
              <div className="flex flex-col gap-3">
                {stageApplications.map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    propertyTitle={propertyTitleById.get(application.propertyId) ?? 'Unknown property'}
                    onAdvance={(id, next) => TenantApplicationsStoreEngine.setStage(id, next)}
                    onReject={(id) => TenantApplicationsStoreEngine.setStage(id, 'rejected')}
                  />
                ))}
                {stageApplications.length === 0 && (
                  <div className="text-xs text-slate-400 text-center py-6">No applications here.</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
