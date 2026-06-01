import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CountResponse,
  FilterClause,
  InterpretResponse,
  PresetProject,
  ProjectDraft,
  SchemaResponse,
  SetupDataSource,
  WellSummaryField,
} from '../../types';
import {
  estimateCount,
  fetchFieldValues,
  fetchPresets,
  fetchSchema,
  interpretQuery,
} from '../../services/wellUniverseService';

// Core fields surfaced as dedicated searchable dropdowns (set filters).
export const CORE_SET_FIELDS = ['state', 'county', 'formation', 'operator', 'well_status'] as const;

const COUNT_DEBOUNCE_MS = 450;

let clauseSeq = 0;
function newClauseId(): string {
  clauseSeq += 1;
  return `c${clauseSeq}_${Math.random().toString(36).slice(2, 7)}`;
}

function withId(clause: FilterClause): FilterClause {
  return { ...clause, id: clause.id ?? newClauseId() };
}

export interface UseWellUniverse {
  schema: SchemaResponse | null;
  schemaLoading: boolean;
  granularFields: WellSummaryField[];
  basin: string | null;
  basinOptions: string[];
  coreOptions: Record<string, string[]>;
  coreOptionsLoading: Record<string, boolean>;
  filters: FilterClause[];
  count: CountResponse | null;
  countLoading: boolean;
  source: SetupDataSource | null;
  presets: PresetProject[];
  presetsLoading: boolean;
  presetsRequireBasin: boolean;
  query: string;
  setQuery: (q: string) => void;
  interpreting: boolean;
  interpretResult: InterpretResponse | null;
  setBasin: (b: string | null) => void;
  coreValuesFor: (field: string) => string[];
  setCoreFilter: (field: string, values: string[]) => void;
  addClause: (clause: FilterClause) => void;
  removeClause: (id: string) => void;
  clearAll: () => void;
  runInterpret: () => Promise<void>;
  applyPreset: (preset: PresetProject) => void;
  buildDraft: () => ProjectDraft;
}

export function useWellUniverse(): UseWellUniverse {
  const [schema, setSchema] = useState<SchemaResponse | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(true);
  const [basin, setBasinState] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterClause[]>([]);
  const [count, setCount] = useState<CountResponse | null>(null);
  const [countLoading, setCountLoading] = useState(false);
  const [presets, setPresets] = useState<PresetProject[]>([]);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [presetsRequireBasin, setPresetsRequireBasin] = useState(true);
  const [coreOptions, setCoreOptions] = useState<Record<string, string[]>>({});
  const [coreOptionsLoading, setCoreOptionsLoading] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');
  const [interpreting, setInterpreting] = useState(false);
  const [interpretResult, setInterpretResult] = useState<InterpretResponse | null>(null);

  // --- Schema + core option lists (once) ---
  useEffect(() => {
    const controller = new AbortController();
    fetchSchema(controller.signal)
      .then(setSchema)
      .catch(() => {})
      .finally(() => setSchemaLoading(false));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fields = ['basin', ...CORE_SET_FIELDS];
    setCoreOptionsLoading(Object.fromEntries(fields.map((field) => [field, true])));
    fields.forEach((field) => {
      fetchFieldValues(field, controller.signal)
        .then((res) => setCoreOptions((prev) => ({ ...prev, [field]: res.values })))
        .catch(() => {})
        .finally(() => setCoreOptionsLoading((prev) => ({ ...prev, [field]: false })));
    });
    return () => controller.abort();
  }, []);

  // --- Debounced count whenever basin/filters change ---
  useEffect(() => {
    const controller = new AbortController();
    setCountLoading(true);
    const handle = setTimeout(() => {
      estimateCount(basin, filters, controller.signal)
        .then(setCount)
        .catch(() => {})
        .finally(() => setCountLoading(false));
    }, COUNT_DEBOUNCE_MS);
    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [basin, filters]);

  // --- Presets whenever basin changes ---
  useEffect(() => {
    const controller = new AbortController();
    setPresetsLoading(true);
    fetchPresets(basin, controller.signal)
      .then((res) => {
        setPresets(res.presets);
        setPresetsRequireBasin(res.requires_basin);
      })
      .catch(() => {})
      .finally(() => setPresetsLoading(false));
    return () => controller.abort();
  }, [basin]);

  const granularFields = useMemo(
    () => (schema?.fields ?? []).filter((f) => !f.core),
    [schema],
  );

  const setBasin = useCallback((b: string | null) => setBasinState(b), []);

  const coreValuesFor = useCallback(
    (field: string) => filters.find((c) => c.id === `set:${field}`)?.values ?? [],
    [filters],
  );

  const setCoreFilter = useCallback((field: string, values: string[]) => {
    setFilters((prev) => {
      const without = prev.filter((c) => c.id !== `set:${field}`);
      if (values.length === 0) return without;
      return [...without, { id: `set:${field}`, field, kind: 'set', values }];
    });
  }, []);

  const addClause = useCallback((clause: FilterClause) => {
    setFilters((prev) => {
      // Replace any existing granular clause on the same field for clarity.
      const without = prev.filter((c) => !(c.field === clause.field && c.kind === clause.kind && !c.id?.startsWith('set:')));
      return [...without, withId(clause)];
    });
  }, []);

  const removeClause = useCallback((id: string) => {
    setFilters((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setFilters([]);
    setInterpretResult(null);
  }, []);

  const applyInterpretation = useCallback((result: InterpretResponse) => {
    if (result.basin) setBasinState(result.basin.toUpperCase());
    if (result.filters.length) {
      setFilters((prev) => {
        const incoming = result.filters.map((clause) => {
          const isCoreSet = clause.kind === 'set' && (CORE_SET_FIELDS as readonly string[]).includes(clause.field);
          return isCoreSet ? { ...clause, id: `set:${clause.field}` } : withId(clause);
        });
        const incomingIds = new Set(incoming.map((c) => c.id));
        const incomingFieldKinds = new Set(incoming.map((c) => `${c.field}:${c.kind}`));
        const kept = prev.filter(
          (c) => !incomingIds.has(c.id) && !incomingFieldKinds.has(`${c.field}:${c.kind}`),
        );
        return [...kept, ...incoming];
      });
    }
  }, []);

  const runInterpret = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setInterpreting(true);
    try {
      const result = await interpretQuery(q, basin);
      setInterpretResult(result);
      applyInterpretation(result);
    } catch {
      setInterpretResult(null);
    } finally {
      setInterpreting(false);
    }
  }, [query, basin, applyInterpretation]);

  const applyPreset = useCallback((preset: PresetProject) => {
    setBasinState(preset.basin.toUpperCase());
    setFilters(preset.filters.map((clause) => {
      const isCoreSet = clause.kind === 'set' && (CORE_SET_FIELDS as readonly string[]).includes(clause.field);
      return isCoreSet ? { ...clause, id: `set:${clause.field}` } : withId(clause);
    }));
  }, []);

  const buildDraft = useCallback((): ProjectDraft => ({
    version: 1,
    basin,
    filters,
    estimatedCount: count?.count ?? null,
    estimated: count?.estimated ?? true,
    source: count?.source ?? 'mock',
    query: query.trim() || null,
    createdAt: new Date().toISOString(),
  }), [basin, filters, count, query]);

  return {
    schema,
    schemaLoading,
    granularFields,
    basin,
    basinOptions: coreOptions.basin ?? [],
    coreOptions,
    coreOptionsLoading,
    filters,
    count,
    countLoading,
    source: count?.source ?? null,
    presets,
    presetsLoading,
    presetsRequireBasin,
    query,
    setQuery,
    interpreting,
    interpretResult,
    setBasin,
    coreValuesFor,
    setCoreFilter,
    addClause,
    removeClause,
    clearAll,
    runInterpret,
    applyPreset,
    buildDraft,
  };
}
