import React, { useEffect, useMemo, useState } from 'react';
import { OpexAssumptions, OwnershipAssumptions, WellGroup, TypeCurveParams, CapexAssumptions } from '../types';
import CapexControls from './CapexControls';
import OpexControls from './OpexControls';
import OwnershipControls from './OwnershipControls';
import { useTheme } from '../theme/ThemeProvider';

interface ControlsProps {
  group: WellGroup;
  onUpdateGroup: (updatedGroup: WellGroup) => void;
  onMarkDirty?: () => void;
  openSectionKey?: SectionKey | null;
  onOpenSectionHandled?: () => void;
}

type SectionKey = 'TYPE_CURVE' | 'CAPEX' | 'OPEX' | 'OWNERSHIP';

interface AccordionSectionProps {
  id: SectionKey;
  title: string;
  isOpen: boolean;
  onToggle: (id: SectionKey) => void;
  children: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ 
  id, title, isOpen, onToggle, children 
}) => {
  const { theme } = useTheme();
  const isClassic = theme.id === 'mario';
  return (
    <div
      className={
        isClassic
          ? `sc-panel theme-transition mb-3 ${isOpen ? 'ring-2 ring-theme-warning/30' : ''}`
          : `
            border rounded-panel overflow-hidden theme-transition mb-3 shadow-card
            ${isOpen 
              ? 'bg-theme-surface1 border-theme-magenta shadow-glow-magenta' 
              : 'bg-theme-surface1/40 border-theme-border'}
          `
      }
    >
      <button 
        onClick={() => onToggle(id)}
        className={
          isClassic
            ? `w-full flex items-center justify-between px-4 py-3 text-left transition-all sc-panelTitlebar sc-titlebar--neutral ${
                isOpen ? 'text-white' : 'text-white/90'
              }`
            : `w-full flex items-center justify-between px-4 py-3 text-left transition-all ${isOpen ? 'text-theme-cyan' : 'text-theme-muted'}`
        }
      >
        <span className={`text-[10px] font-black uppercase tracking-[0.22em] ${theme.features.brandFont ? 'brand-font' : ''}`}>{title}</span>
        <span className={`transform transition-transform duration-500 opacity-30 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      
      <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[720px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className={isClassic ? 'p-4 bg-black/10' : 'p-4 border-t border-theme-border/20'}>
          {children}
        </div>
      </div>
    </div>
  );
};

const Controls: React.FC<ControlsProps> = ({
  group,
  onUpdateGroup,
  onMarkDirty,
  openSectionKey,
  onOpenSectionHandled,
}) => {
  const [activeSection, setActiveSection] = useState<SectionKey>('TYPE_CURVE');
  const [capexEditSignal, setCapexEditSignal] = useState(0);
  const { theme } = useTheme();
  const isClassic = theme.id === 'mario';

  useEffect(() => {
    if (!openSectionKey) return;
    setActiveSection(openSectionKey);
    if (onOpenSectionHandled) onOpenSectionHandled();
  }, [onOpenSectionHandled, openSectionKey]);

  const handleTcChange = (key: keyof TypeCurveParams, val: string) => {
    onUpdateGroup({ ...group, typeCurve: { ...group.typeCurve, [key]: parseFloat(val) || 0 } });
    if (onMarkDirty) onMarkDirty();
  };

  const handleCapexChange = (updatedCapex: CapexAssumptions) => {
    onUpdateGroup({ ...group, capex: updatedCapex });
    if (onMarkDirty) onMarkDirty();
  };
  
  const handleOpexChange = (updated: OpexAssumptions) => {
    onUpdateGroup({ ...group, opex: updated });
    if (onMarkDirty) onMarkDirty();
  };

  const handleOwnershipChange = (updated: OwnershipAssumptions) => {
    onUpdateGroup({ ...group, ownership: updated });
    if (onMarkDirty) onMarkDirty();
  };

  const capexSummary = useMemo(() => {
    const total = group.capex.items.reduce((sum, item) => {
      const itemCost = item.basis === 'PER_FOOT' ? item.value * 10000 : item.value;
      return sum + itemCost;
    }, 0);
    const wells = Math.max(1, group.wellIds.size);
    return {
      total,
      perWell: total / wells,
      itemCount: group.capex.items.length,
    };
  }, [group.capex.items, group.wellIds.size]);

  const inputClass = isClassic
    ? 'w-full rounded-inner px-3 py-1.5 text-[11px] font-black sc-inputNavy'
    : 'w-full bg-theme-bg border rounded-inner px-3 py-1.5 text-[11px] text-theme-text outline-none focus:ring-1 theme-transition border-theme-border focus:border-theme-cyan focus:ring-theme-cyan/30';

  const labelClass = isClassic
    ? 'text-[9px] font-black uppercase tracking-[0.2em] mb-1 block text-theme-warning'
    : 'text-[9px] font-black uppercase tracking-[0.2em] mb-1 block text-theme-muted';

  const badgeClass = isClassic
    ? 'text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded border border-black/30 bg-theme-cyan text-white'
    : 'text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border bg-theme-bg border-theme-border text-theme-cyan';

  return (
    <div className="space-y-4 pb-12">
      <div
        className={
          isClassic
            ? 'sc-panel theme-transition mb-3'
            : 'rounded-panel border p-3 shadow-card theme-transition bg-theme-surface1 border-theme-border/60'
        }
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
              style={{ backgroundColor: group.color, boxShadow: theme.features.glowEffects ? `0 0 8px ${group.color}66` : 'none' }}
            />
            <h2 className={`text-[11px] font-black uppercase tracking-[0.16em] truncate ${isClassic ? 'text-white' : 'text-theme-text'} ${theme.features.brandFont ? 'brand-font' : ''}`}>
              {group.name}
            </h2>
          </div>
          <p className={`text-[10px] font-black uppercase tracking-[0.12em] whitespace-nowrap ${isClassic ? 'text-theme-warning' : 'text-theme-cyan'}`}>
            {group.wellIds.size} wells · ${group.metrics ? (group.metrics.totalCapex / 1e6).toFixed(1) : 0}M capex
          </p>
        </div>
      </div>

      <div
        className={
          isClassic
            ? 'sc-panel theme-transition mb-4'
            : 'rounded-panel border p-4 mb-4 shadow-card theme-transition bg-theme-surface1/80 border-theme-border'
        }
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className={isClassic ? 'text-[10px] font-black uppercase tracking-[0.24em] text-white' : 'text-[10px] font-black uppercase tracking-[0.24em] text-theme-cyan'}>
            CAPEX Snapshot
          </h3>
          <button
            onClick={() => {
              setActiveSection('CAPEX');
              setCapexEditSignal(prev => prev + 1);
            }}
            className={
              isClassic
                ? 'sc-btnPrimary px-3 py-1.5 rounded-inner text-[9px] font-black uppercase tracking-[0.16em]'
                : 'px-3 py-1.5 rounded-inner text-[9px] font-black uppercase tracking-[0.16em] bg-theme-magenta text-white hover:shadow-glow-magenta transition-all'
            }
          >
            Edit CAPEX
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className={isClassic ? 'rounded-md border border-black/30 bg-black/10 p-2' : 'rounded-inner border border-theme-border bg-theme-bg p-2'}>
            <p className={labelClass}>Total</p>
            <p className={isClassic ? 'text-white text-base font-black' : 'text-theme-text text-base font-black'}>
              ${(capexSummary.total / 1e6).toFixed(2)}M
            </p>
          </div>
          <div className={isClassic ? 'rounded-md border border-black/30 bg-black/10 p-2' : 'rounded-inner border border-theme-border bg-theme-bg p-2'}>
            <p className={labelClass}>Per Well</p>
            <p className={isClassic ? 'text-white text-base font-black' : 'text-theme-text text-base font-black'}>
              ${(capexSummary.perWell / 1e6).toFixed(2)}M
            </p>
          </div>
          <div className={isClassic ? 'rounded-md border border-black/30 bg-black/10 p-2' : 'rounded-inner border border-theme-border bg-theme-bg p-2'}>
            <p className={labelClass}>Line Items</p>
            <p className={isClassic ? 'text-white text-base font-black' : 'text-theme-text text-base font-black'}>
              {capexSummary.itemCount}
            </p>
          </div>
        </div>
      </div>

      <AccordionSection id="TYPE_CURVE" title="Decline Profile" isOpen={activeSection === 'TYPE_CURVE'} onToggle={setActiveSection}>
        <div className="space-y-4">
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label className={labelClass}>Initial Rate (BOPD)</label>
                    <span className={badgeClass}>{group.typeCurve.qi > 1000 ? "TIER 1" : "PROVEN"}</span>
                </div>
                <input type="number" step="10" value={group.typeCurve.qi} onChange={e => handleTcChange('qi', e.target.value)} className={inputClass} />
            </div>

            <div>
                <div className="flex justify-between items-center mb-1">
                    <label className={labelClass}>Hyperbolic B-Factor</label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={group.typeCurve.b}
                  onChange={e => handleTcChange('b', e.target.value)}
                  className={
                    isClassic
                      ? 'w-full h-1.5 sc-rangeNavy appearance-none cursor-pointer'
                      : 'w-full h-1.5 bg-theme-bg border border-theme-border rounded-lg appearance-none cursor-pointer accent-theme-cyan'
                  }
                />
                <div className={`flex justify-between mt-0.5 text-[9px] font-mono ${isClassic ? 'text-white/75' : 'text-theme-muted'}`}>
                  <span>0.0</span>
                  <span className={isClassic ? 'text-theme-warning font-black' : ''}>{group.typeCurve.b}</span>
                  <span>2.0</span>
                </div>
            </div>

            <div>
                <label className={labelClass}>Effective Decline (%)</label>
                <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="20"
                      max="95"
                      value={group.typeCurve.di}
                      onChange={e => handleTcChange('di', e.target.value)}
                      className={
                        isClassic
                          ? 'flex-1 h-1.5 sc-rangeNavy appearance-none cursor-pointer'
                          : 'flex-1 h-1.5 bg-theme-bg border border-theme-border rounded-lg appearance-none cursor-pointer accent-theme-magenta'
                      }
                    />
                    <span className={`text-[11px] font-black w-9 text-right ${isClassic ? 'text-theme-warning' : 'text-theme-text'}`}>{group.typeCurve.di}%</span>
                </div>
            </div>

            <div>
                <label className={labelClass}>GOR (MCF/BBL)</label>
                <input type="number" step="0.1" value={group.typeCurve.gorMcfPerBbl} onChange={e => handleTcChange('gorMcfPerBbl', e.target.value)} className={inputClass} />
            </div>
        </div>
      </AccordionSection>

      <AccordionSection id="CAPEX" title="CAPEX Logic" isOpen={activeSection === 'CAPEX'} onToggle={setActiveSection}>
         <CapexControls capex={group.capex} onChange={handleCapexChange} focusEditSignal={capexEditSignal} />
      </AccordionSection>

      <AccordionSection id="OPEX" title="LOE / Operating Expenses" isOpen={activeSection === 'OPEX'} onToggle={setActiveSection}>
        <OpexControls opex={group.opex} onChange={handleOpexChange} />
      </AccordionSection>

      <AccordionSection id="OWNERSHIP" title="Ownership / Revenue Interest" isOpen={activeSection === 'OWNERSHIP'} onToggle={setActiveSection}>
        <OwnershipControls ownership={group.ownership} onChange={handleOwnershipChange} />
      </AccordionSection>
    </div>
  );
};

export default Controls;
