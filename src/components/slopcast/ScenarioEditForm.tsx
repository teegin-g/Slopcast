import React from 'react';
import type { Scenario } from '../../types';
import { useTheme } from '../../theme/ThemeProvider';
import AccordionItem from './AccordionItem';
import SectionCard from './SectionCard';

type OpenSection = 'PRICING' | 'SCHEDULE' | 'SCALARS';

interface ScenarioEditFormProps {
  scenario: Scenario;
  openSection: OpenSection;
  onOpenSectionChange: (section: OpenSection) => void;
  onUpdateScenario: (id: string, updates: Partial<Scenario>) => void;
  onUpdatePricing: (id: string, field: string, value: number) => void;
  onUpdateAnnualRig: (id: string, yearIdx: number, value: number) => void;
  onUpdateScheduleParam: (id: string, field: string, value: number) => void;
}

const ScenarioEditForm: React.FC<ScenarioEditFormProps> = ({
  scenario,
  openSection,
  onOpenSectionChange,
  onUpdateScenario,
  onUpdatePricing,
  onUpdateAnnualRig,
  onUpdateScheduleParam,
}) => {
  const { theme } = useTheme();
  const isClassic = theme.features.isClassicTheme;
  const titleClass = theme.features.brandFont ? 'brand-font' : 'heading-font';

  const inputClass = isClassic
    ? 'w-full rounded-inner px-3 py-2 text-xs font-black sc-inputNavy focus-ring'
    : 'w-full rounded-inner border border-theme-border bg-theme-bg/85 px-3 py-2 text-xs text-theme-text theme-transition focus-ring focus:border-theme-cyan focus:bg-theme-surface1';
  const labelClass = isClassic
    ? `typo-label heading-font block mb-2 text-theme-warning ${theme.features.brandFont ? 'brand-font' : ''}`
    : `typo-label heading-font block mb-2 ${theme.features.brandFont ? 'brand-font' : ''}`;
  const colorInputClass = isClassic
    ? 'h-10 w-full cursor-pointer rounded-inner sc-inputNavy focus-ring'
    : 'h-10 w-full cursor-pointer rounded-inner border border-theme-border bg-theme-bg theme-transition focus-ring focus:border-theme-magenta';
  const compactNumberInputClass = isClassic
    ? 'w-full rounded-inner py-1.5 text-center text-[11px] font-black sc-inputNavy focus-ring'
    : 'w-full rounded-inner border border-theme-border bg-theme-surface1 py-1.5 text-center text-[11px] font-black text-theme-cyan transition-colors focus-ring focus:border-theme-magenta';
  const rangeClass = isClassic
    ? 'w-full h-1.5 sc-rangeNavy appearance-none cursor-pointer focus-ring'
    : 'w-full h-1.5 appearance-none cursor-pointer rounded-full border border-theme-border bg-theme-surface1 focus-ring';

  return (
    <div className="theme-transition">
      <SectionCard
        isClassic={isClassic}
        title="EDIT SELECTED MODEL"
        panelStyle="solid"
        className="rounded-b-none"
        headerClassName={isClassic ? 'sc-titlebar--red px-5 py-4' : ''}
        titleClassName={titleClass}
      >
        <div className={isClassic ? 'sc-insetDark rounded-inner p-4' : ''}>
          <div className="mb-4">
            <label className={labelClass}>MODEL NAME</label>
            <input
              type="text"
              value={scenario.name}
              onChange={e => onUpdateScenario(scenario.id, { name: e.target.value.toUpperCase() })}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>INDICATOR</label>
              <input
                type="color"
                value={scenario.color}
                onChange={e => onUpdateScenario(scenario.id, { color: e.target.value })}
                className={colorInputClass}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        isClassic={isClassic}
        panelStyle="outline"
        className="rounded-t-none"
        noBodyPadding
        bodyClassName={isClassic ? 'space-y-1 p-2' : 'space-y-1 bg-theme-bg p-2'}
      >
        <AccordionItem title="Pricing" isOpen={openSection === 'PRICING'} onClick={() => onOpenSectionChange('PRICING')} useBrandFont={theme.features.brandFont}>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>OIL PRICE</label><input type="number" value={scenario.pricing.oilPrice} onChange={e => onUpdatePricing(scenario.id, 'oilPrice', parseFloat(e.target.value))} className={inputClass} /></div>
            <div><label className={labelClass}>GAS PRICE</label><input type="number" value={scenario.pricing.gasPrice} onChange={e => onUpdatePricing(scenario.id, 'gasPrice', parseFloat(e.target.value))} className={inputClass} /></div>
            <div><label className={labelClass}>OIL DIFF</label><input type="number" value={scenario.pricing.oilDifferential} onChange={e => onUpdatePricing(scenario.id, 'oilDifferential', parseFloat(e.target.value))} className={inputClass} /></div>
            <div><label className={labelClass}>GAS DIFF</label><input type="number" value={scenario.pricing.gasDifferential} onChange={e => onUpdatePricing(scenario.id, 'gasDifferential', parseFloat(e.target.value))} className={inputClass} /></div>
          </div>
        </AccordionItem>

        <AccordionItem title="Fleet Scheduling" isOpen={openSection === 'SCHEDULE'} onClick={() => onOpenSectionChange('SCHEDULE')} useBrandFont={theme.features.brandFont}>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>DRILL DAYS</label><input type="number" value={scenario.schedule.drillDurationDays} onChange={e => onUpdateScheduleParam(scenario.id, 'drillDurationDays', parseFloat(e.target.value))} className={inputClass} /></div>
              <div><label className={labelClass}>STIM DAYS</label><input type="number" value={scenario.schedule.stimDurationDays} onChange={e => onUpdateScheduleParam(scenario.id, 'stimDurationDays', parseFloat(e.target.value))} className={inputClass} /></div>
            </div>
            <div>
              <label className={labelClass}>ANNUAL ALLOCATION (Y1-Y5)</label>
              <div className="grid grid-cols-5 gap-2">
                {scenario.schedule.annualRigs.slice(0, 5).map((count, idx) => (
                  <div key={idx} className="text-center">
                    <span className={`mb-1 block text-[9px] font-black ${isClassic ? 'text-theme-warning' : 'text-theme-muted'}`}>Y{idx + 1}</span>
                    <input
                      type="number"
                      min="0"
                      value={count}
                      onChange={e => onUpdateAnnualRig(scenario.id, idx, parseFloat(e.target.value))}
                      className={compactNumberInputClass}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AccordionItem>

        <AccordionItem title="Risk Scalars" isOpen={openSection === 'SCALARS'} onClick={() => onOpenSectionChange('SCALARS')} useBrandFont={theme.features.brandFont}>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2"><label className={labelClass}>CAPEX MULTIPLIER</label><span className="text-[10px] font-black text-theme-cyan">{(scenario.capexScalar * 100).toFixed(0)}%</span></div>
              <input
                type="range" min="0.5" max="2.0" step="0.05"
                value={scenario.capexScalar}
                onChange={e => onUpdateScenario(scenario.id, { capexScalar: parseFloat(e.target.value) })}
                className={`${rangeClass} ${isClassic ? '' : 'accent-theme-cyan'}`}
              />
            </div>
            <div>
              <div className="flex justify-between mb-2"><label className={labelClass}>RECOVERY MULTIPLIER</label><span className="text-[10px] font-black text-theme-magenta">{(scenario.productionScalar * 100).toFixed(0)}%</span></div>
              <input
                type="range" min="0.5" max="1.5" step="0.05"
                value={scenario.productionScalar}
                onChange={e => onUpdateScenario(scenario.id, { productionScalar: parseFloat(e.target.value) })}
                className={`${rangeClass} ${isClassic ? '' : 'accent-theme-magenta'}`}
              />
            </div>
          </div>
        </AccordionItem>
      </SectionCard>
    </div>
  );
};

export default ScenarioEditForm;
