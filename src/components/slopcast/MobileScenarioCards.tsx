import React from 'react';

interface ScenarioResult {
  scenario: {
    id: string;
    name: string;
    color: string;
    schedule: { annualRigs: number[] };
  };
  metrics: {
    npv10: number;
    totalCapex: number;
    eur: number;
    roi: number;
  };
}

interface MobileScenarioCardsProps {
  isClassic: boolean;
  scenarioResults: ScenarioResult[];
  activeScenarioId: string;
  onSelectScenario: (id: string) => void;
}

const MobileScenarioCards: React.FC<MobileScenarioCardsProps> = ({
  isClassic,
  scenarioResults,
  activeScenarioId,
  onSelectScenario,
}) => {
  return (
    <div className="w-full overflow-hidden">
      <div
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 px-1 scrollbar-hide"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {scenarioResults.map((res) => {
          const active = res.scenario.id === activeScenarioId;
          return (
            <div
              key={res.scenario.id}
              onClick={() => onSelectScenario(res.scenario.id)}
              className={`snap-center shrink-0 w-[260px] cursor-pointer transition-all ${
                isClassic
                  ? `sc-panel overflow-hidden ${active ? 'ring-2 ring-theme-warning' : ''}`
                  : `rounded-panel border p-4 shadow-card ${
                      active ? 'border-theme-cyan bg-theme-surface2' : 'border-theme-border bg-theme-surface1/80 hover:border-theme-cyan'
                    }`
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: res.scenario.color }} />
                <span className={`text-[10px] font-black uppercase tracking-[0.1em] truncate ${isClassic ? 'text-white' : 'text-theme-text'}`}>
                  {res.scenario.name}
                </span>
              </div>
              <div className={`text-2xl font-black tracking-tight mb-2 ${isClassic ? 'text-theme-text' : 'text-theme-cyan'}`}>
                ${(res.metrics.npv10 / 1e6).toFixed(1)}M
              </div>
              <div className={`grid grid-cols-2 gap-2 text-[9px] ${isClassic ? 'text-white/70' : 'text-theme-muted'}`}>
                <div>
                  <span className="font-black uppercase tracking-wide">ROI</span>
                  <span className="ml-1 font-bold">{res.metrics.roi.toFixed(2)}x</span>
                </div>
                <div>
                  <span className="font-black uppercase tracking-wide">RIGS</span>
                  <span className="ml-1 font-bold">{Math.max(...res.scenario.schedule.annualRigs)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-2">
        {scenarioResults.map((res) => (
          <div
            key={res.scenario.id}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              res.scenario.id === activeScenarioId
                ? (isClassic ? 'bg-theme-warning' : 'bg-theme-cyan')
                : (isClassic ? 'bg-white/20' : 'bg-theme-border')
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default MobileScenarioCards;
