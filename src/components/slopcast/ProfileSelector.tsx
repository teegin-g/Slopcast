import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { DealTypeCurvePreset, ProfileType, WellGroup, TypeCurveParams, CapexAssumptions, OpexAssumptions, OwnershipAssumptions } from '../../types';

interface ProfileSelectorProps {
  isClassic: boolean;
  presets: DealTypeCurvePreset[];
  activeGroup: WellGroup;
  onApplyPreset: (preset: DealTypeCurvePreset) => void;
  onSaveAsPreset?: (name: string, profileType: ProfileType) => void;
  isLoading?: boolean;
}

const PROFILE_TYPE_LABELS: Record<ProfileType, string> = {
  type_curve: 'Type Curve',
  capex: 'CAPEX',
  opex: 'OPEX',
  ownership: 'Ownership',
  pricing: 'Pricing',
  composite: 'Composite',
};

const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  isClassic,
  presets,
  activeGroup,
  onApplyPreset,
  onSaveAsPreset,
  isLoading,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<ProfileType | 'all'>('all');
  const [filterBasin, setFilterBasin] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<DealTypeCurvePreset | null>(null);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveType, setSaveType] = useState<ProfileType>('composite');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSelectedPreset(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const filteredPresets = presets.filter(p => {
    if (filterType !== 'all' && p.profileType !== filterType) return false;
    if (filterBasin && p.basin && !p.basin.toLowerCase().includes(filterBasin.toLowerCase())) return false;
    return true;
  });

  const uniqueBasins = Array.from(new Set(presets.map(p => p.basin).filter(Boolean))) as string[];

  const formatConfig = (preset: DealTypeCurvePreset): string => {
    const cfg = preset.config;
    const parts: string[] = [];
    if (cfg.qi) parts.push(`Qi: ${cfg.qi}`);
    if (cfg.b) parts.push(`b: ${cfg.b}`);
    if (cfg.di) parts.push(`Di: ${cfg.di}%`);
    if (cfg.rigCount) parts.push(`Rigs: ${cfg.rigCount}`);
    if (cfg.baseNri) parts.push(`NRI: ${((cfg.baseNri as number) * 100).toFixed(1)}%`);
    return parts.join(' | ') || 'No preview available';
  };

  const handleApply = () => {
    if (!selectedPreset) return;
    onApplyPreset(selectedPreset);
    setIsOpen(false);
    setSelectedPreset(null);
  };

  const handleSave = () => {
    if (!saveName.trim() || !onSaveAsPreset) return;
    onSaveAsPreset(saveName.trim(), saveType);
    setShowSaveForm(false);
    setSaveName('');
  };

  return (
    <div ref={panelRef} className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`px-3 py-1.5 rounded-inner text-[9px] font-black uppercase tracking-[0.14em] transition-all border ${
            isClassic
              ? 'bg-black/15 text-white border-black/30 hover:bg-black/25'
              : 'bg-theme-bg text-theme-lavender border-theme-border hover:border-theme-lavender'
          }`}
        >
          {isOpen ? 'Close Profiles' : 'Load Profile'}
        </button>

        {onSaveAsPreset && (
          <button
            onClick={() => setShowSaveForm(!showSaveForm)}
            className={`px-3 py-1.5 rounded-inner text-[9px] font-black uppercase tracking-[0.14em] transition-all border ${
              isClassic
                ? 'bg-black/15 text-white/70 border-black/30 hover:bg-black/25'
                : 'bg-theme-bg text-theme-muted border-theme-border hover:text-theme-text'
            }`}
          >
            Save As Profile
          </button>
        )}
      </div>

      {/* Save form */}
      {showSaveForm && (
        <div className={`mt-2 p-3 rounded-inner border ${
          isClassic ? 'bg-black/20 border-black/30' : 'bg-theme-bg border-theme-border'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              placeholder="Profile name..."
              className={`flex-1 px-2 py-1 rounded text-[11px] outline-none ${
                isClassic
                  ? 'bg-black/20 text-white border border-black/30'
                  : 'bg-theme-surface1 text-theme-text border border-theme-border focus:border-theme-cyan'
              }`}
            />
            <select
              value={saveType}
              onChange={e => setSaveType(e.target.value as ProfileType)}
              className={`px-2 py-1 rounded text-[10px] outline-none ${
                isClassic
                  ? 'bg-black/20 text-white border border-black/30'
                  : 'bg-theme-surface1 text-theme-text border border-theme-border'
              }`}
            >
              {Object.entries(PROFILE_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSave}
            disabled={!saveName.trim()}
            className={`w-full px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-wide transition-all ${
              isClassic
                ? 'bg-theme-cyan text-white disabled:opacity-40'
                : 'bg-theme-cyan text-theme-bg disabled:opacity-40 hover:shadow-glow-cyan'
            }`}
          >
            Save
          </button>
        </div>
      )}

      {/* Preset browser */}
      {isOpen && (
        <div className={`absolute left-0 top-full mt-2 z-50 w-80 md:w-96 rounded-panel border shadow-card overflow-hidden ${
          isClassic ? 'bg-black/90 border-black/40 backdrop-blur-md' : 'bg-theme-surface1 border-theme-border backdrop-blur-md'
        }`}>
          {/* Filters */}
          <div className={`px-3 py-2 border-b flex items-center gap-2 ${isClassic ? 'border-white/10' : 'border-theme-border/40'}`}>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as ProfileType | 'all')}
              className={`text-[10px] px-2 py-1 rounded border outline-none ${
                isClassic
                  ? 'bg-black/20 border-black/30 text-white'
                  : 'bg-theme-bg border-theme-border text-theme-text'
              }`}
            >
              <option value="all">All Types</option>
              {Object.entries(PROFILE_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            {uniqueBasins.length > 0 && (
              <select
                value={filterBasin}
                onChange={e => setFilterBasin(e.target.value)}
                className={`text-[10px] px-2 py-1 rounded border outline-none ${
                  isClassic
                    ? 'bg-black/20 border-black/30 text-white'
                    : 'bg-theme-bg border-theme-border text-theme-text'
                }`}
              >
                <option value="">All Basins</option>
                {uniqueBasins.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            )}
          </div>

          {/* Preset list */}
          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className={`p-4 text-center text-[11px] ${isClassic ? 'text-white/40' : 'text-theme-muted/50'}`}>
                Loading profiles...
              </div>
            ) : filteredPresets.length === 0 ? (
              <div className={`p-4 text-center text-[11px] ${isClassic ? 'text-white/40' : 'text-theme-muted/50'}`}>
                No profiles found.
              </div>
            ) : (
              filteredPresets.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset)}
                  className={`w-full text-left px-3 py-2.5 border-b transition-colors ${
                    selectedPreset?.id === preset.id
                      ? isClassic
                        ? 'bg-theme-cyan/20 border-white/10'
                        : 'bg-theme-cyan/10 border-theme-border/30'
                      : isClassic
                        ? 'border-white/5 hover:bg-white/5'
                        : 'border-theme-border/20 hover:bg-theme-surface2/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className={`text-[11px] font-bold ${isClassic ? 'text-white' : 'text-theme-text'}`}>
                      {preset.name}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                      isClassic ? 'bg-black/30 text-white/60' : 'bg-theme-bg text-theme-muted border border-theme-border'
                    }`}>
                      {PROFILE_TYPE_LABELS[preset.profileType]}
                    </span>
                  </div>
                  <p className={`text-[9px] ${isClassic ? 'text-white/40' : 'text-theme-muted/60'}`}>
                    {[preset.basin, preset.formation, preset.operator].filter(Boolean).join(' / ') || 'General'}
                  </p>
                  <p className={`text-[9px] mt-0.5 ${isClassic ? 'text-white/30' : 'text-theme-muted/40'}`}>
                    {formatConfig(preset)}
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Apply button */}
          {selectedPreset && (
            <div className={`px-3 py-2 border-t ${isClassic ? 'border-white/10' : 'border-theme-border/40'}`}>
              <button
                onClick={handleApply}
                className={`w-full px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-widest transition-all ${
                  isClassic
                    ? 'bg-theme-magenta text-white hover:bg-theme-magenta/90'
                    : 'bg-theme-cyan text-theme-bg hover:shadow-glow-cyan'
                }`}
              >
                Apply "{selectedPreset.name}" to {activeGroup.name}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileSelector;
