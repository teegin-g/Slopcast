import React from 'react';
import type { WellGroup } from '../../../../types';
import WaterfallChart from '../../WaterfallChart';

export interface EconomicsTabProps {
  group: WellGroup;
  isClassic: boolean;
}

/**
 * EconomicsTab — group-mode dock tab showing an NPV waterfall.
 *
 * Reuses the WaterfallChart component with an honest two-driver decomposition:
 *   baseNpv = 0
 *   drivers = [
 *     { label: 'CAPEX',       deltaNpv: -totalCapex  }  (negative bar)
 *     { label: 'Net (NPV10)', deltaNpv: npv10 + totalCapex }  (positive bar)
 *   ]
 * This makes the bars sum exactly to group.metrics.npv10 without fabricating
 * per-driver sensitivity numbers that weren't actually computed.
 * The "Adjusted" bar produced by WaterfallChart equals group.metrics.npv10.
 *
 * If group.metrics is undefined, renders a muted empty state.
 */
const EconomicsTab: React.FC<EconomicsTabProps> = ({ group, isClassic }) => {
  const m = group.metrics;

  if (!m) {
    return (
      <div className="flex items-center justify-center h-full min-h-[120px] text-[11px] font-semibold text-theme-muted">
        No economics yet
      </div>
    );
  }

  // Honest decomposition: CAPEX deduction + residual Net (NPV10) bar.
  // baseNpv = 0 so the stacked bars visually walk from zero → NPV10.
  const drivers: Array<{ label: string; deltaNpv: number }> = [
    { label: 'CAPEX', deltaNpv: -m.totalCapex },
    { label: 'Net (NPV10)', deltaNpv: m.npv10 + m.totalCapex },
  ];

  return (
    <div className="py-1 px-1" aria-label="Group economics waterfall">
      <WaterfallChart
        isClassic={isClassic}
        baseNpv={0}
        drivers={drivers}
      />
    </div>
  );
};

export default EconomicsTab;
