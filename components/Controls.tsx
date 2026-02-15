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
          ? `sc-panel theme-transition mb-4 ${isOpen ? 'ring-2 ring-theme-warning/30' : ''}`
          : `
            border rounded-panel overflow-hidden theme-transition mb-4 shadow-sm
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
            ? `w-full flex items-center justify-between px-5 py-4 text-left transition-all sc-panelTitlebar sc-titlebar--red ${
                isOpen ? 'text-white' : 'text-white/90'
              }`
            : `w-full flex items-center justify-between px-5 py-4 text-left transition-all ${isOpen ? 'text-theme-cyan' : 'text-theme-muted'}`
        }
      >
        <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${theme.features.brandFont ? 'brand-font' : ''}`}>{title}</span>
        <span className={`transform transition-transform duration-500 opacity-30 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      
      <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className={isClassic ? 'p-5 bg-black/10' : 'p-5 border-t border-theme-border/20'}>
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
    ? 'w-full rounded-md px-3 py-2 text-xs font-black sc-inputNavy'
    : 'w-full bg-theme-bg border rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:ring-1 theme-transition border-theme-border focus:border-theme-cyan focus:ring-theme-cyan/30';

  const labelClass = isClassic
    ? 'text-[9px] font-black uppercase tracking-[0.2em] mb-2 block text-theme-warning'
    : 'text-[9px] font-black uppercase tracking-[0.2em] mb-2 block text-theme-muted';

  const badgeClass = isClassic
    ? 'text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded border border-black/30 bg-theme-cyan text-white'
    : 'text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border bg-theme-bg border-theme-border text-theme-cyan';

  return (
    <div className="space-y-4 pb-12">
      {isClassic ? (
        <div className="sc-panel theme-transition mb-8">
          <div className="sc-panelTitlebar sc-titlebar--red px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-theme-warning text-black flex items-center justify-center text-[11px] font-black">
                ✓
              </span>
              <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-white">
                {group.name}
              </h2>
            </div>
          </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <div className="border border-black/30 rounded-md overflow-hidden bg-black/10">
              <div className="sc-panelTitlebar sc-titlebar--neutral px-3 py-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">WELL COUNT</span>
              </div>
              <div className="px-3 py-3">
                <span className="text-white text-3xl font-black tracking-tight">{group.wellIds.size}</span>
              </div>
            </div>
            <div className="border border-black/30 rounded-md overflow-hidden bg-black/10">
              <div className="sc-panelTitlebar sc-titlebar--neutral px-3 py-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">TOTAL CAPEX</span>
              </div>
              <div className="px-3 py-3">
                <span className="text-white text-3xl font-black tracking-tight">
                  ${group.metrics ? (group.metrics.totalCapex / 1e6).toFixed(1) : 0}
                  <span className="text-lg font-black ml-1 opacity-90">M</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-panel border p-5 mb-8 shadow-card theme-transition bg-theme-surface1 border-theme-border/60">
          <div className="flex items-center space-x-3 mb-4">
              <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: group.color, boxShadow: theme.features.glowEffects ? `0 0 12px ${group.color}44` : 'none' }}></div>
              <h2 className={`font-black text-sm uppercase tracking-[0.1em] text-theme-text ${theme.features.brandFont ? 'brand-font' : ''}`}>{group.name}</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-inner border theme-transition bg-theme-bg border-theme-border/40">
                  <span className={labelClass}>WELL COUNT</span>
                  <span className="text-theme-text text-lg font-black tracking-tight">{group.wellIds.size}</span>
              </div>
              <div className="p-3 rounded-inner border theme-transition bg-theme-bg border-theme-border/40">
                  <span className={labelClass}>TOTAL CAPEX</span>
                  <span className="text-lg font-black tracking-tight text-theme-cyan">
                      ${group.metrics ? (group.metrics.totalCapex / 1e6).toFixed(1) : 0}M
                  </span>
              </div>
          </div>
        </div>
      )}

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
                ? 'sc-btnPrimary px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-[0.16em]'
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
        <div className="space-y-6">
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className={labelClass}>Initial Rate (BOPD)</label>
                    <span className={badgeClass}>{group.typeCurve.qi > 1000 ? "TIER 1" : "PROVEN"}</span>
                </div>
                <input type="number" value={group.typeCurve.qi} onChange={e => handleTcChange('qi', e.target.value)} className={inputClass} />
            </div>

            <div>
                <div className="flex justify-between items-center mb-2">
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
                <div className={`flex justify-between mt-1 text-[9px] font-mono ${isClassic ? 'text-white/75' : 'text-theme-muted'}`}>
                  <span>0.0</span>
                  <span className={isClassic ? 'text-theme-warning font-black' : ''}>{group.typeCurve.b}</span>
                  <span>2.0</span>
                </div>
            </div>

            <div>
                <label className={labelClass}>Effective Decline (%)</label>
                <div className="flex items-center space-x-4">
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
                    <span className={`text-xs font-black w-10 text-right ${isClassic ? 'text-theme-warning' : 'text-theme-text'}`}>{group.typeCurve.di}%</span>
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
