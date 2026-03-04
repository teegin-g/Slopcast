import React, { useEffect, useMemo, useRef, useState } from 'react';
import { WellGroup } from '../../types';

type GroupSortKey = 'NPV' | 'ROI' | 'PAYOUT' | 'CAPEX' | 'NAME';

type GroupMetrics = {
  id: string;
  npv10: number;
  roi: number;
  payoutMonths: number;
  totalCapex: number;
  wellCount: number;
};

export interface EconomicsGroupBarProps {
  isClassic: boolean;
  groups: WellGroup[];
  activeGroupId: string;
  onActivateGroup: (id: string) => void;
  onCloneActiveGroup: () => void;
  scenarioRankings?: GroupMetrics[];
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
}

const EconomicsGroupBar: React.FC<EconomicsGroupBarProps> = ({
  isClassic,
  groups,
  activeGroupId,
  onActivateGroup,
  onCloneActiveGroup,
  scenarioRankings = [],
  focusMode = false,
  onToggleFocusMode,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<GroupSortKey>('NPV');
  const rootRef = useRef<HTMLDivElement | null>(null);

  const activeIndex = useMemo(() => {
    const idx = groups.findIndex(group => group.id === activeGroupId);
    return idx >= 0 ? idx : 0;
  }, [activeGroupId, groups]);

  const activeGroup = groups[activeIndex] || groups[0];

  const cycleGroup = (direction: -1 | 1) => {
    if (groups.length === 0) return;
    const nextIndex = (activeIndex + direction + groups.length) % groups.length;
    onActivateGroup(groups[nextIndex].id);
    setIsOpen(false);
  };

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      cycleGroup(-1);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      cycleGroup(1);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      setSearch('');
    }
  };

  const handleMenuKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      setSearch('');
    }
  };

  const focusRing = isClassic
    ? 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-theme-warning focus-visible:outline-offset-2'
    : 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-theme-cyan focus-visible:outline-offset-2';

  const metricsById = useMemo(() => {
    const map = new Map<string, GroupMetrics>();
    scenarioRankings.forEach((row) => map.set(row.id, row));
    return map;
  }, [scenarioRankings]);

  const visibleGroups = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const base = needle
      ? groups.filter(g => g.name.toLowerCase().includes(needle))
      : groups;

    const sorted = [...base].sort((a, b) => {
      if (sortKey === 'NAME') return a.name.localeCompare(b.name);

      const aMetrics = metricsById.get(a.id);
      const bMetrics = metricsById.get(b.id);

      const aNpv = aMetrics?.npv10 ?? 0;
      const bNpv = bMetrics?.npv10 ?? 0;
      const aRoi = aMetrics?.roi ?? 0;
      const bRoi = bMetrics?.roi ?? 0;
      const aCapex = aMetrics?.totalCapex ?? 0;
      const bCapex = bMetrics?.totalCapex ?? 0;
      const aPayout = (aMetrics?.payoutMonths ?? 0) > 0 ? (aMetrics?.payoutMonths ?? 0) : Number.POSITIVE_INFINITY;
      const bPayout = (bMetrics?.payoutMonths ?? 0) > 0 ? (bMetrics?.payoutMonths ?? 0) : Number.POSITIVE_INFINITY;

      if (sortKey === 'NPV') return bNpv - aNpv;
      if (sortKey === 'ROI') return bRoi - aRoi;
      if (sortKey === 'CAPEX') return aCapex - bCapex;
      if (sortKey === 'PAYOUT') return aPayout - bPayout;
      return 0;
    });

    return sorted;
  }, [groups, metricsById, search, sortKey]);

  const formatMillions = (value: number) => `$${(value / 1e6).toFixed(1)}M`;
  const formatPayout = (months: number) => (months > 0 ? `${months}mo` : '—');

  const groupHealth = (group: WellGroup) => {
    const checks = [
      group.wellIds.size > 0,
      group.capex.items.length > 0,
      group.typeCurve.qi > 0,
    ];
    const done = checks.filter(Boolean).length;
    return { done, total: checks.length };
  };

  return (
    <div
      ref={rootRef}
      data-testid="economics-group-bar"
      className={`relative z-40 lg:sticky lg:top-[84px] lg:z-20 mb-3 border px-2.5 py-1.5 theme-transition ${
        isClassic ? 'sc-panel' : 'rounded-panel bg-theme-surface1/65 border-theme-border shadow-card backdrop-blur-sm'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          data-testid="economics-group-prev"
          aria-label="Previous group"
          onClick={() => cycleGroup(-1)}
          className={
            isClassic
              ? `px-1.5 py-1 rounded-inner border-2 border-black/25 bg-black/20 text-white/85 text-[9px] font-black ${focusRing}`
              : `px-1.5 py-1 rounded-inner border border-theme-border bg-theme-bg text-theme-muted text-[9px] font-black hover:text-theme-text ${focusRing}`
          }
        >
          &larr;
        </button>

        <div className="relative flex-1">
          <button
            type="button"
            data-testid="economics-group-select"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            onClick={() => setIsOpen(prev => !prev)}
            onKeyDown={handleSelectKeyDown}
            style={{
              boxShadow: `inset 0 0 0 1px ${activeGroup?.color || '#4F8BFF'}66`,
            }}
            className={
              isClassic
                ? `w-full rounded-inner border-2 border-black/25 bg-black/20 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-white text-left flex items-center justify-between ${focusRing}`
                : `w-full rounded-inner border border-theme-border bg-theme-bg px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-theme-text text-left flex items-center justify-between ${focusRing}`
            }
          >
            <span className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: activeGroup?.color || '#4F8BFF', boxShadow: `0 0 0 2px ${(activeGroup?.color || '#4F8BFF')}33` }} />
              <span className="truncate">{activeGroup?.name || 'No group'}</span>
            </span>
            <span className="text-theme-muted">▾</span>
            <span data-testid="economics-active-group-label" className="sr-only">{activeGroup?.name || 'No group'}</span>
          </button>

          {isOpen && (
            <div
              role="listbox"
              data-testid="economics-group-menu"
              onKeyDown={handleMenuKeyDown}
              className={
                isClassic
                  ? 'absolute z-30 mt-1 w-full rounded-inner border-2 border-black/30 bg-black/95 p-2 max-h-[22rem] overflow-y-auto space-y-2'
                  : 'absolute z-30 mt-1 w-full rounded-inner border border-theme-border bg-theme-surface1 shadow-card p-2 max-h-[22rem] overflow-y-auto space-y-2'
              }
            >
              <div className="space-y-2">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search groups…"
                  aria-label="Search groups"
                  className={
                    isClassic
                      ? `w-full rounded-inner px-3 py-2 text-[10px] font-black sc-inputNavy ${focusRing}`
                      : `w-full rounded-inner px-3 py-2 text-[10px] text-theme-text bg-theme-bg border border-theme-border outline-none focus:ring-1 focus:ring-theme-cyan/30 focus:border-theme-cyan theme-transition ${focusRing}`
                  }
                />

                <div className="flex flex-wrap gap-1.5">
                  {([
                    { id: 'NPV', label: 'NPV' },
                    { id: 'ROI', label: 'ROI' },
                    { id: 'PAYOUT', label: 'Payout' },
                    { id: 'CAPEX', label: 'CAPEX' },
                    { id: 'NAME', label: 'Name' },
                  ] as const).map((item) => {
                    const active = sortKey === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSortKey(item.id)}
                        className={
                          isClassic
                            ? `px-2 py-1 rounded-inner border-2 text-[8px] font-black uppercase tracking-[0.14em] transition-colors ${
                                active ? 'bg-theme-warning text-black border-black/20' : 'bg-black/20 text-white/85 border-black/25 hover:bg-black/30'
                              } ${focusRing}`
                            : `px-2 py-1 rounded-inner border text-[8px] font-black uppercase tracking-[0.14em] transition-colors ${
                                active ? 'bg-theme-cyan text-theme-bg border-theme-cyan shadow-glow-cyan' : 'bg-theme-bg text-theme-muted border-theme-border hover:text-theme-text'
                              } ${focusRing}`
                        }
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={isClassic ? 'space-y-1' : 'space-y-1'}>
                {visibleGroups.length === 0 && (
                  <div className={`px-3 py-3 text-[10px] ${isClassic ? 'text-white/70' : 'text-theme-muted'}`}>
                    No groups match “{search.trim()}”.
                  </div>
                )}

                {visibleGroups.map((group) => {
                  const isActive = group.id === activeGroupId;
                  const metrics = metricsById.get(group.id);
                  const health = groupHealth(group);
                  const isHealthy = health.done === health.total;

                  return (
                    <button
                      key={group.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      data-testid={`economics-group-option-${group.id}`}
                      onClick={() => {
                        onActivateGroup(group.id);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      className={`w-full px-3 py-2 rounded-inner text-left transition-all ${
                        isActive
                          ? (isClassic ? 'bg-theme-warning text-black' : 'bg-theme-cyan text-theme-bg')
                          : (isClassic ? 'text-white/90 hover:bg-black/40' : 'text-theme-text hover:bg-theme-surface2')
                      } ${focusRing}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: group.color }} />
                          <span className="truncate text-[10px] font-black uppercase tracking-[0.08em]">
                            {group.name}
                          </span>
                          <span
                            className={`shrink-0 text-[8px] font-black uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-full border ${
                              isHealthy
                                ? (isClassic ? 'bg-theme-cyan/20 text-white border-black/25' : 'bg-theme-cyan/10 text-theme-cyan border-theme-cyan/20')
                                : (isClassic ? 'bg-theme-warning/20 text-white border-black/25' : 'bg-theme-warning/10 text-theme-warning border-theme-warning/20')
                            }`}
                            title="Group setup health"
                          >
                            {health.done}/{health.total}
                          </span>
                        </div>

                        <div className={`shrink-0 text-[9px] tabular-nums flex items-center gap-2 ${isActive ? '' : 'opacity-80'}`}>
                          <span className={isClassic ? '' : 'text-theme-cyan'}>
                            {formatMillions(metrics?.npv10 ?? 0)}
                          </span>
                          <span className={isActive ? 'opacity-60' : 'opacity-40'}>·</span>
                          <span className={isClassic ? '' : 'text-theme-lavender'}>
                            {(metrics?.roi ?? 0).toFixed(2)}x
                          </span>
                          <span className={isActive ? 'opacity-60' : 'opacity-40'}>·</span>
                          <span>
                            {formatPayout(metrics?.payoutMonths ?? 0)}
                          </span>
                          <span className={isActive ? 'opacity-60' : 'opacity-40'}>·</span>
                          <span>
                            {formatMillions(metrics?.totalCapex ?? 0)}
                          </span>
                          <span className={isActive ? 'opacity-60' : 'opacity-40'}>·</span>
                          <span>
                            {metrics?.wellCount ?? group.wellIds.size}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          data-testid="economics-group-next"
          aria-label="Next group"
          onClick={() => cycleGroup(1)}
          className={
            isClassic
              ? `px-1.5 py-1 rounded-inner border-2 border-black/25 bg-black/20 text-white/85 text-[9px] font-black ${focusRing}`
              : `px-1.5 py-1 rounded-inner border border-theme-border bg-theme-bg text-theme-muted text-[9px] font-black hover:text-theme-text ${focusRing}`
          }
        >
          &rarr;
        </button>

        {onToggleFocusMode && (
          <button
            type="button"
            data-testid="economics-focus-toggle"
            aria-pressed={focusMode}
            onClick={onToggleFocusMode}
            className={
              isClassic
                ? `px-2 py-1 rounded-inner text-[8px] font-black uppercase tracking-[0.12em] border-2 border-black/25 whitespace-nowrap transition-colors ${
                    focusMode ? 'bg-theme-warning text-black' : 'bg-black/20 text-white/90 hover:bg-black/30'
                  } ${focusRing}`
                : `px-2 py-1 rounded-inner text-[8px] font-black uppercase tracking-[0.12em] border whitespace-nowrap transition-colors ${
                    focusMode ? 'bg-theme-cyan text-theme-bg border-theme-cyan shadow-glow-cyan' : 'bg-theme-bg text-theme-text border-theme-border hover:border-theme-cyan'
                  } ${focusRing}`
            }
          >
            Focus
          </button>
        )}

        <button
          type="button"
          data-testid="economics-group-clone"
          onClick={onCloneActiveGroup}
          className={
            isClassic
              ? `px-2 py-1 rounded-inner text-[8px] font-black uppercase tracking-[0.12em] border-2 border-black/25 bg-black/20 text-white/90 whitespace-nowrap ${focusRing}`
              : `px-2 py-1 rounded-inner text-[8px] font-black uppercase tracking-[0.12em] border border-theme-border bg-theme-bg text-theme-text hover:border-theme-cyan whitespace-nowrap ${focusRing}`
          }
        >
          Clone Group
        </button>
      </div>
    </div>
  );
};

export default EconomicsGroupBar;
