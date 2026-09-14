interface BarBreakdownItem {
  label: string;
  value: number;
  color: string;
}

export default function BarBreakdown({ items, format }: { items: BarBreakdownItem[]; format?: (v: number) => string }) {
  const max = Math.max(...items.map(i => i.value), 1);
  const total = items.reduce((sum, i) => sum + i.value, 0);
  return (
    <div className="flex flex-col gap-4">
      {items.map(item => {
        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return (
          <div key={item.label} className="-mx-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                <span className="text-sm font-semibold text-slate-700">{item.label}</span>
              </div>
              <span className="text-sm font-bold text-slate-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {format ? format(item.value) : item.value}
                <span className="text-slate-400 font-medium"> ({pct}%)</span>
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
