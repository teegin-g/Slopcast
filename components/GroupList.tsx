import React from 'react';
import { WellGroup } from '../types';
import { useTheme } from '../theme/ThemeProvider';

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
  const { theme } = useTheme();

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className={`font-semibold text-sm uppercase tracking-wide text-theme-cyan ${theme.features.brandFont ? 'brand-font' : ''}`}>Scenarios / Groups</h3>
            <button 
                onClick={onAddGroup}
                className="text-[10px] px-3 py-1 rounded transition-all font-bold uppercase border bg-theme-magenta/20 hover:bg-theme-magenta/40 text-theme-magenta border-theme-magenta/30"
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
                                ? 'bg-theme-surface2 border-theme-magenta glow-magenta scale-[1.01]' 
                                : 'bg-theme-surface1/60 border-theme-border hover:bg-theme-surface1 hover:border-theme-lavender hover:scale-[1.01]'}
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
                                <span className="text-[10px] px-2 py-0.5 rounded-full border transition-all bg-theme-bg border-theme-border text-theme-cyan">
                                    {group.wellIds.size} Wells
                                </span>
                            </div>
                        </div>
                        
                        {group.metrics && (
                            <div className="grid grid-cols-2 gap-2 text-[10px] mt-2 pt-2 border-t transition-all border-theme-border/30 text-theme-muted">
                                <div>
                                    <span className="block font-bold uppercase text-[9px] text-theme-lavender">NPV10</span>
                                    <span className={`font-mono ${group.metrics.npv10 >= 0 ? "text-theme-cyan" : "text-red-400"}`}>
                                        ${(group.metrics.npv10 / 1e6).toFixed(1)}M
                                    </span>
                                </div>
                                <div>
                                    <span className="block font-bold uppercase text-[9px] text-theme-lavender">EUR</span>
                                    <span className="text-theme-text font-mono">{(group.metrics.eur / 1e3).toFixed(0)} MBoe</span>
                                </div>
                            </div>
                        )}
                        
                        {isActive && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg transition-all bg-theme-magenta glow-magenta"></div>
                        )}
                    </div>
                );
            })}
        </div>

        {/* Action Bar */}
        <div className={`p-4 rounded-lg border mt-6 backdrop-blur transition-all ${selectedWellCount > 0 ? 'opacity-100 translate-y-0' : 'opacity-70 translate-y-2 grayscale'} bg-theme-surface1/80 border-theme-magenta`}>
            <div className="flex justify-between items-center text-xs mb-3">
                <span className={`font-bold uppercase tracking-wider text-[10px] text-theme-cyan ${theme.features.brandFont ? 'brand-font' : ''}`}>
                    Lasso Data
                </span>
                <span className="font-mono px-2 py-0.5 rounded text-[10px] bg-theme-magenta text-white">
                    {selectedWellCount} Wells
                </span>
            </div>
            
            <div className="flex flex-col gap-2">
                <button 
                    onClick={onAssignWells}
                    disabled={selectedWellCount === 0}
                    className={`w-full px-3 py-2 rounded font-bold uppercase tracking-wide text-[10px] transition-all shadow-lg ${selectedWellCount > 0 ? 'bg-theme-cyan text-theme-bg hover:shadow-glow-cyan' : 'bg-theme-surface2 text-theme-muted cursor-not-allowed'}`}
                >
                    Assign to Active Group
                </button>
                <button 
                    onClick={onCreateGroupFromSelection}
                    disabled={selectedWellCount === 0}
                    className={`w-full px-3 py-2 rounded font-bold uppercase tracking-wide text-[10px] transition-all border ${selectedWellCount > 0 ? 'bg-theme-surface2 text-theme-magenta border-theme-magenta hover:bg-theme-surface1' : 'bg-theme-surface2 text-theme-muted cursor-not-allowed border-theme-border'}`}
                >
                    Build New Scenario
                </button>
            </div>
        </div>
    </div>
  );
};

export default GroupList;
