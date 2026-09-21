import { SERIES_COLOR } from './styles';

// ---------- Small building-block components ----------

export default function Sparkline({ data, color = SERIES_COLOR, width = 72, height = 28 }: { data: number[]; color?: string; width?: number; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data.map((v, i) => `${i * stepX},${height - ((v - min) / range) * height}`).join(' ');
  const lastX = (data.length - 1) * stepX;
  const lastY = height - ((data[data.length - 1] - min) / range) * height;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="flex-shrink-0" aria-hidden="true">
      <polyline points={points} fill="none" stroke="#c3c2b7" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r="3" fill={color} stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}
