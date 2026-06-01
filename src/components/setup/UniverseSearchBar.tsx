import React from 'react';
import type { InterpretResponse } from '../../types';

interface UniverseSearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSubmit: () => void;
  interpreting: boolean;
  result: InterpretResponse | null;
}

const EXAMPLES = [
  'Permian Wolfcamp A wells permitted in the last 6 months',
  'Bakken producers with cum BOE 12mo over 250k',
  'Lateral length over 10000 ft, first prod since 2022',
];

const UniverseSearchBar: React.FC<UniverseSearchBarProps> = ({ query, onQueryChange, onSubmit, interpreting, result }) => {
  const confidencePct = result ? Math.round(result.confidence * 100) : 0;
  const lowConfidence = result !== null && result.confidence < 0.2;

  return (
    <div className="lp-search">
      <form
        className="lp-search__bar"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <svg className="lp-search__icon" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20.5 20.5l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Describe the wells you want to study…"
          className="lp-search__input"
          aria-label="Describe your well universe in natural language"
          autoComplete="off"
        />
        <button type="submit" className="lp-search__submit" disabled={interpreting || !query.trim()}>
          {interpreting ? <span className="lp-spinner" aria-hidden="true" /> : 'Interpret'}
        </button>
      </form>

      <div className="lp-search__sub">
        {!result && !interpreting && (
          <div className="lp-search__examples">
            <span className="lp-search__examplesLabel">Try</span>
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button" className="lp-search__example" onClick={() => onQueryChange(ex)}>
                {ex}
              </button>
            ))}
          </div>
        )}

        {interpreting && <p className="lp-search__status">Interpreting against the well-summary schema…</p>}

        {result && !interpreting && (
          <div className={`lp-search__result ${lowConfidence ? 'lp-search__result--warn' : ''}`}>
            <span className={`lp-srcbadge lp-srcbadge--${result.source}`}>
              {result.source === 'databricks' ? 'AI model' : 'On-device'}
            </span>
            <span className="lp-search__summary">{result.summary}</span>
            {!lowConfidence && result.filters.length > 0 && (
              <span className="lp-search__confidence" title="Interpretation confidence">
                {confidencePct}% match
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UniverseSearchBar;
