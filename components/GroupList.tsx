import React from 'react';
import { WellGroup } from '../types';

interface GroupListProps {
  groups: WellGroup[];
  activeGroupId: string;
  selectedWellCount: number;
  onActivateGroup: (id: string) => void;
  onAddGroup: () => void;
  onCloneGroup: (groupId: string) => void;
  onAssignWells: () => void;
  onCreateGroupFromSelection: () => void;
}

const GroupList: React.FC<GroupListProps> = ({ 
  groups, activeGroupId, selectedWellCount, onActivateGroup, onAddGroup, onCloneGroup, onAssignWells, onCreateGroupFromSelection 
}) => {
  const theme = document.documentElement.getAttribute('data-theme') || 'slate';
  const isSynthwave = theme === 'synthwave';

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className={`font-semibold text-sm uppercase tracking-wide ${isSynthwave ? 'brand-font text-theme-cyan' : 'text-slate-300'}`}>Scenarios / Groups</h3>
            <button 
                onClick={onAddGroup}
                className={`text-[10px] px-3 py-1 rounded transition-all font-bold uppercase border ${isSynthwave ? 'bg-theme-magenta/20 hover:bg-theme-magenta/40 text-theme-magenta border-theme-magenta/30 glow-magenta' : 'bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border-blue-500/30'}`}
            >
                + New Group
            </button>
        </div>

        <div className="space-y-3">
            {groups.map(group => {
                const isActive = group.id === activeGroupId;
                return (
                    <div 
                        key={group.id}
                        onClick={() => onActivateGroup(group.id)}
                        className={`
                            relative p-3 rounded-lg border cursor-pointer transition-all duration-200 group
                            ${isActive 
                                ? (isSynthwave ? 'bg-theme-surface2 border-theme-magenta glow-magenta scale-[1.01]' : 'bg-slate-800 border-blue-500 shadow-md scale-[1.01]') 
                                : (isSynthwave ? 'bg-theme-surface1/60 border-theme-border hover:bg-theme-surface1 hover:border-theme-lavender hover:scale-[1.01]' : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 hover:scale-[1.01]')}
                        `}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${isActive ? 'ring-2 ring-offset-1 ring-offset-theme-bg ring-white/20' : ''}`} style={{ backgroundColor: group.color }}></div>
                                <span className={`font-bold text-sm ${isActive ? 'text-white' : 'text-theme-muted'}`}>{group.name}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onCloneGroup(group.id); }}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-theme-muted hover:text-white transition-all"
                                    title="Clone Group"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                </button>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${isSynthwave ? 'bg-theme-bg border-theme-border text-theme-cyan' : 'bg-slate-950/50 border-slate-700 text-slate-400'}`}>
                                    {group.wellIds.size} Wells
                                </span>
                            </div>
                        </div>
                        
                        {group.metrics && (
                            <div className={`grid grid-cols-2 gap-2 text-[10px] mt-2 pt-2 border-t transition-all ${isSynthwave ? 'border-theme-border/30 text-theme-muted' : 'border-slate-700/30 text-slate-400'}`}>
                                <div>
                                    <span className={`block font-bold uppercase text-[9px] ${isSynthwave ? 'text-theme-lavender' : 'text-slate-500'}`}>NPV10</span>
                                    <span className={`font-mono ${group.metrics.npv10 >= 0 ? (isSynthwave ? "text-theme-cyan" : "text-emerald-400") : "text-red-400"}`}>
                                        ${(group.metrics.npv10 / 1e6).toFixed(1)}M
                                    </span>
                                </div>
                                <div>
                                    <span className={`block font-bold uppercase text-[9px] ${isSynthwave ? 'text-theme-lavender' : 'text-slate-500'}`}>EUR</span>
                                    <span className="text-theme-text font-mono">{(group.metrics.eur / 1e3).toFixed(0)} MBoe</span>
                                </div>
                            </div>
                        )}
                        
                        {isActive && (
                            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg transition-all ${isSynthwave ? 'bg-theme-magenta glow-magenta' : 'bg-blue-500'}`}></div>
                        )}
                    </div>
                );
            })}
        </div>

        {/* Action Bar */}
        <div className={`p-4 rounded-lg border mt-6 backdrop-blur transition-all ${selectedWellCount > 0 ? 'opacity-100 translate-y-0' : 'opacity-70 translate-y-2 grayscale'} ${isSynthwave ? 'bg-theme-surface1/80 border-theme-magenta' : 'bg-slate-800/80 border-slate-700'}`}>
            <div className="flex justify-between items-center text-xs mb-3">
                <span className={`font-bold uppercase tracking-wider text-[10px] ${isSynthwave ? 'brand-font text-theme-cyan' : 'text-slate-400'}`}>
                    Lasso Data
                </span>
                <span className={`font-mono px-2 py-0.5 rounded text-[10px] ${isSynthwave ? 'bg-theme-magenta text-white glow-magenta' : 'bg-blue-600 text-white'}`}>
                    {selectedWellCount} Wells
                </span>
            </div>
            
            <div className="flex flex-col gap-2">
                <button 
                    onClick={onAssignWells}
                    disabled={selectedWellCount === 0}
                    className={`w-full px-3 py-2 rounded font-bold uppercase tracking-wide text-[10px] transition-all shadow-lg ${selectedWellCount > 0 ? (isSynthwave ? 'bg-theme-cyan text-theme-bg hover:glow-cyan' : 'bg-blue-600 text-white hover:bg-blue-500') : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                >
                    Assign to Active Group
                </button>
                <button 
                    onClick={onCreateGroupFromSelection}
                    disabled={selectedWellCount === 0}
                    className={`w-full px-3 py-2 rounded font-bold uppercase tracking-wide text-[10px] transition-all border ${selectedWellCount > 0 ? (isSynthwave ? 'bg-theme-surface2 text-theme-magenta border-theme-magenta hover:bg-theme-surface1' : 'bg-slate-700 text-slate-200 border-slate-600') : 'bg-slate-800 text-slate-600 cursor-not-allowed border-slate-800'}`}
                >
                    Build New Scenario
                </button>
            </div>
        </div>
    </div>
  );
};

export default GroupList;