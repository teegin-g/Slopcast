import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_WELLS, DEFAULT_TYPE_CURVE, DEFAULT_CAPEX, DEFAULT_PRICING, GROUP_COLORS } from './constants';
import { WellGroup } from './types';
import MapVisualizer from './components/MapVisualizer';
import Controls from './components/Controls';
import Charts from './components/Charts';
import GroupList from './components/GroupList';
import ScenarioDashboard from './components/ScenarioDashboard';
import { calculateEconomics, aggregateEconomics } from './utils/economics';
import { generateDealAnalysis } from './services/geminiService';

type ViewMode = 'DASHBOARD' | 'ANALYSIS'; 
type AppTheme = 'slate' | 'synthwave';

const App: React.FC = () => {
  // --- State ---
  const [viewMode, setViewMode] = useState<ViewMode>('DASHBOARD');
  const [theme, setTheme] = useState<AppTheme>('synthwave');
  
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

  // --- Effects ---
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // --- Computed Economics per Group ---
  const processedGroups = useMemo(() => {
    return groups.map(group => {
      const groupWells = MOCK_WELLS.filter(w => group.wellIds.has(w.id));
      const { flow, metrics } = calculateEconomics(groupWells, group.typeCurve, group.capex, group.pricing);
      return { ...group, flow, metrics };
    });
  }, [groups]);

  // --- Aggregate Portfolio Economics ---
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

  const isSynthwave = theme === 'synthwave';

  return (
    <div className="min-h-screen bg-transparent theme-transition">
      
      {/* App Header */}
      <header className={`backdrop-blur-md border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm theme-transition ${isSynthwave ? 'bg-theme-surface1/80 border-theme-border' : 'bg-slate-900/60 border-slate-800'}`}>
        <div className="flex items-center space-x-12">
            <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center theme-transition overflow-hidden ${isSynthwave ? 'bg-transparent' : 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-500/20 shadow-lg'}`}>
                    <img 
                      src="sandbox:/mnt/data/slopcast_logo_transparent.png" 
                      alt="SC" 
                      className={`w-full h-full object-contain ${isSynthwave ? 'filter drop-shadow-[0_0_8px_rgba(158,211,240,0.6)]' : 'invert brightness-200'}`} 
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent && !parent.querySelector('.brand-fallback')) {
                          const span = document.createElement('span');
                          span.innerText = isSynthwave ? 'SC' : 'SV';
                          span.className = 'text-theme-cyan brand-title text-xl brand-fallback';
                          parent.appendChild(span);
                        }
                      }}
                    />
                </div>
                <div className="flex flex-col pr-8 border-r border-white/5">
                  <h1 className={`text-xl leading-tight theme-transition tracking-tight ${isSynthwave ? 'brand-title text-theme-cyan' : 'text-slate-100 font-bold'}`}>
                      {isSynthwave ? 'SLOPCAST' : 'StrataValuator'}
                  </h1>
                  <span className={`text-[10px] uppercase font-bold tracking-[0.2em] theme-transition ${isSynthwave ? 'text-theme-magenta glow-magenta' : 'text-slate-500'}`}>
                    {isSynthwave ? 'Electric Forecast' : 'Deal Intelligence'}
                  </span>
                </div>

                {isSynthwave && (
                   <div className="hidden xl:block h-10 overflow-hidden rounded border border-theme-border/20">
                      <img 
                        src="sandbox:/mnt/data/slopcast_logo_banner.png" 
                        alt="" 
                        className="h-full w-auto opacity-80"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                   </div>
                )}
            </div>
            
            {/* Navigation Tabs */}
            <div className={`flex rounded-lg p-1 space-x-1 border theme-transition ${isSynthwave ? 'bg-theme-bg border-theme-border' : 'bg-slate-900 border-slate-800'}`}>
                <button 
                    onClick={() => setViewMode('DASHBOARD')}
                    className={`px-5 py-2 rounded text-[10px] font-bold uppercase tracking-widest theme-transition ${viewMode === 'DASHBOARD' ? (isSynthwave ? 'bg-theme-magenta text-white shadow-glow-magenta' : 'bg-slate-800 text-white shadow-sm') : 'text-theme-muted hover:text-theme-text'}`}
                >
                    DESIGN
                </button>
                <button 
                    onClick={() => setViewMode('ANALYSIS')}
                    className={`px-5 py-2 rounded text-[10px] font-bold uppercase tracking-widest theme-transition ${viewMode === 'ANALYSIS' ? (isSynthwave ? 'bg-theme-magenta text-white shadow-glow-magenta' : 'bg-slate-800 text-white shadow-sm') : 'text-theme-muted hover:text-theme-text'}`}
                >
                    SCENARIOS
                </button>
            </div>
        </div>

        {/* Theme Switcher */}
        <div className={`flex items-center rounded-full p-1 border theme-transition ${isSynthwave ? 'bg-theme-bg border-theme-border' : 'bg-black/20 border-white/10'}`}>
            <button 
              onClick={() => setTheme('slate')}
              className={`w-8 h-8 rounded-full flex items-center justify-center theme-transition ${theme === 'slate' ? 'bg-blue-600 text-white scale-110 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              title="Slate Theme"
            >
              <span className="text-xs">🏢</span>
            </button>
            <button 
              onClick={() => setTheme('synthwave')}
              className={`w-8 h-8 rounded-full flex items-center justify-center theme-transition ${theme === 'synthwave' ? 'bg-theme-magenta text-white scale-110 shadow-glow-magenta' : 'text-slate-500 hover:text-slate-300'}`}
              title="Slopcast Theme"
            >
              <span className="text-xs">🕹️</span>
            </button>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-[1920px] mx-auto w-full">
        
        {viewMode === 'ANALYSIS' ? (
             <ScenarioDashboard groups={processedGroups} wells={MOCK_WELLS} />
        ) : (
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
                {/* LEFT: Inputs */}
                <aside className={`lg:col-span-3 space-y-6 overflow-y-auto max-h-[calc(100vh-8rem)] p-4 scrollbar-hide theme-transition rounded-xl ${isSynthwave ? 'neon-border-magenta bg-theme-bg/60 backdrop-blur-sm shadow-glow-magenta' : 'bg-slate-900/40 border border-slate-800'}`}>
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
                    <hr className="border-theme-border opacity-30" />
                    <Controls group={activeGroup} onUpdateGroup={handleUpdateGroup} />
                </aside>

                {/* MIDDLE: Visuals */}
                <section className="lg:col-span-5 flex flex-col space-y-6">
                    {/* Map */}
                    <div className={`h-[480px] w-full rounded-xl border shadow-card relative overflow-hidden group theme-transition ${isSynthwave ? 'bg-theme-bg border-theme-border' : 'bg-slate-800/20 border-slate-800'}`}>
                        {isSynthwave && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-theme-cyan via-theme-magenta to-theme-cyan opacity-40"></div>
                        )}
                        <div className={`absolute inset-0 bg-gradient-to-t pointer-events-none ${isSynthwave ? 'from-theme-bg via-transparent to-transparent' : 'from-slate-900/50 to-transparent'}`}></div>
                        <div className="flex justify-between items-center px-4 py-3 relative z-10 bg-black/10 backdrop-blur-sm border-b border-white/5">
                            <h2 className={`text-[11px] font-bold uppercase tracking-[0.3em] flex items-center gap-2 theme-transition ${isSynthwave ? 'text-theme-cyan' : 'text-slate-500'}`}>
                                <span className={`w-2 h-2 rounded-full animate-pulse ${isSynthwave ? 'bg-theme-cyan' : 'bg-blue-500'}`}></span>
                                Basin Visualizer
                            </h2>
                            <div className="flex space-x-6">
                                <button onClick={handleSelectAll} className={`text-[10px] font-bold tracking-[0.1em] theme-transition hover:scale-105 ${isSynthwave ? 'text-theme-lavender' : 'text-blue-400'}`}>
                                    {selectedWellIds.size === MOCK_WELLS.length ? 'DESELECT ALL' : 'SELECT ALL'}
                                </button>
                            </div>
                        </div>
                        <div className="h-[calc(100%-48px)] w-full relative z-0">
                            <MapVisualizer 
                                wells={MOCK_WELLS} 
                                selectedWellIds={selectedWellIds}
                                groups={processedGroups}
                                onToggleWell={handleToggleWell}
                                onSelectWells={handleSelectWells}
                                theme={theme}
                            />
                        </div>
                    </div>

                    {/* AI Analysis */}
                    <div className={`rounded-xl border shadow-card p-6 relative overflow-hidden theme-transition ${isSynthwave ? 'bg-theme-surface1 border-theme-border' : 'bg-slate-800/30 border-slate-800'}`}>
                        <div className={`absolute -top-10 -right-10 w-48 h-48 rounded-full blur-[80px] ${isSynthwave ? 'bg-theme-magenta/20' : 'bg-purple-500/10'}`}></div>

                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <h3 className={`text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-3 theme-transition ${isSynthwave ? 'text-theme-magenta' : 'text-purple-400'}`}>
                                <span className="text-lg leading-none">{isSynthwave ? '🕹️' : '✨'}</span> DEAL MEMO 1.0
                            </h3>
                            <button 
                                onClick={handleGenerateAnalysis}
                                disabled={loadingAi || aggregateMetrics.wellCount === 0}
                                className={`text-[10px] px-4 py-2 rounded-lg font-black uppercase tracking-widest transition-all shadow-lg ${
                                    loadingAi 
                                    ? 'text-slate-500 bg-slate-800' 
                                    : (isSynthwave 
                                        ? 'bg-theme-cyan text-theme-bg hover:shadow-glow-cyan hover:scale-105 active:scale-95' 
                                        : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90')
                                }`}
                            >
                                {loadingAi ? 'CALCULATING...' : 'EXECUTE ANALYSIS'}
                            </button>
                        </div>
                        <div className={`text-sm leading-relaxed font-normal min-h-[100px] relative z-10 theme-transition ${isSynthwave ? 'text-theme-text opacity-90' : 'text-slate-400'}`}>
                            {aiAnalysis ? (
                                <div className={`prose prose-sm max-w-none whitespace-pre-wrap ${isSynthwave ? 'prose-invert text-theme-text selection:bg-theme-magenta/30' : 'prose-invert'}`}>
                                    {aiAnalysis}
                                </div>
                            ) : (
                                <div className={`flex flex-col items-center justify-center h-24 space-y-3 ${isSynthwave ? 'text-theme-muted' : 'text-slate-600'}`}>
                                  <div className={`w-8 h-[1px] ${isSynthwave ? 'bg-theme-border' : 'bg-slate-800'}`}></div>
                                  <p className="italic text-[11px] uppercase tracking-widest text-center">
                                      Awaiting well selection & economic parameters
                                  </p>
                                  <div className={`w-8 h-[1px] ${isSynthwave ? 'bg-theme-border' : 'bg-slate-800'}`}></div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* RIGHT: KPIs & Economics */}
                <section className="lg:col-span-4 flex flex-col space-y-8">
                    
                    {/* KPIs */}
                    <div className="space-y-4">
                        <div className={`rounded-2xl border p-8 shadow-card relative overflow-hidden group theme-transition ${isSynthwave ? 'bg-theme-surface1 border-theme-border hover:border-theme-magenta hover:shadow-glow-cyan' : 'bg-gradient-to-br from-slate-800 via-slate-900 to-black border-slate-700/50 hover:border-slate-600'}`}>
                            <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] -mr-24 -mt-24 pointer-events-none transition-opacity duration-700 ${isSynthwave ? 'bg-theme-cyan/15 opacity-60 group-hover:opacity-100' : 'bg-emerald-500/5'}`}></div>
                            <p className="text-theme-muted text-[10px] font-bold uppercase tracking-[0.4em] mb-2">Portfolio NPV (10%)</p>
                            <div className="flex items-baseline relative z-10">
                                <span className={`text-7xl font-black tracking-tighter theme-transition ${isSynthwave ? 'text-theme-cyan filter drop-shadow-[0_0_15px_rgba(158,211,240,0.5)]' : (aggregateMetrics.npv10 >= 0 ? 'text-emerald-400' : 'text-red-400')}`}>
                                    ${(aggregateMetrics.npv10 / 1e6).toFixed(1)}
                                </span>
                                <span className={`text-2xl font-black ml-3 theme-transition ${isSynthwave ? 'text-theme-lavender italic' : 'text-slate-600'}`}>MM</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className={`rounded-xl border p-6 theme-transition shadow-sm ${isSynthwave ? 'bg-theme-surface1 border-theme-border hover:bg-theme-surface2' : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/60'}`}>
                                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-3 theme-transition ${isSynthwave ? 'text-theme-muted' : 'text-slate-500'}`}>Total Capex</p>
                                <p className="text-3xl font-black text-theme-text theme-transition">
                                    ${(aggregateMetrics.totalCapex / 1e6).toFixed(1)}<span className="text-lg text-theme-muted font-normal ml-1">MM</span>
                                </p>
                            </div>
                            <div className={`rounded-xl border p-6 theme-transition shadow-sm ${isSynthwave ? 'bg-theme-surface1 border-theme-border hover:bg-theme-surface2' : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/60'}`}>
                                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-3 theme-transition ${isSynthwave ? 'text-theme-muted' : 'text-slate-500'}`}>Portfolio EUR</p>
                                <p className="text-3xl font-black text-theme-text theme-transition">
                                    {(aggregateMetrics.eur / 1e3).toFixed(0)}<span className="text-lg text-theme-muted font-normal ml-1">MBOE</span>
                                </p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className={`rounded-xl border p-6 theme-transition shadow-sm ${isSynthwave ? 'bg-theme-surface1 border-theme-border hover:bg-theme-surface2' : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/60'}`}>
                                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-3 theme-transition ${isSynthwave ? 'text-theme-muted' : 'text-slate-500'}`}>Payout</p>
                                <p className="text-3xl font-black text-theme-text theme-transition">
                                    {aggregateMetrics.payoutMonths > 0 ? aggregateMetrics.payoutMonths : '-'}<span className="text-lg text-theme-muted font-normal ml-1">MO</span>
                                </p>
                            </div>
                            <div className={`rounded-xl border p-6 theme-transition shadow-sm ${isSynthwave ? 'bg-theme-surface1 border-theme-border hover:bg-theme-surface2' : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/60'}`}>
                                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-3 theme-transition ${isSynthwave ? 'text-theme-muted' : 'text-slate-500'}`}>Wells</p>
                                <p className="text-3xl font-black text-theme-text theme-transition">
                                    {aggregateMetrics.wellCount}<span className="text-lg text-theme-muted font-normal ml-1">UNIT</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className={`flex-1 min-h-[320px] rounded-xl border p-1 theme-transition ${isSynthwave ? 'bg-theme-surface1/50 border-theme-border shadow-card' : 'bg-slate-900/20 border-slate-800/50'}`}>
                        <Charts data={aggregateFlow} theme={theme} />
                    </div>

                </section>
             </div>
        )}

      </main>
    </div>
  );
};

export default App;