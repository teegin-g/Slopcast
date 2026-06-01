/**
 * wellUniverseService
 *
 * Frontend adapter for the Project Setup / Launchpad backend (/api/setup/*).
 * Every call hits the FastAPI layer first (which itself prefers a live Databricks
 * SQL Warehouse / model-serving endpoint and falls back to deterministic mock
 * data). If the backend is entirely unreachable — e.g. `npm run dev` without the
 * Python server, Storybook, headless CI — each call degrades to an equivalent
 * client-side computation so the Launchpad is never a dead screen.
 *
 * Mirrors the mock+live adapter convention in spatialService.ts.
 */

import type {
  CountResponse,
  FieldStatsResponse,
  FieldValuesResponse,
  FilterClause,
  InterpretResponse,
  PresetProject,
  PresetsResponse,
  ProjectDraft,
  SchemaResponse,
  WellSummaryField,
} from '../types';

const SETUP_API_BASE = '/api/setup';
const REQUEST_TIMEOUT_MS = 12_000;

// ---------------------------------------------------------------------------
// Local fallback catalog — compact mirror of backend/setup_service.py _FIELDS.
// Used only when the backend is unreachable.
// ---------------------------------------------------------------------------

const f = (
  name: string,
  label: string,
  category: string,
  data_type: WellSummaryField['data_type'],
  extra: Partial<WellSummaryField> = {},
): WellSummaryField => ({ name, label, category, data_type, ...extra });

const LOCAL_FIELDS: WellSummaryField[] = [
  f('basin', 'Basin', 'Location', 'string', { core: true, description: 'Industry-defined geological basin' }),
  f('state', 'State', 'Location', 'string', { core: true }),
  f('county', 'County', 'Location', 'string', { core: true }),
  f('formation', 'Formation', 'Location', 'string', { core: true }),
  f('operator', 'Operator', 'Operator', 'string', { core: true }),
  f('well_status', 'Well Status', 'Status', 'string', { core: true }),
  f('zone', 'Zone', 'Location', 'string'),
  f('play', 'Play', 'Location', 'string'),
  f('region', 'Region', 'Location', 'string'),
  f('district', 'District', 'Location', 'string'),
  f('asset_team', 'Asset Team', 'Location', 'string'),
  f('well_type', 'Well Type', 'Characteristics', 'string'),
  f('wellbore_direction', 'Wellbore Direction', 'Characteristics', 'string'),
  f('operated_class', 'Operated Class', 'Characteristics', 'string'),
  f('wi', 'Working Interest', 'Ownership', 'numeric', { unit: 'fraction', min: 0, max: 1 }),
  f('nri', 'Net Revenue Interest', 'Ownership', 'numeric', { unit: 'fraction', min: 0, max: 1 }),
  f('lateral_length', 'Lateral Length', 'Completion', 'numeric', { unit: 'ft', min: 0, max: 25000 }),
  f('total_depth', 'Total Depth', 'Completion', 'numeric', { unit: 'ft', min: 0, max: 30000 }),
  f('true_vertical_depth', 'True Vertical Depth', 'Completion', 'numeric', { unit: 'ft', min: 0, max: 25000 }),
  f('stage_total', 'Frac Stages', 'Completion', 'numeric', { unit: 'stages', min: 0, max: 120 }),
  f('proppant_total', 'Proppant (total)', 'Completion', 'numeric', { unit: 'lbs', min: 0, max: 50_000_000 }),
  f('proppant_per_ft', 'Proppant / ft', 'Completion', 'numeric', { unit: 'lbs/ft', min: 0, max: 4000 }),
  f('fluid_total', 'Fluid (total)', 'Completion', 'numeric', { unit: 'gal', min: 0, max: 80_000_000 }),
  f('fluid_per_ft', 'Fluid / ft', 'Completion', 'numeric', { unit: 'gal/ft', min: 0, max: 6000 }),
  f('permit_date', 'Permit Date', 'Dates', 'date'),
  f('spud_date', 'Spud Date', 'Dates', 'date'),
  f('completion_date', 'Completion Date', 'Dates', 'date'),
  f('first_prod_date', 'First Production', 'Dates', 'date'),
  f('last_prod_date', 'Last Production', 'Dates', 'date'),
  f('rig_release_date', 'Rig Release', 'Dates', 'date'),
  f('cum_boe_to_date', 'Cum BOE (life)', 'Production', 'numeric', { unit: 'boe', min: 0, max: 5_000_000 }),
  f('cum_oil_to_date', 'Cum Oil (life)', 'Production', 'numeric', { unit: 'bbl', min: 0, max: 3_000_000 }),
  f('cum_gas_to_date', 'Cum Gas (life)', 'Production', 'numeric', { unit: 'mcf', min: 0, max: 20_000_000 }),
  f('cum_boe_3mo', 'Cum BOE (90d / 3mo)', 'Production', 'numeric', { unit: 'boe', min: 0, max: 600_000 }),
  f('cum_boe_6mo', 'Cum BOE (180d / 6mo)', 'Production', 'numeric', { unit: 'boe', min: 0, max: 900_000 }),
  f('cum_boe_12mo', 'Cum BOE (365d / 12mo)', 'Production', 'numeric', { unit: 'boe', min: 0, max: 1_400_000 }),
  f('cum_boe_24mo', 'Cum BOE (24mo)', 'Production', 'numeric', { unit: 'boe', min: 0, max: 2_000_000 }),
  f('cum_boe_12mo_per_ft', 'Cum BOE/ft (12mo)', 'Production', 'numeric', { unit: 'boe/ft', min: 0, max: 160 }),
  f('peak_boe', 'Peak BOE (month)', 'Production', 'numeric', { unit: 'boe', min: 0, max: 120_000 }),
  f('gor_cum_to_date', 'GOR (life)', 'Production', 'numeric', { unit: 'scf/bbl', min: 0, max: 20000 }),
  f('water_cut_cum_to_date', 'Water Cut (life)', 'Production', 'numeric', { unit: 'fraction', min: 0, max: 1 }),
  f('first_prod_year', 'First Prod. Year', 'Production', 'numeric', { min: 1980, max: 2026 }),
  f('eur_boe', 'EUR BOE', 'EUR', 'numeric', { unit: 'boe', min: 0, max: 4_000_000 }),
  f('eur_oil_bbl', 'EUR Oil', 'EUR', 'numeric', { unit: 'bbl', min: 0, max: 2_500_000 }),
  f('eur_gas_mcf', 'EUR Gas', 'EUR', 'numeric', { unit: 'mcf', min: 0, max: 18_000_000 }),
  f('eur_boe_per_ft', 'EUR BOE / ft', 'EUR', 'numeric', { unit: 'boe/ft', min: 0, max: 320 }),
  f('eur_source', 'EUR Source', 'EUR', 'string'),
  f('initial_reservoir_pressure', 'Initial Pressure', 'Reservoir', 'numeric', { unit: 'psi', min: 0, max: 15000 }),
  f('reservoir_temperature', 'Reservoir Temp.', 'Reservoir', 'numeric', { unit: '\u00b0F', min: 0, max: 400 }),
  f('effective_porosity', 'Porosity (P50)', 'Reservoir', 'numeric', { unit: 'fraction', min: 0, max: 0.4 }),
  f('water_saturation', 'Water Saturation', 'Reservoir', 'numeric', { unit: 'fraction', min: 0, max: 1 }),
  f('initial_oil_gravity', 'Oil Gravity', 'Reservoir', 'numeric', { unit: '\u00b0API', min: 0, max: 70 }),
  f('env_spacing_status', 'Spacing Status', 'Spacing', 'string'),
  f('env_dist_to_neighbor_same_zone_hz', 'Dist. to Neighbor (HZ)', 'Spacing', 'numeric', { unit: 'ft', min: 0, max: 6000 }),
];

const LOCAL_CATEGORY_ORDER = [
  'Location', 'Operator', 'Status', 'Characteristics', 'Ownership',
  'Completion', 'Dates', 'Production', 'EUR', 'Reservoir', 'Spacing',
];

const LOCAL_FIELD_BY_NAME = new Map(LOCAL_FIELDS.map((field) => [field.name, field]));

const LOCAL_BASINS = [
  'PERMIAN', 'WILLISTON', 'ANADARKO', 'POWDER RIVER', 'DJ',
  'EAGLE FORD', 'BAKKEN', 'HAYNESVILLE', 'APPALACHIAN', 'UINTA',
];

const LOCAL_VALUES: Record<string, string[]> = {
  basin: LOCAL_BASINS,
  state: ['TEXAS', 'NEW MEXICO', 'NORTH DAKOTA', 'OKLAHOMA', 'WYOMING', 'COLORADO', 'MONTANA', 'LOUISIANA', 'PENNSYLVANIA', 'UTAH'],
  county: ['MIDLAND', 'MARTIN', 'REEVES', 'LOVING', 'HOWARD', 'LEA', 'EDDY', 'MCKENZIE', 'WILLIAMS', 'DUNN', 'WELD', 'KARNES', 'DEWITT', 'CANADIAN'],
  formation: ['WOLFCAMP A', 'WOLFCAMP B', 'BONE SPRING', 'SPRABERRY', 'AVALON', 'BAKKEN', 'THREE FORKS', 'MERAMEC', 'WOODFORD', 'NIOBRARA', 'CODELL'],
  operator: ['CONTINENTAL RESOURCES', 'EXXON XTO', 'CHEVRON', 'OXY', 'DIAMONDBACK', 'PIONEER', 'DEVON', 'EOG RESOURCES', 'COTERRA', 'CONOCOPHILLIPS', 'MARATHON', 'APACHE'],
  well_status: ['PRODUCING', 'DUC', 'PERMIT', 'INACTIVE', 'PLUGGED AND ABANDONED'],
  operated_class: ['OP', 'NONOP', 'NOINT'],
  wellbore_direction: ['HORIZONTAL', 'VERTICAL', 'DIRECTIONAL'],
  well_type: ['DEVELOPMENT', 'EXPLORATION', 'INFILL', 'DELINEATION'],
  eur_source: ['ENVERUS', 'NOVI LABS', 'ARIES EVERGREEN', 'ARIES PUBLIC'],
  env_spacing_status: ['CO-COMPLETED', 'CHILD', 'PARENT', 'STANDALONE'],
  zone: ['UPPER', 'MIDDLE', 'LOWER'],
  region: ['NORTH', 'SOUTH'],
};

const LOCAL_BASIN_BASE: Record<string, number> = {
  PERMIAN: 612_000, WILLISTON: 184_000, ANADARKO: 158_000, 'POWDER RIVER': 96_000, DJ: 142_000,
  'EAGLE FORD': 121_000, BAKKEN: 96_500, HAYNESVILLE: 88_000, APPALACHIAN: 203_000, UINTA: 41_000,
};

const LOCAL_COUNT_CAP = 4_600_000;
const LOCAL_DATE_MIN = '2008-01-01';

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

async function setupFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  // Respect a caller-provided signal too.
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }
  try {
    const res = await fetch(`${SETUP_API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Setup service error (${res.status})`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

// ---------------------------------------------------------------------------
// Local fallback computations (mirror backend mock paths)
// ---------------------------------------------------------------------------

function localSchema(): SchemaResponse {
  const categories = LOCAL_CATEGORY_ORDER.filter((c) => LOCAL_FIELDS.some((field) => field.category === c));
  return { fields: LOCAL_FIELDS, categories, table: 'eds.well.tbl_well_summary_all' };
}

function localFieldValues(field: string): FieldValuesResponse {
  return { field, values: LOCAL_VALUES[field] ?? [], source: 'mock' };
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function localFieldStats(field: string): FieldStatsResponse {
  const def = LOCAL_FIELD_BY_NAME.get(field);
  if (!def || (def.data_type !== 'numeric' && def.data_type !== 'date')) {
    return { field, data_type: def?.data_type ?? 'string', source: 'mock' };
  }
  if (def.data_type === 'date') {
    return { field, data_type: 'date', min_date: LOCAL_DATE_MIN, max_date: todayIso(), source: 'mock' };
  }
  return { field, data_type: 'numeric', min: def.min ?? 0, max: def.max ?? 100, source: 'mock' };
}

function clauseSelectivity(clause: FilterClause): number {
  if (clause.kind === 'set' && clause.values?.length) return Math.min(0.92, 0.16 * clause.values.length + 0.05);
  if (clause.kind === 'numeric') return clause.op === 'between' ? 0.34 : 0.45;
  if (clause.kind === 'date') return clause.start && clause.end ? 0.28 : 0.5;
  if (clause.kind === 'string') return clause.match === 'strict' ? 0.12 : 0.3;
  return 1;
}

function localEstimateCount(basin: string | null, filters: FilterClause[]): CountResponse {
  const capped = !basin && filters.length === 0;
  let estimate = basin ? LOCAL_BASIN_BASE[basin.toUpperCase()] ?? 120_000 : LOCAL_COUNT_CAP;
  for (const clause of filters) estimate *= clauseSelectivity(clause);
  return { count: Math.max(0, Math.round(estimate)), estimated: true, capped, source: 'mock' };
}

function monthsAgoIso(months: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - months, Math.min(now.getDate(), 28));
  return d.toISOString().slice(0, 10);
}

const NUMERIC_PHRASES: [string, string][] = [
  ['lateral', 'lateral_length'], ['cum boe 12', 'cum_boe_12mo'], ['cum boe 6', 'cum_boe_6mo'],
  ['cum boe 3', 'cum_boe_3mo'], ['365', 'cum_boe_12mo'], ['180', 'cum_boe_6mo'], ['90', 'cum_boe_3mo'],
  ['cum boe', 'cum_boe_to_date'], ['eur', 'eur_boe'], ['stage', 'stage_total'], ['proppant', 'proppant_total'],
  ['pressure', 'initial_reservoir_pressure'],
];
const LT_WORDS = ['under', 'below', 'less than', 'fewer than', 'at most', '<'];
// Generic phrases yield a clause only when no more-specific family member matched.
const GENERIC_FAMILY: Record<string, string> = { cum_boe_to_date: 'cum_boe', eur_boe: 'eur' };

function escapeRe(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function wordIn(value: string, text: string): boolean {
  return new RegExp(`\\b${escapeRe(value.toLowerCase())}\\b`).test(text);
}

function findNumberAfter(text: string, phrase: string): number | null {
  const idx = text.indexOf(phrase);
  if (idx === -1) return null;
  const window = text.slice(idx + phrase.length, idx + phrase.length + 48);
  const match = window.match(/([\d,]+(?:\.\d+)?)(?!\s*mo)\s*(mmboe|mboe|mm|bcf|k|m(?!o)|b)?/);
  if (!match) return null;
  const value = parseFloat(match[1].replace(/,/g, ''));
  if (Number.isNaN(value)) return null;
  const mult: Record<string, number> = { k: 1e3, mboe: 1e3, mm: 1e6, mmboe: 1e6, m: 1e6, b: 1e9 };
  return value * (mult[(match[2] || '').toLowerCase()] ?? 1);
}

function localInterpret(query: string, basin: string | null): InterpretResponse {
  const text = query.toLowerCase();
  const filters: FilterClause[] = [];
  let matched = 0;
  let detectedBasin = basin;

  for (const value of LOCAL_BASINS) {
    if (wordIn(value, text)) { detectedBasin = value; matched += 1; break; }
  }
  for (const fieldName of ['state', 'county', 'formation', 'operator', 'well_status']) {
    const hits = (LOCAL_VALUES[fieldName] ?? []).filter((v) => wordIn(v, text));
    if (hits.length) { filters.push({ field: fieldName, kind: 'set', values: hits }); matched += 1; }
  }
  for (const [word, status] of [['producing', 'PRODUCING'], ['duc', 'DUC'], ['permit', 'PERMIT']] as const) {
    if (new RegExp(`\\b${word}`).test(text) && !filters.some((c) => c.field === 'well_status')) {
      filters.push({ field: 'well_status', kind: 'set', values: [status] }); matched += 1; break;
    }
  }
  const monthMatch = text.match(/last\s+(\d{1,2})\s+month/);
  if (monthMatch) {
    const dateField = text.includes('spud') ? 'spud_date' : text.includes('permit') ? 'permit_date' : 'first_prod_date';
    filters.push({ field: dateField, kind: 'date', start: monthsAgoIso(parseInt(monthMatch[1], 10)) });
    matched += 1;
  }
  const yearMatch = text.match(/(?:since|after|from)\s+(\d{4})/);
  if (yearMatch) {
    const dateField = text.includes('spud') ? 'spud_date' : 'first_prod_date';
    if (!filters.some((c) => c.field === dateField)) {
      filters.push({ field: dateField, kind: 'date', start: `${yearMatch[1]}-01-01` });
      matched += 1;
    }
  }
  for (const [phrase, fieldName] of NUMERIC_PHRASES) {
    if (!text.includes(phrase) || filters.some((c) => c.field === fieldName)) continue;
    const family = GENERIC_FAMILY[fieldName];
    if (family && filters.some((c) => c.field.startsWith(family))) continue;
    const value = findNumberAfter(text, phrase);
    if (value !== null) {
      const op = LT_WORDS.some((w) => text.includes(w)) ? 'lte' : 'gte';
      filters.push({ field: fieldName, kind: 'numeric', op, value });
      matched += 1;
    }
  }

  const confidence = filters.length === 0 ? 0 : Math.min(0.85, 0.35 + 0.12 * matched);
  return {
    filters,
    basin: detectedBasin,
    summary: filters.length ? summarizeClauses(filters) : 'Couldn\u2019t infer filters offline. Try naming a basin, formation, or threshold.',
    confidence,
    source: 'mock',
    notes: filters.length ? null : 'no_match',
  };
}

function localPresets(basin: string | null): PresetsResponse {
  if (!basin) return { presets: [], basin: null, requires_basin: true, source: 'mock' };
  const b = basin.toLowerCase();
  const defs: Omit<PresetProject, 'est_count'>[] = [
    { id: `${b}-recent-permits`, title: 'Fresh permits', subtitle: 'Permitted in the last 6 months', basin: basin.toUpperCase(), metric_label: 'New permits', accent: 'cyan', filters: [{ field: 'well_status', kind: 'set', values: ['PERMIT'] }, { field: 'permit_date', kind: 'date', start: monthsAgoIso(6) }] },
    { id: `${b}-recent-spuds`, title: 'Recently spud', subtitle: 'Spud in the last 3 months', basin: basin.toUpperCase(), metric_label: 'Wells spud', accent: 'warning', filters: [{ field: 'spud_date', kind: 'date', start: monthsAgoIso(3) }] },
    { id: `${b}-top-12mo-boe`, title: 'Top 12-month BOE', subtitle: 'Cum BOE (365d) over 250 MBOE', basin: basin.toUpperCase(), metric_label: 'High-cum wells', accent: 'magenta', filters: [{ field: 'cum_boe_12mo', kind: 'numeric', op: 'gte', value: 250_000 }] },
    { id: `${b}-modern-completions`, title: 'Modern completions', subtitle: 'Long laterals, first prod since 2022', basin: basin.toUpperCase(), metric_label: 'Recent completions', accent: 'lav', filters: [{ field: 'lateral_length', kind: 'numeric', op: 'gte', value: 10_000 }, { field: 'first_prod_date', kind: 'date', start: '2022-01-01' }] },
  ];
  const presets: PresetProject[] = defs.map((d) => ({ ...d, est_count: localEstimateCount(basin, d.filters).count }));
  return { presets, basin: basin.toUpperCase(), requires_basin: true, source: 'mock' };
}

// ---------------------------------------------------------------------------
// Public API (backend-first, local fallback)
// ---------------------------------------------------------------------------

export async function fetchSchema(signal?: AbortSignal): Promise<SchemaResponse> {
  try {
    return await setupFetch<SchemaResponse>('/schema', { method: 'GET', signal });
  } catch (error) {
    if (isAbort(error)) throw error;
    return localSchema();
  }
}

export async function fetchFieldValues(field: string, signal?: AbortSignal): Promise<FieldValuesResponse> {
  try {
    return await setupFetch<FieldValuesResponse>(`/values/${encodeURIComponent(field)}`, { method: 'GET', signal });
  } catch (error) {
    if (isAbort(error)) throw error;
    return localFieldValues(field);
  }
}

export async function fetchFieldStats(
  field: string,
  basin: string | null,
  filters: FilterClause[],
  signal?: AbortSignal,
): Promise<FieldStatsResponse> {
  try {
    return await setupFetch<FieldStatsResponse>('/field-stats', {
      method: 'POST',
      body: JSON.stringify({ field, basin, filters }),
      signal,
    });
  } catch (error) {
    if (isAbort(error)) throw error;
    return localFieldStats(field);
  }
}

export async function estimateCount(
  basin: string | null,
  filters: FilterClause[],
  signal?: AbortSignal,
): Promise<CountResponse> {
  try {
    return await setupFetch<CountResponse>('/count', {
      method: 'POST',
      body: JSON.stringify({ basin, filters }),
      signal,
    });
  } catch (error) {
    if (isAbort(error)) throw error;
    return localEstimateCount(basin, filters);
  }
}

export async function interpretQuery(
  query: string,
  basin: string | null,
  signal?: AbortSignal,
): Promise<InterpretResponse> {
  try {
    return await setupFetch<InterpretResponse>('/interpret', {
      method: 'POST',
      body: JSON.stringify({ query, basin }),
      signal,
    });
  } catch (error) {
    if (isAbort(error)) throw error;
    return localInterpret(query, basin);
  }
}

export async function fetchPresets(basin: string | null, signal?: AbortSignal): Promise<PresetsResponse> {
  try {
    const qs = basin ? `?basin=${encodeURIComponent(basin)}` : '';
    return await setupFetch<PresetsResponse>(`/presets${qs}`, { method: 'GET', signal });
  } catch (error) {
    if (isAbort(error)) throw error;
    return localPresets(basin);
  }
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const FIELD_LABELS = new Map(LOCAL_FIELDS.map((field) => [field.name, field.label]));

export function fieldLabel(name: string): string {
  return FIELD_LABELS.get(name) ?? name;
}

const NUM_OP_SYMBOL: Record<string, string> = { gt: '>', gte: '\u2265', lt: '<', lte: '\u2264', eq: '=', between: 'between' };

export function summarizeClause(clause: FilterClause): string {
  const label = fieldLabel(clause.field);
  if (clause.kind === 'set' && clause.values?.length) {
    const head = clause.values.slice(0, 3).join(', ');
    return `${label}: ${head}${clause.values.length > 3 ? `\u00a0+${clause.values.length - 3}` : ''}`;
  }
  if (clause.kind === 'numeric' && clause.op) {
    if (clause.op === 'between') return `${label} ${formatNum(clause.value)}\u2013${formatNum(clause.value2)}`;
    return `${label} ${NUM_OP_SYMBOL[clause.op]} ${formatNum(clause.value)}`;
  }
  if (clause.kind === 'date') {
    if (clause.start && clause.end) return `${label}: ${clause.start} \u2192 ${clause.end}`;
    if (clause.start) return `${label} \u2265 ${clause.start}`;
    if (clause.end) return `${label} \u2264 ${clause.end}`;
  }
  if (clause.kind === 'string' && clause.text) {
    return `${label} ${clause.match === 'fuzzy' ? '~' : '='} \u201c${clause.text}\u201d`;
  }
  return label;
}

export function summarizeClauses(clauses: FilterClause[]): string {
  return clauses.map(summarizeClause).join('; ');
}

function formatNum(value?: number): string {
  if (value === undefined || value === null) return '';
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

// ---------------------------------------------------------------------------
// ProjectDraft persistence (handoff to the workspace)
// ---------------------------------------------------------------------------

export const PROJECT_DRAFT_KEY = 'slopcast_project_draft';

export function saveProjectDraft(draft: ProjectDraft): void {
  try {
    localStorage.setItem(PROJECT_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Storage may be unavailable (private mode, quota). The workspace falls back
    // to its own defaults, so this is non-fatal.
  }
}

export function loadProjectDraft(): ProjectDraft | null {
  try {
    const raw = localStorage.getItem(PROJECT_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProjectDraft;
    return parsed?.version === 1 ? parsed : null;
  } catch {
    return null;
  }
}

export function clearProjectDraft(): void {
  try {
    localStorage.removeItem(PROJECT_DRAFT_KEY);
  } catch {
    // ignore
  }
}
