import { truncate } from "@/lib/utils";

export type ChartDatum = { label: string; value: number; color?: string };

function polar(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const p1 = polar(cx, cy, r, start);
  const p2 = polar(cx, cy, r, end);
  const large = end - start > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} Z`;
}

export function PieChart({ data, size = 180 }: { data: ChartDatum[]; size?: number }) {
  const total = data.reduce((sum, d) => sum + Math.max(0, d.value), 0);
  const cx = 100;
  const cy = 100;
  const r = 86;
  let angle = -Math.PI / 2;
  const slices = data
    .filter((d) => d.value > 0)
    .map((d, i) => {
      const sweep = (d.value / total) * Math.PI * 2;
      const path = arcPath(cx, cy, r, angle, angle + sweep);
      angle += sweep;
      return <path key={i} d={path} fill={d.color ?? "#1d4ed8"} stroke="white" strokeWidth={2} />;
    });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label="Diagram komposisi presensi">
        {total === 0 ? <circle cx={cx} cy={cy} r={r} fill="#e2e8f0" /> : slices}
        <circle cx={cx} cy={cy} r={46} fill="white" className="dark:fill-[#0b1f3a]" />
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fill="currentColor"
          className="fill-navy-900 dark:fill-white"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 17}
          textAnchor="middle"
          fontSize="10"
          fill="currentColor"
          className="fill-slate-500 dark:fill-slate-400"
        >
          catatan
        </text>
      </svg>
      <ul className="w-full space-y-2">
        {data.map((d) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          return (
            <li key={d.label} className="flex items-center gap-2 text-sm">
              <span
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: d.color ?? "#1d4ed8" }}
              />
              <span className="flex-1 text-slate-700 dark:text-slate-200">{d.label}</span>
              <span className="font-semibold text-slate-900 dark:text-white">{d.value}</span>
              <span className="w-10 text-right text-xs text-slate-500 dark:text-slate-400">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function BarChart({ data }: { data: ChartDatum[] }) {
  const shown = data.slice(-8);
  const width = 360;
  const height = 210;
  const left = 34;
  const bottom = 158;
  const chartWidth = 310;
  const chartHeight = 118;
  const n = shown.length;
  const gap = n > 1 ? 10 : 0;
  const barWidth = n > 0 ? Math.max(14, (chartWidth - gap * (n - 1)) / n) : 30;
  const max = Math.max(100, ...shown.map((d) => d.value));
  const grid = [0, 25, 50, 75, 100].map((v) => {
    const y = bottom - (v / max) * chartHeight;
    return (
      <g key={v}>
        <line x1={left} y1={y} x2={width - 12} y2={y} stroke="currentColor" strokeOpacity={0.12} />
        <text x={left - 6} y={y + 3} textAnchor="end" fontSize="9" fill="currentColor" fillOpacity={0.55}>
          {v}%
        </text>
      </g>
    );
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Diagram kehadiran per bulan">
      {grid}
      {shown.map((d, i) => {
        const h = Math.max(2, (Math.min(max, d.value) / max) * chartHeight);
        const x = left + i * (barWidth + gap);
        return (
          <g key={d.label}>
            <rect x={x} y={bottom - h} width={barWidth} height={h} rx={5} fill="#1d4ed8" />
            <text x={x + barWidth / 2} y={bottom - h - 5} textAnchor="middle" fontSize="9" fontWeight="700" fill="currentColor">
              {Math.round(d.value)}%
            </text>
            <text x={x + barWidth / 2} y={bottom + 16} textAnchor="middle" fontSize="9" fill="currentColor" fillOpacity={0.65}>
              {truncate(d.label, 9)}
            </text>
          </g>
        );
      })}
      {shown.length === 0 ? (
        <text x={width / 2} y={bottom - 40} textAnchor="middle" fontSize="12" fill="currentColor" fillOpacity={0.55}>
          Belum ada data
        </text>
      ) : null}
    </svg>
  );
}
