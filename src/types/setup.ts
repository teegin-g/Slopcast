/**
 * Project Setup / Launchpad types.
 *
 * Mirrors backend/setup_models.py. The Launchpad narrows the ~4.6M-well
 * `eds.well.tbl_well_summary_all` universe into a working set before the analyst
 * enters the Slopcast workspace.
 */

export type FieldDataType = 'string' | 'numeric' | 'date' | 'boolean';
export type FilterKind = 'set' | 'numeric' | 'date' | 'string';
export type NumericOp = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'between';
export type MatchMode = 'strict' | 'fuzzy';
export type SetupDataSource = 'databricks' | 'mock';
export type PresetAccent = 'cyan' | 'magenta' | 'lav' | 'warning' | 'success';

export interface WellSummaryField {
  name: string;
  label: string;
  category: string;
  data_type: FieldDataType;
  description?: string;
  unit?: string | null;
  core?: boolean;
  min?: number | null;
  max?: number | null;
}

/** A single narrowing clause. Which fields are populated depends on `kind`. */
export interface FilterClause {
  id?: string;
  field: string;
  kind: FilterKind;
  // set
  values?: string[];
  // numeric
  op?: NumericOp;
  value?: number;
  value2?: number;
  // date (ISO yyyy-mm-dd)
  start?: string;
  end?: string;
  // string
  text?: string;
  match?: MatchMode;
}

export interface SchemaResponse {
  fields: WellSummaryField[];
  categories: string[];
  table: string;
}

export interface FieldValuesResponse {
  field: string;
  values: string[];
  source: SetupDataSource;
}

export interface FieldStatsResponse {
  field: string;
  data_type: FieldDataType;
  min?: number | null;
  max?: number | null;
  min_date?: string | null;
  max_date?: string | null;
  source: SetupDataSource;
}

export interface CountResponse {
  count: number;
  estimated: boolean;
  capped: boolean;
  source: SetupDataSource;
}

export interface InterpretResponse {
  filters: FilterClause[];
  basin?: string | null;
  summary: string;
  confidence: number;
  source: SetupDataSource;
  notes?: string | null;
}

export interface PresetProject {
  id: string;
  title: string;
  subtitle: string;
  basin: string;
  metric_label: string;
  accent: PresetAccent;
  filters: FilterClause[];
  est_count?: number | null;
}

export interface PresetsResponse {
  presets: PresetProject[];
  basin?: string | null;
  requires_basin: boolean;
  source: SetupDataSource;
}

/**
 * Persisted handoff between the Launchpad and the workspace. Written to
 * localStorage on "Enter workspace"; the workspace hook consumes it to seed the
 * initial well universe. Deep consumption is a documented future contract.
 */
export interface ProjectDraft {
  version: 1;
  basin: string | null;
  filters: FilterClause[];
  estimatedCount: number | null;
  estimated: boolean;
  source: SetupDataSource;
  query: string | null;
  createdAt: string;
}
