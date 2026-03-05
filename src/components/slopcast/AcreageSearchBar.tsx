import React, { useState, useCallback, useRef, useEffect } from 'react';

interface AcreageSearchBarProps {
  isClassic: boolean;
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

const EXAMPLE_QUERIES = [
  'Devon Delaware undeveloped',
  'Wolfcamp A horizontal Permian',
  'Powder River JV opportunities',
  'Bone Spring DUC inventory',
  'Midland Basin PDP package',
];

const AcreageSearchBar: React.FC<AcreageSearchBarProps> = ({
  isClassic,
  onSearch,
  isLoading = false,
  placeholder = 'Search by basin, operator, or formation...',
}) => {
  const [query, setQuery] = useState('');
  const [showExamples, setShowExamples] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showExamples) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowExamples(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showExamples]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    onSearch(trimmed);
    setShowExamples(false);
  }, [query, onSearch]);

  const handleExampleClick = (example: string) => {
    setQuery(example);
    onSearch(example);
    setShowExamples(false);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`flex items-center gap-2 rounded-panel border transition-all ${
            isClassic
              ? 'bg-black/25 border-black/30 focus-within:border-theme-cyan'
              : 'bg-theme-surface1/80 border-theme-border focus-within:border-theme-cyan focus-within:shadow-glow-cyan backdrop-blur-sm'
          }`}
        >
          {/* Search icon */}
          <div className={`pl-4 ${isClassic ? 'text-white/40' : 'text-theme-muted/60'}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setShowExamples(true)}
            placeholder={placeholder}
            className={`flex-1 bg-transparent py-3 text-sm outline-none ${
              isClassic ? 'text-white placeholder-white/40' : 'text-theme-text placeholder-theme-muted/50'
            }`}
          />

          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className={`px-4 py-2 mr-1.5 rounded-inner text-[10px] font-black uppercase tracking-widest transition-all ${
              isClassic
                ? 'bg-theme-cyan text-white border border-theme-magenta/40 disabled:opacity-40'
                : 'bg-theme-cyan text-theme-bg disabled:opacity-40 hover:shadow-glow-cyan'
            }`}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Example queries dropdown */}
      {showExamples && !query.trim() && (
        <div
          className={`absolute left-0 right-0 top-full mt-1 z-40 rounded-panel border shadow-card overflow-hidden ${
            isClassic
              ? 'bg-black/90 border-black/40 backdrop-blur-md'
              : 'bg-theme-surface1 border-theme-border backdrop-blur-md'
          }`}
        >
          <div className={`px-3 py-2 border-b ${isClassic ? 'border-white/10' : 'border-theme-border/40'}`}>
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isClassic ? 'text-white/40' : 'text-theme-muted/60'}`}>
              Try a search
            </span>
          </div>
          {EXAMPLE_QUERIES.map(example => (
            <button
              key={example}
              onClick={() => handleExampleClick(example)}
              className={`w-full text-left px-4 py-2.5 text-[11px] transition-colors ${
                isClassic
                  ? 'text-white/80 hover:bg-white/10'
                  : 'text-theme-muted hover:text-theme-text hover:bg-theme-surface2/60'
              }`}
            >
              {example}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AcreageSearchBar;
