
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_WELLS, DEFAULT_TYPE_CURVE, DEFAULT_CAPEX, DEFAULT_PRICING, GROUP_COLORS } from './constants';
import { WellGroup } from './types';
import MapVisualizer from './components/MapVisualizer';
import Controls from './components/Controls';
import Charts from './components/Charts';
import GroupList from './components/GroupList';
import ScenarioDashboard from './components/ScenarioDashboard'; // UPDATED
import { calculateEconomics, aggregateEconomics } from './utils/economics';
import { generateDealAnalysis } from './services/geminiService';

type ViewMode = 'DASHBOARD' | 'ANALYSIS'; 

const App: React.FC = () => {
  // --- State ---
  const [viewMode, setViewMode] = useState<ViewMode>('DASHBOARD');
  
  const [groups, setGroups] = useState<WellGroup[]>([
    {
      id: 'g-1',
      name: 'Tier 1 - Core',
      color: GROUP_COLORS[0],
      wellIds: new Set(MOCK_WELLS.map(w => w.id)),
      typeCurve: { ...DEFAULT_TYPE_CURVE },
      capex: { ...DEFAULT_CAPEX },
      pricing: { ...DEFAULT_PRICING }
    }
  ]);
  
  const [activeGroupId, setActiveGroupId] = useState<string>('g-1');
  const [selectedWellIds, setSelectedWellIds] = useState<Set<string>>(new Set());
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  // --- Computed Economics per Group ---
  // Note: For Dashboard view, we use the Group's internal schedule (which exists in capex)
  const processedGroups = useMemo(() => {
    return groups.map(group => {
      const groupWells = MOCK_WELLS.filter(w => group.wellIds.has(w.id));
      const { flow, metrics } = calculateEconomics(groupWells, group.typeCurve, group.capex, group.pricing);
      return { ...group, flow, metrics };
    });
  }, [groups]);

  // --- Aggregate Portfolio Economics (For Dashboard) ---
  const { flow: aggregateFlow, metrics: aggregateMetrics } = useMemo(() => {
    return aggregateEconomics(processedGroups);
  }, [processedGroups]);

  // --- Handlers ---
  const activeGroup = processedGroups.find(g => g.id === activeGroupId) || processedGroups[0];

  const handleUpdateGroup = (updatedGroup: WellGroup) => {
    setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
  };

  const handleAddGroup = () => {
    const newId = `g-${Date.now()}`;
    const color = GROUP_COLORS[groups.length % GROUP_COLORS.length];
    const newGroup: WellGroup = {
      id: newId,
      name: `Group ${groups.length + 1}`,
      color,
      wellIds: new Set(),
      typeCurve: { ...DEFAULT_TYPE_CURVE },
      capex: { ...DEFAULT_CAPEX },
      pricing: { ...DEFAULT_PRICING }
    };
    setGroups([...groups, newGroup]);
    setActiveGroupId(newId);
  };

  const handleCloneGroup = (groupId: string) => {
    const sourceGroup = groups.find(g => g.id === groupId);
    if (!sourceGroup) return;
    const newId = `g-${Date.now()}`;
    const color = GROUP_COLORS[(groups.length) % GROUP_COLORS.length];
    const newGroup: WellGroup = {
        id: newId,
        name: `${sourceGroup.name} (Copy)`,
        color: color,
        wellIds: new Set(sourceGroup.wellIds),
        typeCurve: { ...sourceGroup.typeCurve },
        capex: { 
            ...sourceGroup.capex, 
            items: sourceGroup.capex.items.map(i => ({...i, id: `c-${Date.now()}-${Math.random()}`})) 
        },
        pricing: { ...sourceGroup.pricing }
    };
    setGroups([...groups, newGroup]);
    setActiveGroupId(newId);
  };

  const handleAssignWellsToActive = () => {
    if (selectedWellIds.size === 0) return;
    setGroups(prevGroups => {
      return prevGroups.map(g => {
        const nextIds = new Set(g.wellIds);
        if (g.id === activeGroupId) {
          selectedWellIds.forEach(id => nextIds.add(id));
        } else {
          selectedWellIds.forEach(id => nextIds.delete(id));
        }
        return { ...g, wellIds: nextIds };
      });
    });
    setSelectedWellIds(new Set());
  };

  const handleCreateGroupFromSelection = () => {
    if (selectedWellIds.size === 0) return;
    const newId = `g-${Date.now()}`;
    const color = GROUP_COLORS[groups.length % GROUP_COLORS.length];
    const newGroup: WellGroup = {
      id: newId,
      name: `Selection Set ${groups.length + 1}`,
      color,
      wellIds: new Set(selectedWellIds),
      typeCurve: { ...DEFAULT_TYPE_CURVE },
      capex: { ...DEFAULT_CAPEX },
      pricing: { ...DEFAULT_PRICING }
    };
    setGroups(prevGroups => {
        const updatedPrevGroups = prevGroups.map(g => {
            const nextIds = new Set(g.wellIds);
            selectedWellIds.forEach(id => nextIds.delete(id));
            return { ...g, wellIds: nextIds };
        });
        return [...updatedPrevGroups, newGroup];
    });
    setActiveGroupId(newId);
    setSelectedWellIds(new Set());
  };

  const handleToggleWell = (id: string) => {
    setSelectedWellIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectWells = (ids: string[]) => {
      setSelectedWellIds(prev => {
          const next = new Set(prev);
          ids.forEach(id => next.add(id));
          return next;
      });
  };

  const handleSelectAll = () => {
    if (selectedWellIds.size === MOCK_WELLS.length) {
      setSelectedWellIds(new Set());
    } else {
      setSelectedWellIds(new Set(MOCK_WELLS.map(w => w.id)));
    }
  };

  const handleGenerateAnalysis = async () => {
    if (aggregateMetrics.wellCount === 0) return;
    setLoadingAi(true);
    setAiAnalysis('');
    const result = await generateDealAnalysis(
        aggregateMetrics, 
        activeGroup.typeCurve, 
        activeGroup.pricing, 
        aggregateMetrics.wellCount
    );
    setAiAnalysis(result);
    setLoadingAi(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-300 font-sans selection:bg-blue-500/30">
      
      {/* App Header */}
      <header className="bg-slate-900/60 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center font-black text-white text-xs shadow-blue-500/20 shadow-lg">SV</div>
                <h1 className="text-sm font-semibold tracking-wide text-slate-100 hidden md:block">StrataValuator <span className="text-slate-500 font-normal ml-2">| Portfolio Edition</span></h1>
            </div>
            
            {/* Navigation Tabs */}
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1 space-x-1">
                <button 
                    onClick={() => setViewMode('DASHBOARD')}
                    className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${viewMode === 'DASHBOARD' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Dashboard (Design)
                </button>
                <button 
                    onClick={() => setViewMode('ANALYSIS')}
                    className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${viewMode === 'ANALYSIS' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Scenario Analysis
                </button>
            </div>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-[1920px] mx-auto w-full">
        
        {viewMode === 'ANALYSIS' ? (
             <ScenarioDashboard groups={processedGroups} wells={MOCK_WELLS} />
        ) : (
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
                {/* LEFT: Inputs (Tier 3) */}
                <aside className="lg:col-span-3 space-y-6 overflow-y-auto max-h-[calc(100vh-6rem)] pr-2 scrollbar-hide">
                    <GroupList 
                        groups={processedGroups}
                        activeGroupId={activeGroupId}
                        selectedWellCount={selectedWellIds.size}
                        onActivateGroup={setActiveGroupId}
                        onAddGroup={handleAddGroup}
                        onCloneGroup={handleCloneGroup}
                        onAssignWells={handleAssignWellsToActive}
                        onCreateGroupFromSelection={handleCreateGroupFromSelection}
                    />
                    <hr className="border-slate-800" />
                    <Controls group={activeGroup} onUpdateGroup={handleUpdateGroup} />
                </aside>

                {/* MIDDLE: Visuals (Tier 2/3) */}
                <section className="lg:col-span-5 flex flex-col space-y-6">
                    {/* Map - Visual Context */}
                    <div className="h-[450px] w-full bg-slate-800/20 backdrop-blur-sm rounded-xl border border-slate-800 p-1 shadow-inner relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none"></div>
                        <div className="flex justify-between items-center px-3 py-2 relative z-10">
                            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                Basin Map
                            </h2>
                            <div className="flex space-x-4">
                                <button onClick={handleSelectAll} className="text-[10px] text-blue-400 hover:text-blue-300 font-bold tracking-wide transition-colors">
                                    {selectedWellIds.size === MOCK_WELLS.length ? 'DESELECT ALL' : 'SELECT ALL'}
                                </button>
                            </div>
                        </div>
                        <div className="h-[calc(100%-40px)] w-full rounded-lg overflow-hidden relative z-0">
                            <MapVisualizer 
                                wells={MOCK_WELLS} 
                                selectedWellIds={selectedWellIds}
                                groups={processedGroups}
                                onToggleWell={handleToggleWell}
                                onSelectWells={handleSelectWells}
                            />
                        </div>
                    </div>

                    {/* AI Analysis - Contextual */}
                    <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-800 p-5 shadow-lg relative overflow-hidden">
                        {/* Decorative gradient blob */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>

                        <div className="flex justify-between items-center mb-4 relative z-10">
                            <h3 className="text-purple-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                <span className="text-lg">✨</span> Generated Memo
                            </h3>
                            <button 
                                onClick={handleGenerateAnalysis}
                                disabled={loadingAi || aggregateMetrics.wellCount === 0}
                                className={`text-[10px] px-3 py-1.5 rounded font-bold uppercase tracking-wide transition-all shadow-lg ${
                                    loadingAi 
                                    ? 'text-slate-500 bg-slate-800' 
                                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 hover:shadow-purple-500/25'
                                }`}
                            >
                                {loadingAi ? 'Thinking...' : 'Run Analysis'}
                            </button>
                        </div>
                        <div className="text-sm text-slate-400 leading-relaxed font-light min-h-[80px] relative z-10">
                            {aiAnalysis ? (
                                <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
                                    {aiAnalysis}
                                </div>
                            ) : (
                                <p className="text-slate-600 italic text-xs border-l-2 border-slate-700 pl-3">
                                    Select wells and configure assumptions to generate an AI investment memo.
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {/* RIGHT: KPIs & Economics (Tier 1 & 2) */}
                <section className="lg:col-span-4 flex flex-col space-y-8">
                    
                    {/* TIER 1: KPIs */}
                    <div className="space-y-4">
                        {/* Primary Metric: NPV */}
                        <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-black rounded-2xl border border-slate-700/50 p-6 shadow-2xl relative overflow-hidden group hover:border-slate-600 transition-colors">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Net Present Value (10%)</p>
                            <div className="flex items-baseline relative z-10">
                                <span className={`text-6xl font-black tracking-tighter drop-shadow-lg ${aggregateMetrics.npv10 >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    ${(aggregateMetrics.npv10 / 1e6).toFixed(1)}
                                </span>
                                <span className="text-2xl font-bold text-slate-600 ml-2">MM</span>
                            </div>
                        </div>

                        {/* Secondary Metrics Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/40 backdrop-blur rounded-xl border border-slate-800 p-5 hover:bg-slate-800/60 transition-colors">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Total Capital</p>
                                <p className="text-3xl font-bold text-slate-200">
                                    ${(aggregateMetrics.totalCapex / 1e6).toFixed(1)}<span className="text-lg text-slate-600 font-medium">MM</span>
                                </p>
                            </div>
                            <div className="bg-slate-800/40 backdrop-blur rounded-xl border border-slate-800 p-5 hover:bg-slate-800/60 transition-colors">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Portfolio EUR</p>
                                <p className="text-3xl font-bold text-slate-200">
                                    {(aggregateMetrics.eur / 1e3).toFixed(0)}<span className="text-lg text-slate-600 font-medium">MBoe</span>
                                </p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/40 backdrop-blur rounded-xl border border-slate-800 p-5 hover:bg-slate-800/60 transition-colors">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Payout</p>
                                <p className="text-3xl font-bold text-slate-200">
                                    {aggregateMetrics.payoutMonths > 0 ? aggregateMetrics.payoutMonths : '-'}<span className="text-lg text-slate-600 font-medium"> Mo</span>
                                </p>
                            </div>
                            <div className="bg-slate-800/40 backdrop-blur rounded-xl border border-slate-800 p-5 hover:bg-slate-800/60 transition-colors">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Well Count</p>
                                <p className="text-3xl font-bold text-slate-200">
                                    {aggregateMetrics.wellCount}<span className="text-lg text-slate-600 font-medium"> Wells</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* TIER 2: Charts */}
                    <div className="flex-1 min-h-[300px] bg-slate-900/20 rounded-xl border border-slate-800/50 p-1">
                        <Charts data={aggregateFlow} />
                    </div>

                </section>
             </div>
        )}

      </main>
    </div>
  );
};

export default App;
