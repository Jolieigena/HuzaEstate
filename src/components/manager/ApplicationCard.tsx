import type { TenantApplication, ApplicationStage } from '@/lib/tenantApplications/types';
import { formatRelativeTime } from '@/lib/build/format';

export default function ApplicationCard({
  application,
  propertyTitle,
  onAdvance,
  onReject,
}: {
  application: TenantApplication;
  propertyTitle: string;
  onAdvance: (id: string, next: ApplicationStage) => void;
  onReject: (id: string) => void;
}) {
  const accentClass =
    application.stage === 'screening' ? 'border-l-4 border-l-yellow-400' : application.stage === 'approved' ? 'border-l-4 border-l-[#2ec440]' : '';

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border border-slate-200 ${accentClass}`}>
      <div className="flex justify-between items-start mb-1 gap-2">
        <div className="font-bold text-slate-900">{application.applicantName}</div>
        <span className="text-xs font-bold text-slate-500 whitespace-nowrap">{formatRelativeTime(application.appliedAt)}</span>
      </div>
      <div className="text-xs text-slate-500 mb-2 truncate">{propertyTitle}</div>

      {application.stage === 'screening' && (
        <div className="flex items-center gap-2 text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded mb-3">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Awaiting background check
        </div>
      )}

      {application.incomeLabel && (
        <div className="text-xs text-slate-600 mb-1">Income: <span className="font-semibold text-green-600">{application.incomeLabel}</span></div>
      )}
      {application.creditScore && (
        <div className={`text-xs text-slate-600 ${application.stage === 'approved' ? 'mb-4' : 'mb-3'}`}>
          Credit: <span className={`font-semibold ${application.stage === 'approved' ? 'text-green-600' : ''}`}>{application.creditScore}</span>
        </div>
      )}

      {application.stage === 'new' && (
        <div className="flex gap-2">
          <button onClick={() => onAdvance(application.id, 'screening')} className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold py-1.5 rounded-lg text-xs transition-colors">
            Screen
          </button>
          <button onClick={() => onReject(application.id)} className="px-3 text-slate-400 hover:text-red-600 font-semibold text-xs transition-colors">
            Reject
          </button>
        </div>
      )}

      {application.stage === 'screening' && (
        <div className="flex gap-2">
          <button onClick={() => onAdvance(application.id, 'approved')} className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 font-semibold py-1.5 rounded-lg text-xs transition-colors">
            Approve
          </button>
          <button onClick={() => onReject(application.id)} className="px-3 text-slate-400 hover:text-red-600 font-semibold text-xs transition-colors">
            Reject
          </button>
        </div>
      )}

      {application.stage === 'approved' && (
        <button
          onClick={() => onAdvance(application.id, 'leased')}
          className="w-full bg-[#2ec440] hover:bg-[#28b039] text-white font-semibold py-2 rounded-lg text-xs transition-colors shadow-sm"
        >
          Send Lease Agreement
        </button>
      )}
    </div>
  );
}
