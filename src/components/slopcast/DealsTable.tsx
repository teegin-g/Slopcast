import React, { useMemo, useState } from 'react';
import type { DealRecord, DealStatus } from '../../types';

interface DealsTableProps {
  isClassic: boolean;
  deals: DealRecord[];
  onSelectDeal: (dealId: string) => void;
  onCreateDeal?: () => void;
}

const STATUS_COLORS: Record<DealStatus, { bg: string; text: string }> = {
  draft: { bg: 'bg-theme-lavender/20', text: 'text-theme-lavender' },
  active: { bg: 'bg-theme-cyan/20', text: 'text-theme-cyan' },
  closed: { bg: 'bg-theme-magenta/20', text: 'text-theme-magenta' },
  archived: { bg: 'bg-theme-muted/20', text: 'text-theme-muted' },
};

type SortKey = 'name' | 'status' | 'basin' | 'wellCount' | 'npv10' | 'updatedAt';
type SortDir = 'asc' | 'desc';

const DealsTable: React.FC<DealsTableProps> = ({ isClassic, deals, onSelectDeal, onCreateDeal }) => {
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterStatus, setFilterStatus] = useState<DealStatus | 'all'>('all');

  const filteredDeals = useMemo(() => {
    let result = deals;
    if (filterStatus !== 'all') {
      result = result.filter(d => d.status === filterStatus);
    }
    return result;
  }, [deals, filterStatus]);

  const sortedDeals = useMemo(() => {
    return [...filteredDeals].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'basin':
          cmp = (a.basin || '').localeCompare(b.basin || '');
          break;
        case 'wellCount':
          cmp = (a.kpis.wellCount || 0) - (b.kpis.wellCount || 0);
          break;
        case 'npv10':
          cmp = (a.kpis.pv10 || 0) - (b.kpis.pv10 || 0);
          break;
        case 'updatedAt':
          cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredDeals, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const headerClass = `text-[9px] font-black uppercase tracking-[0.16em] cursor-pointer select-none transition-colors ${
    isClassic ? 'text-white/60 hover:text-white' : 'text-theme-muted hover:text-theme-text'
  }`;

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  const formatCurrency = (val: number | undefined) => {
    if (!val) return '-';
    if (Math.abs(val) >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
    if (Math.abs(val) >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className={
        isClassic
          ? 'sc-panel theme-transition'
          : 'rounded-panel border shadow-card theme-transition bg-theme-surface1/70 border-theme-border'
      }
    >
      <div className={`flex items-center justify-between gap-3 ${isClassic ? 'sc-panelTitlebar sc-titlebar--neutral px-4 py-2' : 'px-4 py-2 border-b border-theme-border/60'}`}>
        <h2 className={isClassic ? 'text-[10px] font-black uppercase tracking-[0.24em] text-white' : 'text-[10px] font-black uppercase tracking-[0.24em] text-theme-cyan'}>
          Saved Deals
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as DealStatus | 'all')}
            className={`text-[10px] font-bold px-2 py-1 rounded border outline-none ${
              isClassic
                ? 'bg-black/20 border-black/30 text-white'
                : 'bg-theme-bg border-theme-border text-theme-text'
            }`}
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </select>
          {onCreateDeal && (
            <button
              onClick={onCreateDeal}
              className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-wide transition-colors ${
                isClassic
                  ? 'bg-theme-cyan text-white border border-theme-magenta/60'
                  : 'bg-theme-cyan text-theme-bg hover:shadow-glow-cyan'
              }`}
            >
              + New Deal
            </button>
          )}
        </div>
      </div>

      {sortedDeals.length === 0 ? (
        <div className="p-10 text-center flex flex-col items-center gap-3">
          {/* Empty state icon */}
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isClassic ? 'text-white/25' : 'text-theme-muted/30'}
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          <p className={`text-[12px] font-bold ${isClassic ? 'text-white/60' : 'text-theme-muted'}`}>
            No saved deals yet
          </p>
          <p className={`text-[10px] max-w-xs ${isClassic ? 'text-white/35' : 'text-theme-muted/60'}`}>
            Create your first deal to start evaluating economics.
          </p>
          {onCreateDeal && (
            <button
              onClick={onCreateDeal}
              className={`mt-1 px-4 py-2 rounded-inner text-[10px] font-black uppercase tracking-widest transition-all ${
                isClassic
                  ? 'bg-theme-cyan text-white border border-theme-magenta/40 hover:bg-theme-cyan/90'
                  : 'bg-theme-cyan text-theme-bg hover:shadow-glow-cyan'
              }`}
            >
              + New Deal
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isClassic ? 'border-white/10' : 'border-theme-border/40'}`}>
                <th className={`px-4 py-2 text-left ${headerClass}`} onClick={() => toggleSort('name')}>
                  Name{sortIndicator('name')}
                </th>
                <th className={`px-3 py-2 text-left ${headerClass}`} onClick={() => toggleSort('status')}>
                  Status{sortIndicator('status')}
                </th>
                <th className={`px-3 py-2 text-left ${headerClass}`} onClick={() => toggleSort('basin')}>
                  Basin{sortIndicator('basin')}
                </th>
                <th className={`px-3 py-2 text-right ${headerClass}`} onClick={() => toggleSort('wellCount')}>
                  Wells{sortIndicator('wellCount')}
                </th>
                <th className={`px-3 py-2 text-right ${headerClass}`} onClick={() => toggleSort('npv10')}>
                  NPV10{sortIndicator('npv10')}
                </th>
                <th className={`px-3 py-2 text-right ${headerClass}`} onClick={() => toggleSort('updatedAt')}>
                  Updated{sortIndicator('updatedAt')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedDeals.map(deal => {
                const statusStyle = STATUS_COLORS[deal.status];
                return (
                  <tr
                    key={deal.id}
                    onClick={() => onSelectDeal(deal.id)}
                    className={`cursor-pointer border-b transition-colors ${
                      isClassic
                        ? 'border-white/5 hover:bg-white/5'
                        : 'border-theme-border/20 hover:bg-theme-surface2/50'
                    }`}
                  >
                    <td className={`px-4 py-2.5 text-[11px] font-bold ${isClassic ? 'text-white' : 'text-theme-text'}`}>
                      {deal.name}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide ${statusStyle.bg} ${statusStyle.text}`}>
                        {deal.status}
                      </span>
                    </td>
                    <td className={`px-3 py-2.5 text-[11px] ${isClassic ? 'text-white/70' : 'text-theme-muted'}`}>
                      {deal.basin || '-'}
                    </td>
                    <td className={`px-3 py-2.5 text-[11px] text-right tabular-nums ${isClassic ? 'text-white/70' : 'text-theme-muted'}`}>
                      {deal.kpis.wellCount || '-'}
                    </td>
                    <td className={`px-3 py-2.5 text-[11px] text-right tabular-nums font-bold ${isClassic ? 'text-theme-warning' : 'text-theme-cyan'}`}>
                      {formatCurrency(deal.kpis.pv10)}
                    </td>
                    <td className={`px-3 py-2.5 text-[11px] text-right ${isClassic ? 'text-white/50' : 'text-theme-muted/60'}`}>
                      {formatDate(deal.updatedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DealsTable;
