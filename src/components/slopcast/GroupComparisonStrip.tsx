import React from 'react';

interface GroupRanking {
  id: string;
  name: string;
  npv10: number;
  roi: number;
}

interface GroupComparisonStripProps {
  isClassic: boolean;
  groups: Array<{ id: string; name: string; color: string }>;
  activeGroupId: string;
  onActivateGroup: (id: string) => void;
  scenarioRankings: GroupRanking[];
}

const RankBadge: React.FC<{ rank: number; isClassic: boolean }> = ({ rank, isClassic }) => (
  <span
    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black ${
      isClassic
        ? 'bg-theme-warning/20 text-theme-warning border border-theme-warning/30'
        : rank === 1
          ? 'bg-theme-cyan/15 text-theme-cyan border border-theme-cyan/30'
          : 'bg-theme-surface2/60 text-theme-muted border border-theme-border/40'
    }`}
  >
    {rank}
  </span>
);

const GroupComparisonStrip: React.FC<GroupComparisonStripProps> = ({
  isClassic,
  groups,
  activeGroupId,
  onActivateGroup,
  scenarioRankings,
}) => {
  if (scenarioRankings.length < 2) return null;

  const maxNpv = Math.max(...scenarioRankings.map(r => Math.abs(r.npv10)), 1);

  const getGroupColor = (groupId: string): string => {
    return groups.find(g => g.id === groupId)?.color || '#6b7280';
  };

  return (
    <div
      className={
        isClassic
          ? 'sc-panel theme-transition'
          : 'rounded-panel border shadow-card theme-transition bg-theme-surface1/70 border-theme-border'
      }
    >
      <div className={isClassic ? 'sc-panelTitlebar sc-titlebar--neutral px-4 py-2' : 'px-4 py-2 border-b border-theme-border/60'}>
        <h2 className={isClassic ? 'text-[10px] font-black uppercase tracking-[0.24em] text-white' : 'text-[10px] font-black uppercase tracking-[0.24em] text-theme-cyan'}>
          Group Comparison
        </h2>
      </div>

      <div className="p-3 space-y-1.5">
        {scenarioRankings.map((ranking, index) => {
          const isActive = ranking.id === activeGroupId;
          const barWidth = maxNpv > 0 ? Math.abs(ranking.npv10) / maxNpv * 100 : 0;
          const isPositive = ranking.npv10 >= 0;
          const groupColor = getGroupColor(ranking.id);

          return (
            <button
              key={ranking.id}
              onClick={() => onActivateGroup(ranking.id)}
              className={`w-full text-left rounded-inner border px-3 py-2 transition-all ${
                isActive
                  ? isClassic
                    ? 'border-theme-warning bg-black/20 ring-1 ring-theme-warning/30'
                    : 'border-theme-cyan bg-theme-surface2/80 ring-1 ring-theme-cyan/20'
                  : isClassic
                    ? 'border-black/20 bg-black/10 hover:bg-black/15'
                    : 'border-theme-border/50 bg-theme-bg/50 hover:bg-theme-surface2/50'
              }`}
              style={isActive ? { borderLeftWidth: '3px', borderLeftColor: groupColor } : undefined}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <RankBadge rank={index + 1} isClassic={isClassic} />
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: groupColor }}
                  />
                  <span className={`text-[10px] font-black uppercase tracking-[0.1em] truncate ${
                    isActive
                      ? isClassic ? 'text-white' : 'text-theme-text'
                      : isClassic ? 'text-white/80' : 'text-theme-muted'
                  }`}>
                    {ranking.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-black tabular-nums whitespace-nowrap ${
                    isPositive
                      ? isClassic ? 'text-theme-warning' : 'text-theme-cyan'
                      : 'text-theme-warning'
                  }`}>
                    ${(ranking.npv10 / 1e6).toFixed(1)}M
                  </span>
                  <span className="text-[9px] tabular-nums text-theme-muted whitespace-nowrap">
                    {ranking.roi.toFixed(1)}x
                  </span>
                </div>
              </div>

              {/* NPV bar */}
              <div className="h-1.5 rounded-full bg-theme-bg/60 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(2, barWidth)}%`,
                    backgroundColor: isPositive ? groupColor : '#ef4444',
                    opacity: isActive ? 1 : 0.6,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GroupComparisonStrip;
