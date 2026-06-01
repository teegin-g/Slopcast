import React from 'react';

export interface KpiTileItem {
  label: string;
  value: string;
  delta?: string;
}

export interface KpiTileProps extends KpiTileItem {
  /** Background class for the tile; defaults to 'bg-theme-bg' */
  bgClass?: string;
  /** Whether to apply min-h-[58px]; defaults to false */
  minHeight?: boolean;
  /** Font-size class(es) for the value; defaults to 'text-sm lg:text-base' */
  valueSizeClass?: string;
  /** Letter-spacing class for the label; defaults to 'tracking-[0.16em]' */
  labelTrackingClass?: string;
}

/**
 * Single KPI tile used in BottomKpiStrip and GroupPulse inside DesignEconomicsView.
 *
 * BottomKpiStrip: delta + minHeight=true (uses all defaults)
 * GroupPulse: bgClass='bg-theme-bg/75', valueSizeClass='text-sm',
 *             labelTrackingClass='tracking-[0.1em]' (no delta, no minHeight)
 */
const KpiTile: React.FC<KpiTileProps> = ({
  label,
  value,
  delta,
  bgClass = 'bg-theme-bg',
  minHeight = false,
  valueSizeClass = 'text-sm lg:text-base',
  labelTrackingClass = 'tracking-[0.16em]',
}) => (
  <div className={`rounded-inner border border-theme-border ${bgClass} px-3 py-2${minHeight ? ' min-h-[58px]' : ''}`}>
    <p className={`text-[9px] font-black uppercase ${labelTrackingClass} text-theme-muted`}>{label}</p>
    <div className="mt-1 flex items-end justify-between gap-2">
      <p className={`${valueSizeClass} font-black text-theme-text tabular-nums`}>{value}</p>
      {delta !== undefined && (
        <p className="text-[9px] font-semibold text-theme-cyan whitespace-nowrap">{delta}</p>
      )}
    </div>
  </div>
);

export default KpiTile;
