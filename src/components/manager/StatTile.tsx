import Sparkline from './Sparkline';

export default function StatTile({
  label,
  value,
  delta,
  deltaDirection,
  sparkline,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: 'up' | 'down';
  sparkline?: number[];
}) {
  const deltaColor = deltaDirection === 'up' ? 'text-[#0ca30c]' : deltaDirection === 'down' ? 'text-[#d03b3b]' : 'text-slate-500';
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
      <div className="text-sm font-semibold text-slate-500">{label}</div>
      <div className="flex items-end justify-between gap-4">
        <div className="text-3xl font-black text-slate-900 tracking-tight">{value}</div>
        {sparkline && <Sparkline data={sparkline} />}
      </div>
      {delta && (
        <div className={`text-xs font-bold ${deltaColor} flex items-center gap-1`}>
          {deltaDirection === 'up' && <span aria-hidden="true">↑</span>}
          {deltaDirection === 'down' && <span aria-hidden="true">↓</span>}
          {delta}
        </div>
      )}
    </div>
  );
}
