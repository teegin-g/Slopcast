import React from 'react';

interface SchemaMapperProps {
  isClassic: boolean;
  slopcastFields: string[];
  sourceFields: string[];
  mappings: Record<string, string>;
  onUpdateMappings: (mappings: Record<string, string>) => void;
}

const STANDARD_SLOPCAST_FIELDS = [
  'well_id',
  'well_name',
  'api_number',
  'operator',
  'basin',
  'formation',
  'latitude',
  'longitude',
  'spud_date',
  'completion_date',
  'first_production_date',
  'lateral_length',
  'tvd',
  'oil_production',
  'gas_production',
  'water_production',
  'month',
  'date',
];

function fuzzyScore(a: string, b: string): number {
  const al = a.toLowerCase().replace(/[_\- ]/g, '');
  const bl = b.toLowerCase().replace(/[_\- ]/g, '');
  if (al === bl) return 1;
  if (al.includes(bl) || bl.includes(al)) return 0.8;

  // Simple character overlap score
  const setA = new Set(al.split(''));
  const setB = new Set(bl.split(''));
  let overlap = 0;
  for (const c of setA) {
    if (setB.has(c)) overlap++;
  }
  const maxLen = Math.max(setA.size, setB.size);
  return maxLen > 0 ? (overlap / maxLen) * 0.5 : 0;
}

const SchemaMapper: React.FC<SchemaMapperProps> = ({
  isClassic,
  slopcastFields,
  sourceFields,
  mappings,
  onUpdateMappings,
}) => {
  const fields = slopcastFields.length > 0 ? slopcastFields : STANDARD_SLOPCAST_FIELDS;

  const handleMapField = (slopcastField: string, sourceField: string) => {
    const next = { ...mappings };
    if (sourceField === '') {
      delete next[slopcastField];
    } else {
      next[slopcastField] = sourceField;
    }
    onUpdateMappings(next);
  };

  const handleAutoMatch = () => {
    const next: Record<string, string> = {};
    const usedSourceFields = new Set<string>();

    for (const scField of fields) {
      let bestScore = 0;
      let bestMatch = '';

      for (const srcField of sourceFields) {
        if (usedSourceFields.has(srcField)) continue;
        const score = fuzzyScore(scField, srcField);
        if (score > bestScore && score >= 0.4) {
          bestScore = score;
          bestMatch = srcField;
        }
      }

      if (bestMatch) {
        next[scField] = bestMatch;
        usedSourceFields.add(bestMatch);
      }
    }

    onUpdateMappings(next);
  };

  const handleClearAll = () => {
    onUpdateMappings({});
  };

  const panelCls = isClassic
    ? 'bg-black/20 border border-black/25 rounded-inner'
    : 'bg-theme-surface1 border border-theme-border rounded-inner';

  const labelCls = isClassic
    ? 'text-[9px] font-black uppercase tracking-[0.14em] text-white/70'
    : 'text-[9px] font-black uppercase tracking-[0.14em] text-theme-muted';

  const selectCls = isClassic
    ? 'w-full rounded-inner px-2 py-1.5 text-[11px] bg-black/20 border border-black/25 text-white outline-none focus:border-theme-cyan appearance-none'
    : 'w-full rounded-inner px-2 py-1.5 text-[11px] bg-theme-bg border border-theme-border text-theme-text outline-none focus:border-theme-cyan appearance-none';

  const mappedCount = Object.keys(mappings).length;

  return (
    <div className={`${panelCls} p-5 space-y-4`}>
      <div className="flex items-center justify-between">
        <h4 className={isClassic
          ? 'text-[11px] font-black uppercase tracking-[0.14em] text-theme-warning'
          : 'text-[11px] font-black uppercase tracking-[0.14em] text-theme-cyan'
        }>
          Field Mapping
        </h4>

        <div className="flex items-center gap-2">
          <span className={isClassic
            ? 'text-[9px] font-black uppercase tracking-[0.14em] text-white/50'
            : 'text-[9px] font-black uppercase tracking-[0.14em] text-theme-muted'
          }>
            {mappedCount}/{fields.length} Mapped
          </span>

          <button
            onClick={handleAutoMatch}
            disabled={sourceFields.length === 0}
            className={
              isClassic
                ? 'px-3 py-1.5 rounded-inner text-[9px] font-black uppercase tracking-[0.14em] bg-theme-cyan text-white border border-theme-magenta/60 disabled:opacity-50'
                : 'px-3 py-1.5 rounded-inner text-[9px] font-black uppercase tracking-[0.14em] bg-theme-cyan text-theme-bg shadow-glow-cyan disabled:opacity-50'
            }
          >
            Auto-Match
          </button>

          <button
            onClick={handleClearAll}
            className={
              isClassic
                ? 'px-3 py-1.5 rounded-inner text-[9px] font-black uppercase tracking-[0.14em] bg-black/20 border border-black/25 text-white/70'
                : 'px-3 py-1.5 rounded-inner text-[9px] font-black uppercase tracking-[0.14em] bg-theme-bg border border-theme-border text-theme-muted hover:text-theme-text'
            }
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-x-3 gap-y-2 items-center">
        {/* Header row */}
        <div className={labelCls}>Slopcast Field</div>
        <div />
        <div className={labelCls}>Source Field</div>

        {fields.map(scField => {
          const isMapped = !!mappings[scField];
          const fieldTextCls = isMapped
            ? isClassic
              ? 'text-[11px] text-cyan-300 font-bold'
              : 'text-[11px] text-theme-cyan font-bold'
            : isClassic
              ? 'text-[11px] text-white/50'
              : 'text-[11px] text-theme-muted';

          return (
            <React.Fragment key={scField}>
              <div className={`px-2 py-1.5 rounded ${isMapped
                ? isClassic ? 'bg-cyan-900/20' : 'bg-theme-cyan/5'
                : ''
              }`}>
                <span className={fieldTextCls}>{scField}</span>
              </div>

              <div className={`text-center ${isClassic ? 'text-white/30' : 'text-theme-muted/50'}`}>
                <span className="text-[11px]">&rarr;</span>
              </div>

              <div>
                <select
                  className={selectCls}
                  value={mappings[scField] ?? ''}
                  onChange={e => handleMapField(scField, e.target.value)}
                >
                  <option value="">-- unmapped --</option>
                  {sourceFields.map(sf => (
                    <option key={sf} value={sf}>{sf}</option>
                  ))}
                </select>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {sourceFields.length === 0 && (
        <p className={isClassic ? 'text-[11px] text-white/50 text-center py-4' : 'text-[11px] text-theme-muted text-center py-4'}>
          No source fields available. Connect a data source and sync schema to see available fields.
        </p>
      )}
    </div>
  );
};

export default SchemaMapper;
