import React, { useState } from 'react';
import { WellGroup, TypeCurveParams, CapexAssumptions, PricingAssumptions } from '../types';
import CapexControls from './CapexControls';

interface ControlsProps {
  group: WellGroup;
  onUpdateGroup: (updatedGroup: WellGroup) => void;
}

type SectionKey = 'TYPE_CURVE' | 'CAPEX' | 'PRICING';

// --- FIXED: Defined OUTSIDE component to prevent unmounting on render ---
interface AccordionSectionProps {
  id: SectionKey;
  title: string;
  isOpen: boolean;
  onToggle: (id: SectionKey) => void;
  children: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ 
  id, 
  title, 
  isOpen,
  onToggle,
  children 
}) => {
  return (
    <div className={`
      border rounded-lg overflow-hidden transition-all duration-300 mb-3
      ${isOpen ? 'bg-slate-900 border-blue-500/30 shadow-lg shadow-blue-900/10' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'}
    `}>
      <button 
        onClick={() => onToggle(id)}
        className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${isOpen ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
      >
        <span className="text-xs font-bold uppercase tracking-widest">{title}</span>
        <span className={`transform transition-transform duration-300 text-slate-500 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-4 border-t border-slate-800/50">
          {children}
        </div>
      </div>
    </div>
  );
};

const Controls: React.FC<ControlsProps> = ({ group, onUpdateGroup }) => {
  const [activeSection, setActiveSection] = useState<SectionKey>('TYPE_CURVE');

  // --- Update Handlers ---
  const handleTcChange = (key: keyof TypeCurveParams, val: string) => {
    onUpdateGroup({
        ...group,
        typeCurve: { ...group.typeCurve, [key]: parseFloat(val) }
    });
  };

  const handleCapexChange = (updatedCapex: CapexAssumptions) => {
    onUpdateGroup({
        ...group,
        capex: updatedCapex
    });
  };
  
  const handlePricingChange = (key: keyof PricingAssumptions, val: string) => {
    onUpdateGroup({
        ...group,
        pricing: { ...group.pricing, [key]: parseFloat(val) }
    });
  };

  // --- Insight Generators ---
  const getIpInsight = (val: number) => {
    if (val >= 1000) return "🔥 High Intensity";
    if (val >= 600) return "✅ Standard Rate";
    return "⚠️ Low Perm";
  };

  const getBInsight = (val: number) => {
    if (val > 1.4) return "Late-life Uplift";
    if (val > 1.0) return "Hyperbolic Tail";
    if (val === 1.0) return "Harmonic";
    return "Exponential";
  };

  const getDeclineInsight = (val: number) => {
    if (val >= 70) return "Steep Drop";
    if (val >= 50) return "Standard Shale";
    return "Shallow";
  };

  // Common Input Style
  const inputClass = "w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-200 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all";
  const badgeClass = "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/50";

  return (
    <div className="space-y-4 pb-10">
      {/* Group Summary (Always Expanded) */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-lg p-4 mb-6 shadow-md">
        <div className="flex items-center space-x-3 mb-2">
            <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]" style={{ backgroundColor: group.color }}></div>
            <h2 className="text-slate-100 font-bold text-sm tracking-wide">{group.name}</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="bg-slate-950/50 p-2 rounded border border-slate-800">
                <span className="block text-[9px] text-slate-500 uppercase font-bold">Wells</span>
                <span className="text-slate-200 text-xs font-mono font-semibold">{group.wellIds.size}</span>
            </div>
            <div className="bg-slate-950/50 p-2 rounded border border-slate-800">
                <span className="block text-[9px] text-slate-500 uppercase font-bold">Total Cost</span>
                <span className="text-emerald-400 text-xs font-mono font-semibold">
                    ${group.metrics ? (group.metrics.totalCapex / 1e6).toFixed(1) : 0}MM
                </span>
            </div>
        </div>
      </div>

      {/* Accordions */}
      
      {/* 1. Type Curve */}
      <AccordionSection 
        id="TYPE_CURVE" 
        title="Type Curve"
        isOpen={activeSection === 'TYPE_CURVE'}
        onToggle={setActiveSection}
      >
        <div className="space-y-4">
            {/* IP Rate */}
            <div>
                <div className="flex justify-between items-center mb-1.5">
                    <label className="text-slate-400 text-[10px] uppercase font-bold">IP Rate (Bo/d)</label>
                    <span className={badgeClass}>{getIpInsight(group.typeCurve.qi)}</span>
                </div>
                <input 
                    type="number" 
                    value={group.typeCurve.qi} 
                    onChange={e => handleTcChange('qi', e.target.value)}
                    className={inputClass}
                />
            </div>

            {/* b-Factor */}
            <div>
                <div className="flex justify-between items-center mb-1.5">
                    <label className="text-slate-400 text-[10px] uppercase font-bold">b-Factor</label>
                    <span className={badgeClass}>{getBInsight(group.typeCurve.b)}</span>
                </div>
                <input 
                    type="number" 
                    step="0.1"
                    value={group.typeCurve.b} 
                    onChange={e => handleTcChange('b', e.target.value)}
                    className={inputClass}
                />
            </div>

            {/* Initial Decline */}
            <div>
                <div className="flex justify-between items-center mb-1.5">
                    <label className="text-slate-400 text-[10px] uppercase font-bold">Initial Decline (%)</label>
                    <span className={badgeClass}>{getDeclineInsight(group.typeCurve.di)}</span>
                </div>
                <div className="flex items-center space-x-3">
                    <input 
                        type="range" 
                        min="20" max="95" 
                        value={group.typeCurve.di} 
                        onChange={e => handleTcChange('di', e.target.value)}
                        className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <input 
                        type="number" 
                        value={group.typeCurve.di} 
                        onChange={e => handleTcChange('di', e.target.value)}
                        className={`${inputClass} w-16 text-center`}
                    />
                </div>
            </div>
        </div>
      </AccordionSection>

      {/* 2. CAPEX */}
      <AccordionSection 
        id="CAPEX" 
        title="CAPEX Structure"
        isOpen={activeSection === 'CAPEX'}
        onToggle={setActiveSection}
      >
         <CapexControls capex={group.capex} onChange={handleCapexChange} />
      </AccordionSection>

      {/* 3. Pricing (Extra, Collapsed) */}
      <AccordionSection 
        id="PRICING" 
        title="Pricing & Taxes"
        isOpen={activeSection === 'PRICING'}
        onToggle={setActiveSection}
      >
        <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Oil Price ($/bbl)</label>
                <div className="relative">
                    <span className="absolute left-2 top-1.5 text-slate-500 text-xs">$</span>
                    <input 
                        type="number" 
                        value={group.pricing.oilPrice} 
                        onChange={e => handlePricingChange('oilPrice', e.target.value)}
                        className={`${inputClass} pl-5`}
                    />
                </div>
            </div>
             <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">NRI (%)</label>
                <div className="relative">
                    <input 
                        type="number" 
                        step="0.1"
                        value={(group.pricing.nri * 100).toFixed(1)} 
                        onChange={e => handlePricingChange('nri', (parseFloat(e.target.value)/100).toString())}
                        className={inputClass}
                    />
                    <span className="absolute right-7 top-1.5 text-slate-500 text-xs">%</span>
                </div>
            </div>
             <div className="col-span-2">
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">LOE ($/mo/well)</label>
                <input 
                    type="number" 
                    value={group.pricing.loePerMonth} 
                    onChange={e => handlePricingChange('loePerMonth', e.target.value)}
                    className={inputClass}
                />
            </div>
        </div>
      </AccordionSection>

    </div>
  );
};

export default Controls;