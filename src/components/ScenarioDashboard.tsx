import React, { useState } from 'react';
import { WellGroup, Well, Scenario, SensitivityVariable, ScheduleParams } from '../types';
import SensitivityMatrix from './SensitivityMatrix';
import { useTheme } from '../theme/ThemeProvider';
import { DEFAULT_COMMODITY_PRICING } from '../constants';
import { useScenarioAnalysis } from './slopcast/hooks/useScenarioAnalysis';
import { AnimatedButton } from './slopcast/AnimatedButton';
import SectionCard from './slopcast/SectionCard';
import ScenarioEditForm from './slopcast/ScenarioEditForm';
import ScenarioResultCards from './slopcast/ScenarioResultCards';
import PortfolioOverlayChart from './slopcast/PortfolioOverlayChart';

interface ScenarioDashboardProps {
  groups: WellGroup[]; 
  wells: Well[];
  scenarios: Scenario[];
  setScenarios: React.Dispatch<React.SetStateAction<Scenario[]>>;
}

const DEFAULT_SCHEDULE: ScheduleParams = { 
    annualRigs: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2], 
    drillDurationDays: 18, 
    stimDurationDays: 12, 
    rigStartDate: new Date().toISOString().split('T')[0] 
};

const ScenarioDashboard: React.FC<ScenarioDashboardProps> = ({ groups, wells, scenarios, setScenarios }) => {
  const { theme } = useTheme();
  const isClassic = theme.features.isClassicTheme;

  const [activeScenarioId, setActiveScenarioId] = useState<string>('s-base');
  const [editingScenario, setEditingScenario] = useState<boolean>(false);
  const [openSection, setOpenSection] = useState<'PRICING' | 'SCHEDULE' | 'SCALARS'>('PRICING');

  const [sensX, setSensX] = useState<SensitivityVariable>('OIL_PRICE');
  const [sensY, setSensY] = useState<SensitivityVariable>('RIG_COUNT');

  const { scenarioResults, cfChartData, sensitivityData } = useScenarioAnalysis({
    groups, wells, scenarios, activeScenarioId, sensX, sensY,
  });
  const handleAddScenario = () => {
      const base = scenarios.find(s => s.isBaseCase) || scenarios[0];
      const newScen: Scenario = {
        id: `s-${Date.now()}`,
        name: 'NEW CASE',
        color: '#DBA1DD',
        isBaseCase: false,
        pricing: { ...(base?.pricing || DEFAULT_COMMODITY_PRICING) },
        schedule: { ...(base?.schedule || DEFAULT_SCHEDULE) },
        capexScalar: 1.0,
        productionScalar: 1.0
      };
      setScenarios([...scenarios, newScen]);
      setActiveScenarioId(newScen.id);
      setEditingScenario(true);
  };

  const updateScenario = (id: string, updates: Partial<Scenario>) => setScenarios(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  const updatePricing = (id: string, field: string, value: number) => {
      const s = scenarios.find(sc => sc.id === id);
      if(s) updateScenario(id, { pricing: { ...s.pricing, [field]: value } });
  };
  const updateAnnualRig = (id: string, yearIdx: number, value: number) => {
      const s = scenarios.find(sc => sc.id === id);
      if(s) {
          const newRigs = [...s.schedule.annualRigs];
          newRigs[yearIdx] = value;
          updateScenario(id, { schedule: { ...s.schedule, annualRigs: newRigs } });
      }
  };
  const updateScheduleParam = (id: string, field: string, value: any) => {
      const s = scenarios.find(sc => sc.id === id);
      if(s) updateScenario(id, { schedule: { ...s.schedule, [field]: value } });
  };

  const activeScenario = scenarios.find(s => s.id === activeScenarioId);
  const scenarioCardTitleClass = theme.features.brandFont ? 'brand-font' : 'heading-font';
  const selectClass = isClassic
    ? 'sc-selectNavy rounded-inner px-3 py-2 text-[10px] font-black outline-none transition-all cursor-pointer focus-ring'
    : 'rounded-inner border border-theme-border bg-theme-bg px-3 py-2 text-[10px] font-black text-theme-text transition-all cursor-pointer focus-ring';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      
      {/* LEFT: Scenario Management */}
      <div className="xl:col-span-3 space-y-6">
        <SectionCard
          isClassic={isClassic}
          title="MODEL STACK"
          action={(
            <AnimatedButton
              onClick={handleAddScenario}
              isClassic={isClassic}
              variant="primary"
              size="sm"
              className="px-4"
            >
              + NEW
            </AnimatedButton>
          )}
          panelStyle="solid"
          headerClassName={isClassic ? 'sc-titlebar--red px-5 py-4' : ''}
          titleClassName={scenarioCardTitleClass}
          bodyClassName={isClassic ? '' : 'space-y-3'}
        >
          <div className={isClassic ? 'sc-insetDark rounded-inner p-3 space-y-3' : 'space-y-3'}>
            {scenarios.map(s => {
              const isActive = s.id === activeScenarioId;

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setActiveScenarioId(s.id);
                    setEditingScenario(true);
                  }}
                  aria-pressed={isActive}
                  aria-label={`Edit scenario ${s.name}`}
                  className={`group focus-ring w-full rounded-inner border p-3 text-left transition-all motion-reduce:transition-none ${
                    isClassic
                      ? isActive
                        ? 'border-theme-warning bg-black/25'
                        : 'border-black/25 bg-black/10 hover:bg-black/20'
                      : isActive
                        ? 'border-theme-magenta bg-theme-surface2 shadow-glow-magenta'
                        : 'border-theme-border bg-theme-bg hover:border-theme-cyan hover:-translate-y-0.5 motion-reduce:hover:translate-y-0'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color, boxShadow: `0 0 10px ${s.color}66` }} />
                      <span className={`truncate text-[11px] font-black uppercase tracking-[0.1em] ${isClassic ? 'text-white' : 'text-theme-text'} ${scenarioCardTitleClass}`}>
                        {s.name}
                      </span>
                    </div>
                    <div
                      className={`h-1.5 w-1.5 rounded-full motion-safe:animate-pulse ${
                        isClassic ? 'bg-black/20 group-hover:bg-black/40' : 'bg-theme-cyan/20 group-hover:bg-theme-cyan'
                      }`}
                    />
                  </div>
                  <div className={`flex justify-between text-[10px] font-mono tracking-tight ${isClassic ? 'text-white/75' : 'text-theme-muted'}`}>
                    <span>OIL: ${s.pricing.oilPrice}</span>
                    <span className={`font-black uppercase ${isClassic ? 'text-theme-warning' : 'text-theme-cyan'}`}>
                      {Math.max(...s.schedule.annualRigs)} RIGS
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </SectionCard>

        {activeScenario && editingScenario && (
          <ScenarioEditForm
            scenario={activeScenario}
            openSection={openSection}
            onOpenSectionChange={setOpenSection}
            onUpdateScenario={updateScenario}
            onUpdatePricing={updatePricing}
            onUpdateAnnualRig={updateAnnualRig}
            onUpdateScheduleParam={updateScheduleParam}
          />
        )}
      </div>

      <div className="xl:col-span-9 space-y-6">
        <ScenarioResultCards scenarioResults={scenarioResults} />

        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
          <PortfolioOverlayChart groups={groups} scenarios={scenarios} cfChartData={cfChartData} />

          <div className="space-y-6">
            <div className={isClassic ? 'sc-insetDark rounded-inner p-3 flex items-center justify-end gap-4' : 'flex items-center justify-end gap-4 pr-2'}>
              <span className={`heading-font text-[9px] font-black uppercase tracking-[0.2em] ${isClassic ? 'text-theme-warning' : 'text-theme-muted'}`}>Primary Variable</span>
              <select value={sensY} onChange={(e) => setSensY(e.target.value as SensitivityVariable)} className={`${selectClass} ${isClassic ? '' : 'text-theme-cyan focus:border-theme-magenta'}`}>
                <option value="CAPEX_SCALAR">CAPEX SCALAR</option>
                <option value="EUR_SCALAR">RECOVERY SCALAR</option>
                <option value="OIL_PRICE">OIL BENCHMARK</option>
                <option value="RIG_COUNT">FLEET SIZE</option>
              </select>
              <span className={`text-[10px] font-black ${isClassic ? 'text-white/60 opacity-60' : 'text-theme-lavender opacity-40'}`}>VS</span>
              <select value={sensX} onChange={(e) => setSensX(e.target.value as SensitivityVariable)} className={`${selectClass} ${isClassic ? '' : 'text-theme-magenta focus:border-theme-cyan'}`}>
                <option value="OIL_PRICE">OIL BENCHMARK</option>
                <option value="CAPEX_SCALAR">CAPEX SCALAR</option>
                <option value="EUR_SCALAR">RECOVERY SCALAR</option>
                <option value="RIG_COUNT">FLEET SIZE</option>
              </select>
            </div>
            <SensitivityMatrix data={sensitivityData} xVar={sensX} yVar={sensY} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioDashboard;
