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
  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wide">Scenarios / Groups</h3>
            <button 
                onClick={onAddGroup}
                className="text-[10px] bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 px-3 py-1 rounded transition-all font-bold uppercase"
            >
                + New
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
                                ? 'bg-slate-800 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] scale-[1.01]' 
                                : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 hover:scale-[1.01]'}
                        `}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${isActive ? 'ring-2 ring-offset-1 ring-offset-slate-800 ring-white/20' : ''}`} style={{ backgroundColor: group.color }}></div>
                                <span className={`font-bold text-sm ${isActive ? 'text-white' : 'text-slate-400'}`}>{group.name}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCloneGroup(group.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-white transition-all"
                                    title="Clone Scenario"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                </button>
                                <span className="text-[10px] bg-slate-950/50 border border-slate-700/50 px-2 py-0.5 rounded-full text-slate-400">
                                    {group.wellIds.size} Wells
                                </span>
                            </div>
                        </div>
                        
                        {/* Mini Stats */}
                        {group.metrics && (
                            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-700/30">
                                <div>
                                    <span className="block text-slate-500 font-bold uppercase text-[9px]">NPV10</span>
                                    <span className={`font-mono ${group.metrics.npv10 >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                        ${(group.metrics.npv10 / 1e6).toFixed(1)}M
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-slate-500 font-bold uppercase text-[9px]">EUR</span>
                                    <span className="text-slate-300 font-mono">{(group.metrics.eur / 1e3).toFixed(0)} MBoe</span>
                                </div>
                            </div>
                        )}
                        
                        {isActive && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg"></div>
                        )}
                    </div>
                );
            })}
        </div>

        {/* Action Bar for Selection */}
        <div className={`
            bg-slate-800/80 p-4 rounded-lg border border-slate-700 mt-6 backdrop-blur transition-all
            ${selectedWellCount > 0 ? 'opacity-100 translate-y-0' : 'opacity-70 translate-y-2 grayscale'}
        `}>
            <div className="flex justify-between items-center text-xs mb-3">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    Current Selection
                </span>
                <span className="text-white font-mono bg-blue-600 px-2 py-0.5 rounded text-[10px]">
                    {selectedWellCount} Wells
                </span>
            </div>
            
            <div className="flex flex-col gap-2">
                <button 
                    onClick={onAssignWells}
                    disabled={selectedWellCount === 0}
                    className={`
                        w-full px-3 py-2 rounded font-bold uppercase tracking-wide text-[10px] transition-all
                        ${selectedWellCount > 0 
                            ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg' 
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'}
                    `}
                >
                    Assign to Active Group
                </button>
                <button 
                    onClick={onCreateGroupFromSelection}
                    disabled={selectedWellCount === 0}
                    className={`
                        w-full px-3 py-2 rounded font-bold uppercase tracking-wide text-[10px] transition-all
                        ${selectedWellCount > 0 
                            ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white border border-slate-600' 
                            : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-800'}
                    `}
                >
                    Create Scenario from Selection
                </button>
            </div>
        </div>
    </div>
  );
};

export default GroupList;
