import React, { useMemo, useState } from 'react';
import { OpexAssumptions, OwnershipAssumptions, WellGroup, CapexAssumptions } from '../types';
import CapexControls from './CapexControls';
import OpexControls from './OpexControls';
import OwnershipControls from './OwnershipControls';
import DeclineSegmentTable from './DeclineSegmentTable';
import { useTheme } from '../theme/ThemeProvider';
import { ASSUMPTION_TEMPLATES, AssumptionTemplate } from '../constants/templates';
import { DEFAULT_SEGMENTS } from '../constants';

interface ControlsProps {
  group: WellGroup;
  onUpdateGroup: (updatedGroup: WellGroup) => void;
  onMarkDirty?: () => void;
  openSectionKey?: 'TYPE_CURVE' | 'CAPEX' | 'OPEX' | 'OWNERSHIP' | null;
  onOpenSectionHandled?: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  group,
  onUpdateGroup,
  onMarkDirty,
}) => {
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<AssumptionTemplate | null>(null);
  const { theme } = useTheme();
  const isClassic = theme.id === 'mario';

  const applyTemplate = (template: AssumptionTemplate) => {
    const newCapexItems = template.capexItems.map(item => ({
      ...item,
      id: `c-${Date.now()}-${Math.random()}`,
    }));
    onUpdateGroup({
      ...group,
      typeCurve: { ...template.typeCurve },
      capex: { ...group.capex, items: newCapexItems },
    });
    if (onMarkDirty) onMarkDirty();
    setPendingTemplate(null);
    setShowTemplateMenu(false);
  };

  const handleTemplateSelect = (template: AssumptionTemplate) => {
    if (group.capex.items.length > 0 || group.typeCurve.qi !== 850) {
      setPendingTemplate(template);
    } else {
      applyTemplate(template);
    }
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

  const labelClass = isClassic
    ? 'text-[9px] font-black uppercase tracking-[0.2em] mb-1 block text-theme-warning'
    : 'text-[9px] font-black uppercase tracking-[0.2em] mb-1 block text-theme-muted';

  const sectionHeaderClass = isClassic
    ? 'text-[10px] font-black uppercase tracking-[0.22em] text-white pb-2 mb-3 border-b border-white/10'
    : 'text-[10px] font-black uppercase tracking-[0.22em] text-theme-cyan pb-2 mb-3 border-b border-theme-border';

  return (
    <div className="space-y-4 pb-12">
      {/* Group header */}
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

      {/* Template selector */}
      <div className="relative">
        <div
          className={
            isClassic
              ? 'sc-panel theme-transition mb-3'
              : 'rounded-panel border p-3 mb-3 shadow-card theme-transition bg-theme-surface1/60 border-theme-border/60'
          }
        >
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isClassic ? 'text-white/70' : 'text-theme-muted'}`}>
              Template
            </span>
            <button
              onClick={() => setShowTemplateMenu(prev => !prev)}
              className={`px-3 py-1.5 rounded-inner text-[9px] font-bold uppercase tracking-[0.14em] transition-all border ${
                isClassic
                  ? 'bg-black/15 text-white border-black/30 hover:bg-black/25'
                  : 'bg-theme-bg text-theme-cyan border-theme-border hover:border-theme-cyan'
              }`}
            >
              {showTemplateMenu ? 'Close' : 'Apply Template'}
            </button>
          </div>

          {showTemplateMenu && (
            <div className="mt-2 space-y-1">
              {ASSUMPTION_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTemplateSelect(t)}
                  className={`w-full text-left px-3 py-2 rounded-inner border transition-all ${
                    isClassic
                      ? 'bg-black/10 border-black/20 hover:bg-black/20 text-white'
                      : 'bg-theme-bg border-theme-border hover:border-theme-cyan text-theme-text'
                  }`}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.1em]">{t.name}</p>
                  <p className={`text-[9px] mt-0.5 ${isClassic ? 'text-white/60' : 'text-theme-muted'}`}>
                    {t.description} · Qi: {t.typeCurve.qi} BOPD
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Confirmation dialog */}
        {pendingTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className={`max-w-sm w-full mx-4 p-4 rounded-panel border shadow-card ${
              isClassic ? 'sc-panel' : 'bg-theme-surface1 border-theme-border'
            }`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.16em] mb-2 ${isClassic ? 'text-white' : 'text-theme-text'}`}>
                Apply "{pendingTemplate.name}"?
              </p>
              <p className={`text-[10px] mb-4 ${isClassic ? 'text-white/70' : 'text-theme-muted'}`}>
                This will overwrite the current type curve and CAPEX items for {group.name}.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => applyTemplate(pendingTemplate)}
                  className="flex-1 px-3 py-2 rounded-inner text-[10px] font-bold uppercase tracking-[0.12em] bg-theme-magenta text-white hover:shadow-glow-magenta transition-all"
                >
                  Apply
                </button>
                <button
                  onClick={() => setPendingTemplate(null)}
                  className={`flex-1 px-3 py-2 rounded-inner text-[10px] font-bold uppercase tracking-[0.12em] border transition-all ${
                    isClassic
                      ? 'bg-black/15 text-white border-black/30'
                      : 'bg-theme-bg text-theme-muted border-theme-border'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CAPEX Snapshot */}
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
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className={isClassic ? 'rounded-inner border border-black/30 bg-black/10 p-2' : 'rounded-inner border border-theme-border bg-theme-bg p-2'}>
            <p className={labelClass}>Total</p>
            <p className={isClassic ? 'text-white text-base font-black' : 'text-theme-text text-base font-black'}>
              ${(capexSummary.total / 1e6).toFixed(2)}M
            </p>
          </div>
          <div className={isClassic ? 'rounded-inner border border-black/30 bg-black/10 p-2' : 'rounded-inner border border-theme-border bg-theme-bg p-2'}>
            <p className={labelClass}>Per Well</p>
            <p className={isClassic ? 'text-white text-base font-black' : 'text-theme-text text-base font-black'}>
              ${(capexSummary.perWell / 1e6).toFixed(2)}M
            </p>
          </div>
          <div className={isClassic ? 'rounded-inner border border-black/30 bg-black/10 p-2' : 'rounded-inner border border-theme-border bg-theme-bg p-2'}>
            <p className={labelClass}>Line Items</p>
            <p className={isClassic ? 'text-white text-base font-black' : 'text-theme-text text-base font-black'}>
              {capexSummary.itemCount}
            </p>
          </div>
        </div>
      </div>

      {/* Type Curve Section -- segment table */}
      <div
        className={
          isClassic
            ? 'sc-panel theme-transition mb-3 p-4'
            : 'rounded-panel border p-4 shadow-card theme-transition mb-3 bg-theme-surface1/40 border-theme-border'
        }
      >
        <h3 className={sectionHeaderClass}>Decline Profile</h3>
        <DeclineSegmentTable
          segments={group.typeCurve.segments || DEFAULT_SEGMENTS}
          gorMcfPerBbl={group.typeCurve.gorMcfPerBbl}
          onChange={(segments, gor) => {
            const firstSeg = segments[0];
            onUpdateGroup({
              ...group,
              typeCurve: {
                ...group.typeCurve,
                qi: firstSeg?.qi ?? group.typeCurve.qi,
                b: firstSeg?.b ?? group.typeCurve.b,
                di: firstSeg?.initialDecline ?? group.typeCurve.di,
                gorMcfPerBbl: gor,
                segments,
              }
            });
            if (onMarkDirty) onMarkDirty();
          }}
        />
      </div>

      {/* CAPEX Section -- flat, always visible */}
      <div
        className={
          isClassic
            ? 'sc-panel theme-transition mb-3 p-4'
            : 'rounded-panel border p-4 shadow-card theme-transition mb-3 bg-theme-surface1/40 border-theme-border'
        }
      >
        <h3 className={sectionHeaderClass}>CAPEX Logic</h3>
        <CapexControls capex={group.capex} onChange={handleCapexChange} />
      </div>

      {/* OPEX Section -- flat, always visible */}
      <div
        className={
          isClassic
            ? 'sc-panel theme-transition mb-3 p-4'
            : 'rounded-panel border p-4 shadow-card theme-transition mb-3 bg-theme-surface1/40 border-theme-border'
        }
      >
        <h3 className={sectionHeaderClass}>LOE / Operating Expenses</h3>
        <OpexControls opex={group.opex} onChange={handleOpexChange} />
      </div>

      {/* Ownership Section -- flat, always visible */}
      <div
        className={
          isClassic
            ? 'sc-panel theme-transition mb-3 p-4'
            : 'rounded-panel border p-4 shadow-card theme-transition mb-3 bg-theme-surface1/40 border-theme-border'
        }
      >
        <h3 className={sectionHeaderClass}>Ownership / Revenue Interest</h3>
        <OwnershipControls ownership={group.ownership} onChange={handleOwnershipChange} />
      </div>
    </div>
  );
};

export default Controls;
