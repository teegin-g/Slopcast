import React, { useState, useMemo } from 'react';
import { MOCK_WELLS, DEFAULT_TYPE_CURVE, DEFAULT_CAPEX, DEFAULT_PRICING, GROUP_COLORS } from './constants';
import { WellGroup } from './types';
import MapVisualizer from './components/MapVisualizer';
import Controls from './components/Controls';
import Charts from './components/Charts';
import GroupList from './components/GroupList';
import ScenarioDashboard from './components/ScenarioDashboard';
import { calculateEconomics, aggregateEconomics } from './utils/economics';
import { generateDealAnalysis } from './services/geminiService';
import { useTheme } from './theme/ThemeProvider';

type ViewMode = 'DASHBOARD' | 'ANALYSIS'; 

const App: React.FC = () => {
  // --- Theme (from provider) ---
  const { themeId, theme, themes, setThemeId } = useTheme();
  const { features } = theme;

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

  return (
    <div className="min-h-screen bg-transparent theme-transition">
      
      {/* App Header */}
      <header className="backdrop-blur-md border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm theme-transition bg-theme-surface1/80 border-theme-border">
        <div className="flex items-center space-x-12">
            <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center theme-transition overflow-hidden bg-theme-surface2">
                    <img 
                      src="sandbox:/mnt/data/slopcast_logo_transparent.png" 
                      alt="SC" 
                      className="w-full h-full object-contain" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent && !parent.querySelector('.brand-fallback')) {
                          const span = document.createElement('span');
                          span.innerText = theme.appName.substring(0, 2);
                          span.className = 'text-theme-cyan brand-title text-xl brand-fallback';
                          parent.appendChild(span);
                        }
                      }}
                    />
                </div>
                <div className="flex flex-col pr-8 border-r border-white/5">
                  <h1 className={`text-xl leading-tight theme-transition tracking-tight text-theme-cyan ${features.brandFont ? 'brand-title' : 'font-bold'}`}>
                      {theme.appName}
                  </h1>
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] theme-transition text-theme-magenta">
                    {theme.appSubtitle}
                  </span>
                </div>

                {features.brandFont && (
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
            <div className="flex rounded-lg p-1 space-x-1 border theme-transition bg-theme-bg border-theme-border">
                <button 
                    onClick={() => setViewMode('DASHBOARD')}
                    className={`px-5 py-2 rounded text-[10px] font-bold uppercase tracking-widest theme-transition ${viewMode === 'DASHBOARD' ? 'bg-theme-cyan text-theme-bg shadow-glow-cyan' : 'text-theme-muted hover:text-theme-text'}`}
                >
                    DESIGN
                </button>
                <button 
                    onClick={() => setViewMode('ANALYSIS')}
                    className={`px-5 py-2 rounded text-[10px] font-bold uppercase tracking-widest theme-transition ${viewMode === 'ANALYSIS' ? 'bg-theme-cyan text-theme-bg shadow-glow-cyan' : 'text-theme-muted hover:text-theme-text'}`}
                >
                    SCENARIOS
                </button>
            </div>
        </div>

        {/* Theme Switcher – data-driven from THEMES registry */}
        <div className="flex items-center rounded-full p-1 border theme-transition bg-theme-bg border-theme-border">
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => setThemeId(t.id)}
                className={`w-8 h-8 rounded-full flex items-center justify-center theme-transition ${themeId === t.id ? 'bg-theme-cyan text-theme-bg scale-110 shadow-glow-cyan' : 'text-theme-muted hover:text-theme-text'}`}
                title={t.label}
              >
                <span className="text-xs">{t.icon}</span>
              </button>
            ))}
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-[1920px] mx-auto w-full">
        
        {viewMode === 'ANALYSIS' ? (
             <ScenarioDashboard groups={processedGroups} wells={MOCK_WELLS} />
        ) : (
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
                {/* LEFT: Inputs */}
                <aside className="lg:col-span-3 space-y-6 overflow-y-auto max-h-[calc(100vh-8rem)] p-4 scrollbar-hide theme-transition rounded-xl bg-theme-bg/60 backdrop-blur-sm border border-theme-border">
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
                    <div className="h-[480px] w-full rounded-xl border shadow-card relative overflow-hidden group theme-transition bg-theme-bg border-theme-border">
                        {features.glowEffects && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-theme-cyan via-theme-magenta to-theme-cyan opacity-40"></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-theme-bg via-transparent to-transparent pointer-events-none"></div>
                        <div className="flex justify-between items-center px-4 py-3 relative z-10 bg-black/10 backdrop-blur-sm border-b border-white/5">
                            <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] flex items-center gap-2 theme-transition text-theme-cyan">
                                <span className="w-2 h-2 rounded-full animate-pulse bg-theme-cyan"></span>
                                Basin Visualizer
                            </h2>
                            <div className="flex space-x-6">
                                <button onClick={handleSelectAll} className="text-[10px] font-bold tracking-[0.1em] theme-transition hover:scale-105 text-theme-lavender">
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
                                themeId={themeId}
                            />
                        </div>
                    </div>

                    {/* AI Analysis */}
                    <div className="rounded-xl border shadow-card p-6 relative overflow-hidden theme-transition bg-theme-surface1 border-theme-border">
                        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-[80px] bg-theme-magenta/20"></div>

                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-3 theme-transition text-theme-magenta">
                                <span className="text-lg leading-none">{theme.icon}</span> DEAL MEMO 1.0
                            </h3>
                            <button 
                                onClick={handleGenerateAnalysis}
                                disabled={loadingAi || aggregateMetrics.wellCount === 0}
                                className={`text-[10px] px-4 py-2 rounded-lg font-black uppercase tracking-widest transition-all shadow-lg ${
                                    loadingAi 
                                    ? 'text-theme-muted bg-theme-surface2' 
                                    : 'bg-theme-cyan text-theme-bg hover:shadow-glow-cyan hover:scale-105 active:scale-95'
                                }`}
                            >
                                {loadingAi ? 'CALCULATING...' : 'EXECUTE ANALYSIS'}
                            </button>
                        </div>
                        <div className="text-sm leading-relaxed font-normal min-h-[100px] relative z-10 theme-transition text-theme-text opacity-90">
                            {aiAnalysis ? (
                                <div className="prose prose-sm max-w-none whitespace-pre-wrap prose-invert text-theme-text selection:bg-theme-magenta/30">
                                    {aiAnalysis}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-24 space-y-3 text-theme-muted">
                                  <div className="w-8 h-[1px] bg-theme-border"></div>
                                  <p className="italic text-[11px] uppercase tracking-widest text-center">
                                      Awaiting well selection & economic parameters
                                  </p>
                                  <div className="w-8 h-[1px] bg-theme-border"></div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* RIGHT: KPIs & Economics */}
                <section className="lg:col-span-4 flex flex-col space-y-8">
                    
                    {/* KPIs */}
                    <div className="space-y-4">
                        <div className="rounded-2xl border p-8 shadow-card relative overflow-hidden group theme-transition bg-theme-surface1 border-theme-border hover:border-theme-magenta">
                            <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] -mr-24 -mt-24 pointer-events-none transition-opacity duration-700 bg-theme-cyan/15 opacity-60 group-hover:opacity-100"></div>
                            <p className="text-theme-muted text-[10px] font-bold uppercase tracking-[0.4em] mb-2">Portfolio NPV (10%)</p>
                            <div className="flex items-baseline relative z-10">
                                <span className={`text-7xl font-black tracking-tighter theme-transition text-theme-cyan ${features.glowEffects ? 'filter drop-shadow-[0_0_15px_rgba(158,211,240,0.5)]' : ''}`}>
                                    ${(aggregateMetrics.npv10 / 1e6).toFixed(1)}
                                </span>
                                <span className="text-2xl font-black ml-3 theme-transition text-theme-lavender italic">MM</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-xl border p-6 theme-transition shadow-sm bg-theme-surface1 border-theme-border hover:bg-theme-surface2">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 theme-transition text-theme-muted">Total Capex</p>
                                <p className="text-3xl font-black text-theme-text theme-transition">
                                    ${(aggregateMetrics.totalCapex / 1e6).toFixed(1)}<span className="text-lg text-theme-muted font-normal ml-1">MM</span>
                                </p>
                            </div>
                            <div className="rounded-xl border p-6 theme-transition shadow-sm bg-theme-surface1 border-theme-border hover:bg-theme-surface2">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 theme-transition text-theme-muted">Portfolio EUR</p>
                                <p className="text-3xl font-black text-theme-text theme-transition">
                                    {(aggregateMetrics.eur / 1e3).toFixed(0)}<span className="text-lg text-theme-muted font-normal ml-1">MBOE</span>
                                </p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-xl border p-6 theme-transition shadow-sm bg-theme-surface1 border-theme-border hover:bg-theme-surface2">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 theme-transition text-theme-muted">Payout</p>
                                <p className="text-3xl font-black text-theme-text theme-transition">
                                    {aggregateMetrics.payoutMonths > 0 ? aggregateMetrics.payoutMonths : '-'}<span className="text-lg text-theme-muted font-normal ml-1">MO</span>
                                </p>
                            </div>
                            <div className="rounded-xl border p-6 theme-transition shadow-sm bg-theme-surface1 border-theme-border hover:bg-theme-surface2">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 theme-transition text-theme-muted">Wells</p>
                                <p className="text-3xl font-black text-theme-text theme-transition">
                                    {aggregateMetrics.wellCount}<span className="text-lg text-theme-muted font-normal ml-1">UNIT</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="flex-1 min-h-[320px] rounded-xl border p-1 theme-transition bg-theme-surface1/50 border-theme-border shadow-card">
                        <Charts data={aggregateFlow} themeId={themeId} />
                    </div>

                </section>
             </div>
        )}

      </main>
    </div>
  );
};

export default App;
