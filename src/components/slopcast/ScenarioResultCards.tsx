import React from 'react';
import { useTheme } from '../../theme/ThemeProvider';
import type { ScenarioResult } from './hooks/useScenarioAnalysis';

interface ScenarioResultCardsProps {
  scenarioResults: ScenarioResult[];
}

const ScenarioResultCards: React.FC<ScenarioResultCardsProps> = ({ scenarioResults }) => {
  const { theme } = useTheme();
  const isClassic = theme.features.isClassicTheme;
  const titleClass = theme.features.brandFont ? 'brand-font' : 'heading-font';

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
      {scenarioResults.map(res => (
        <div
          key={res.scenario.id}
          className={`group relative overflow-hidden theme-transition ${
            isClassic
              ? 'sc-panel overflow-hidden'
              : 'rounded-panel border border-theme-border bg-theme-surface1/80 p-6 shadow-card hover:border-theme-cyan'
          }`}
        >
          <div className="absolute left-0 top-0 h-full w-1.5 opacity-60" style={{ backgroundColor: res.scenario.color }} />
          <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 blur-[50px] opacity-10" style={{ backgroundColor: res.scenario.color }} />

          {isClassic ? (
            <>
              <div className="sc-panelTitlebar sc-titlebar--red flex min-w-0 items-center px-5 py-3">
                <h4 className={`truncate text-[10px] font-black uppercase tracking-[0.3em] text-white ${titleClass}`}>
                  {res.scenario.name}
                </h4>
              </div>
              <div className="p-5">
                <div className="text-3xl font-black tracking-tight text-theme-text theme-transition">
                  ${(res.metrics.npv10 / 1e6).toFixed(1)}M <span className="ml-1 text-[10px] font-black tracking-[0.1em] text-theme-muted">NPV10</span>
                </div>
                <div className="mt-6 flex justify-between border-t border-white/5 pt-3 text-[10px] font-bold tracking-widest text-theme-muted">
                  <span>ROI: {res.metrics.roi.toFixed(2)}X</span>
                  <span>FLEET: {Math.max(...res.scenario.schedule.annualRigs)} RIGS</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <h4 className={`mb-4 ml-2 truncate typo-section transition-colors group-hover:text-theme-magenta ${titleClass}`}>
                {res.scenario.name}
              </h4>
              <div className="ml-2">
                <div className="text-3xl font-black tracking-tight text-theme-text theme-transition">
                  ${(res.metrics.npv10 / 1e6).toFixed(1)}M <span className="ml-1 text-[10px] font-black tracking-[0.1em] text-theme-muted">NPV10</span>
                </div>
                <div className="mt-6 flex justify-between border-t border-white/5 pt-3 text-[10px] font-bold tracking-widest text-theme-muted">
                  <span>ROI: {res.metrics.roi.toFixed(2)}X</span>
                  <span>FLEET: {Math.max(...res.scenario.schedule.annualRigs)} RIGS</span>
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default ScenarioResultCards;
