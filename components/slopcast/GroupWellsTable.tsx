import React, { useMemo, useState } from 'react';
import type { Well, WellGroup } from '../../types';

type SortKey = 'name' | 'formation' | 'lateralLength' | 'status' | 'operator';
type SortDir = 'asc' | 'desc';

export interface GroupWellsTableProps {
  isClassic: boolean;
  group: WellGroup;
  wells: Well[];
  title?: string;
  defaultSort?: { key: SortKey; dir: SortDir };
  dense?: boolean;
}

function formatFeet(value: number) {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)} ft`;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function compareValues(a: Well, b: Well, key: SortKey) {
  if (key === 'lateralLength') return (a.lateralLength ?? 0) - (b.lateralLength ?? 0);
  const av = normalize(String(a[key] ?? ''));
  const bv = normalize(String(b[key] ?? ''));
  return av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' });
}

const GroupWellsTable: React.FC<GroupWellsTableProps> = ({
  isClassic,
  group,
  wells,
  title = 'Wells in group',
  defaultSort = { key: 'name', dir: 'asc' },
  dense = false,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>(defaultSort);

  const groupWells = useMemo(() => wells.filter(w => group.wellIds.has(w.id)), [wells, group.wellIds]);

  const filteredWells = useMemo(() => {
    const q = normalize(query);
    if (!q) return groupWells;
    return groupWells.filter(well => {
      const haystack = [well.name, well.formation, well.operator, well.status].join(' ');
      return normalize(haystack).includes(q);
    });
  }, [groupWells, query]);

  const sortedWells = useMemo(() => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...filteredWells].sort((a, b) => dir * compareValues(a, b, sort.key));
  }, [filteredWells, sort.dir, sort.key]);

  const panelClassName = isClassic
    ? 'sc-panel theme-transition overflow-hidden'
    : 'rounded-panel border shadow-card theme-transition bg-theme-surface1/70 border-theme-border overflow-hidden';

  const titlebarClassName = isClassic
    ? 'sc-panelTitlebar sc-titlebar--neutral px-4 py-3 flex items-center justify-between gap-3'
    : 'px-4 py-3 border-b border-theme-border/60 flex items-center justify-between gap-3';

  const titleClassName = isClassic
    ? 'text-[11px] font-black uppercase tracking-[0.24em] text-white'
    : 'text-[10px] font-black uppercase tracking-[0.24em] text-theme-cyan';

  const controlRowClassName = dense ? 'px-4 py-3' : 'px-4 py-3';
  const controlTextClassName = dense ? 'text-[10px]' : 'text-[11px]';
  const inputClassName = isClassic
    ? `w-full rounded-inner px-3 py-2 ${dense ? 'text-[11px]' : 'text-[12px]'} font-black sc-inputNavy`
    : `w-full rounded-inner border border-theme-border bg-theme-bg px-3 py-2 ${dense ? 'text-[11px]' : 'text-[12px]'} text-theme-text placeholder:text-theme-muted`;

  const headerButtonBase = isClassic
    ? 'sc-btnSecondary px-3 py-1.5 rounded-inner text-[10px] font-black uppercase tracking-widest transition-all'
    : 'px-2 py-1.5 rounded-inner border border-theme-border bg-theme-bg text-theme-muted hover:text-theme-text transition-colors';

  const sortSelectClassName = isClassic
    ? `rounded-inner px-3 py-2 ${dense ? 'text-[11px]' : 'text-[12px]'} font-black sc-inputNavy`
    : `rounded-inner border border-theme-border bg-theme-bg px-3 py-2 ${dense ? 'text-[11px]' : 'text-[12px]'} text-theme-text`;

  const tableWrapperClassName = dense ? 'max-h-[260px]' : 'max-h-[340px]';

  function toggleSort(nextKey: SortKey) {
    setSort(prev => {
      if (prev.key !== nextKey) return { key: nextKey, dir: 'asc' };
      return { key: nextKey, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
    });
  }

  const sortIndicator = (key: SortKey) => {
    if (sort.key !== key) return '';
    return sort.dir === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <div className={panelClassName}>
      <div className={titlebarClassName}>
        <div className="min-w-0">
          <div className={titleClassName}>
            {title}{' '}
            <span className={isClassic ? 'text-white/70' : 'text-theme-muted'}>
              ({groupWells.length})
            </span>
          </div>
        </div>
        <button
          type="button"
          className={headerButtonBase}
          onClick={() => setIsOpen(o => !o)}
          aria-expanded={isOpen}
        >
          {isOpen ? 'Hide' : 'Show'}
        </button>
      </div>

      {isOpen && (
        <div className="pb-4">
          <div className={`${controlRowClassName} flex flex-col gap-2`}>
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 min-w-0">
                <div className={`${controlTextClassName} font-black uppercase tracking-[0.18em] ${isClassic ? 'text-white/80' : 'text-theme-muted'} mb-1`}>
                  Search
                </div>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Name, formation, operator, status…"
                  className={inputClassName}
                />
              </div>

              <div className="md:hidden">
                <div className={`${controlTextClassName} font-black uppercase tracking-[0.18em] ${isClassic ? 'text-white/80' : 'text-theme-muted'} mb-1`}>
                  Sort by
                </div>
                <div className="flex gap-2">
                  <select
                    value={sort.key}
                    onChange={e => setSort(s => ({ ...s, key: e.target.value as SortKey }))}
                    className={sortSelectClassName}
                  >
                    <option value="name">Well</option>
                    <option value="formation">Formation</option>
                    <option value="lateralLength">Lateral</option>
                    <option value="status">Status</option>
                    <option value="operator">Operator</option>
                  </select>
                  <button
                    type="button"
                    className={headerButtonBase}
                    onClick={() => setSort(s => ({ ...s, dir: s.dir === 'asc' ? 'desc' : 'asc' }))}
                    aria-label="Toggle sort direction"
                  >
                    {sort.dir === 'asc' ? 'Asc' : 'Desc'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {sortedWells.length === 0 ? (
            <div className="px-4">
              <div
                className={
                  isClassic
                    ? 'sc-insetDark rounded-inner px-4 py-4'
                    : 'rounded-inner border border-theme-border bg-theme-bg px-4 py-4'
                }
              >
                <div className={isClassic ? 'text-white font-black' : 'text-theme-text font-black'}>
                  No wells assigned to this group yet.
                </div>
                <div className={isClassic ? 'text-white/70 text-sm mt-1' : 'text-theme-muted text-sm mt-1'}>
                  Select wells on the map and assign.
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className={`hidden md:block px-4 ${tableWrapperClassName} overflow-auto`}>
                <table className="w-full text-left">
                  <thead className={isClassic ? 'text-white/80' : 'text-theme-muted'}>
                    <tr className={`${dense ? 'text-[10px]' : 'text-[11px]'} font-black uppercase tracking-[0.18em]`}>
                      <th className="py-2 pr-3">
                        <button type="button" className="hover:underline" onClick={() => toggleSort('name')}>
                          Well{sortIndicator('name')}
                        </button>
                      </th>
                      <th className="py-2 pr-3">
                        <button type="button" className="hover:underline" onClick={() => toggleSort('formation')}>
                          Formation{sortIndicator('formation')}
                        </button>
                      </th>
                      <th className="py-2 pr-3">
                        <button type="button" className="hover:underline" onClick={() => toggleSort('lateralLength')}>
                          Lateral{sortIndicator('lateralLength')}
                        </button>
                      </th>
                      <th className="py-2 pr-3">
                        <button type="button" className="hover:underline" onClick={() => toggleSort('status')}>
                          Status{sortIndicator('status')}
                        </button>
                      </th>
                      <th className="py-2">
                        <button type="button" className="hover:underline" onClick={() => toggleSort('operator')}>
                          Operator{sortIndicator('operator')}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className={isClassic ? 'text-white' : 'text-theme-text'}>
                    {sortedWells.map(well => (
                      <tr key={well.id} className={isClassic ? 'border-t border-white/15' : 'border-t border-theme-border/50'}>
                        <td className={`${dense ? 'py-2' : 'py-2.5'} pr-3 font-black`}>{well.name}</td>
                        <td className={`${dense ? 'py-2' : 'py-2.5'} pr-3`}>{well.formation}</td>
                        <td className={`${dense ? 'py-2' : 'py-2.5'} pr-3`}>{formatFeet(well.lateralLength)}</td>
                        <td className={`${dense ? 'py-2' : 'py-2.5'} pr-3`}>{well.status}</td>
                        <td className={`${dense ? 'py-2' : 'py-2.5'}`}>{well.operator}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <div className={`md:hidden px-4 ${tableWrapperClassName} overflow-auto`}>
                <div className="space-y-2">
                  {sortedWells.map(well => (
                    <div
                      key={well.id}
                      className={
                        isClassic
                          ? 'sc-insetDark rounded-inner px-3 py-2'
                          : 'rounded-inner border border-theme-border bg-theme-bg px-3 py-2'
                      }
                    >
                      <div className={isClassic ? 'text-white font-black' : 'text-theme-text font-black'}>
                        {well.name}
                      </div>
                      <div className={isClassic ? 'text-white/70 text-sm' : 'text-theme-muted text-sm'}>
                        {well.formation} • {formatFeet(well.lateralLength)} • {well.status} • {well.operator}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupWellsTable;
