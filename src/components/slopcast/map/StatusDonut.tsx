import React from 'react';
import type { StatusSlice } from './groupInspectorStats';

interface StatusDonutProps {
  slices: StatusSlice[];
  total: number;
  size?: number;
}

/**
 * Lightweight well-status donut rendered with a CSS conic-gradient (no chart
 * lib): deterministic for screenshots, cheap, and theme-token friendly. Color
 * is always paired with a labeled legend, never color alone.
 */
export const StatusDonut: React.FC<StatusDonutProps> = ({ slices, total, size = 78 }) => {
  let acc = 0;
  const stops: string[] = [];
  for (const slice of slices) {
    if (slice.count <= 0) continue;
    const start = (acc / total) * 360;
    acc += slice.count;
    const end = (acc / total) * 360;
    stops.push(`${slice.color} ${start}deg ${end}deg`);
  }
  const gradient =
    total > 0 && stops.length > 0
      ? `conic-gradient(${stops.join(', ')})`
      : 'conic-gradient(rgb(var(--border)) 0deg 360deg)';
  const holeInset = Math.round(size * 0.21);

  return (
    <div className="flex items-center gap-3.5" data-testid="status-donut">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <div className="rounded-full w-full h-full" style={{ background: gradient }} />
        <div
          className="absolute rounded-full bg-theme-bg flex items-center justify-center"
          style={{ inset: holeInset }}
        >
          <span className="text-theme-text font-black text-sm tabular-nums">{total}</span>
        </div>
      </div>
      <ul className="flex-1 space-y-1 min-w-0">
        {slices.map(slice => (
          <li key={slice.status} className="flex items-center gap-2 text-[10.5px]">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: slice.color }} />
            <span className="text-theme-text">{slice.label}</span>
            <span className="ml-auto text-theme-muted tabular-nums">
              {slice.count} · {slice.pct}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
