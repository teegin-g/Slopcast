import React from 'react';
import type { CountResponse } from '../../types';
import { formatCount, formatCountExact } from './format';

interface UniverseCountBadgeProps {
  count: CountResponse | null;
  loading: boolean;
}

const UniverseCountBadge: React.FC<UniverseCountBadgeProps> = ({ count, loading }) => {
  const value = count?.count ?? 0;
  const heavy = value > 250_000;

  return (
    <div className="lp-count" aria-live="polite">
      <span className="lp-count__label">Wells in scope</span>
      <span className={`lp-count__value ${loading ? 'lp-count__value--loading' : ''}`} title={formatCountExact(value)}>
        {loading && !count ? '—' : formatCount(value)}
      </span>
      <span className="lp-count__meta">
        {count?.estimated ? 'estimated' : 'live count'}
        {count ? ` · ${count.source === 'databricks' ? 'Databricks' : 'demo data'}` : ''}
      </span>
      {count?.capped && (
        <span className="lp-count__warn">Entire L48 — narrow with a basin or filter</span>
      )}
      {!count?.capped && heavy && (
        <span className="lp-count__warn lp-count__warn--soft">Large set — loading may be slow</span>
      )}
    </div>
  );
};

export default UniverseCountBadge;
