import { useState, type PointerEvent } from 'react';
import { REVENUE_TREND } from '@/lib/manager/demoData';
import { SERIES_COLOR } from './styles';

const CHART_W = 680;
const CHART_H = 260;
const MARGIN = { top: 20, right: 20, bottom: 30, left: 56 };
const PLOT_W = CHART_W - MARGIN.left - MARGIN.right;
const PLOT_H = CHART_H - MARGIN.top - MARGIN.bottom;
const Y_MAX = 6000;
const Y_TICKS = [0, 2000, 4000, 6000];

export default function RevenueTrendChart() {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const stepX = PLOT_W / (REVENUE_TREND.length - 1);
  const xAt = (i: number) => MARGIN.left + i * stepX;
  const yAt = (v: number) => MARGIN.top + PLOT_H - (v / Y_MAX) * PLOT_H;

  const linePoints = REVENUE_TREND.map((d, i) => `${xAt(i)},${yAt(d.value)}`).join(' ');
  const areaPoints = `${MARGIN.left},${MARGIN.top + PLOT_H} ${linePoints} ${xAt(REVENUE_TREND.length - 1)},${MARGIN.top + PLOT_H}`;

  const lastIndex = REVENUE_TREND.length - 1;
  const lastX = xAt(lastIndex);
  const lastY = yAt(REVENUE_TREND[lastIndex].value);

  const handlePointerMove = (e: PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = CHART_W / rect.width;
    const xInViewBox = (e.clientX - rect.left) * ratio;
    const clamped = Math.min(Math.max(xInViewBox, MARGIN.left), MARGIN.left + PLOT_W);
    const idx = Math.round((clamped - MARGIN.left) / stepX);
    setHoverIndex(idx);
  };

  const hovered = hoverIndex !== null ? REVENUE_TREND[hoverIndex] : null;
  const hoverX = hoverIndex !== null ? xAt(hoverIndex) : 0;
  const hoverY = hoverIndex !== null ? yAt(REVENUE_TREND[hoverIndex].value) : 0;

  return (
    <div className="relative w-full" style={{ aspectRatio: `${CHART_W} / ${CHART_H}` }}>
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full h-full" role="img" aria-label="Monthly revenue trend, last 6 months">
        {Y_TICKS.map(tick => (
          <g key={tick}>
            <line x1={MARGIN.left} x2={CHART_W - MARGIN.right} y1={yAt(tick)} y2={yAt(tick)} stroke="#e1e0d9" strokeWidth="1" />
            <text x={MARGIN.left - 10} y={yAt(tick) + 4} textAnchor="end" fill="#898781" fontSize="11" fontWeight="600">
              ${tick.toLocaleString()}
            </text>
          </g>
        ))}

        <polygon points={areaPoints} fill={SERIES_COLOR} opacity="0.1" />
        <polyline points={linePoints} fill="none" stroke={SERIES_COLOR} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {REVENUE_TREND.map((d, i) => (
          <text key={d.month} x={xAt(i)} y={CHART_H - 8} textAnchor="middle" fill="#898781" fontSize="11" fontWeight="600">
            {d.month}
          </text>
        ))}

        <circle cx={lastX} cy={lastY} r="5" fill={SERIES_COLOR} stroke="#fff" strokeWidth="2" />
        <text x={lastX - 10} y={lastY - 12} textAnchor="end" fill="#0b0b0b" fontSize="13" fontWeight="800">
          ${REVENUE_TREND[lastIndex].value.toLocaleString()}
        </text>

        {hoverIndex !== null && (
          <>
            <line x1={hoverX} x2={hoverX} y1={MARGIN.top} y2={MARGIN.top + PLOT_H} stroke="#c3c2b7" strokeWidth="1" />
            <circle cx={hoverX} cy={hoverY} r="6" fill={SERIES_COLOR} stroke="#fff" strokeWidth="2" />
          </>
        )}

        <rect
          x={MARGIN.left}
          y={MARGIN.top}
          width={PLOT_W}
          height={PLOT_H}
          fill="transparent"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverIndex(null)}
        />
      </svg>

      {hovered && (
        <div
          className="absolute pointer-events-none bg-slate-900 text-white text-xs font-semibold rounded-lg px-3 py-2 shadow-lg whitespace-nowrap z-10"
          style={{
            left: `${(hoverX / CHART_W) * 100}%`,
            top: `${(hoverY / CHART_H) * 100}%`,
            transform: 'translate(-50%, calc(-100% - 12px))',
          }}
        >
          <div className="text-slate-300 font-medium">{hovered.month}</div>
          <div>${hovered.value.toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}
