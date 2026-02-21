import type {
  EconomicsRunGroupMetricRecord,
  EconomicsRunRecord,
  ProjectGroupRecord,
  ProjectRecord,
  ProjectScenarioRecord,
  ProjectUiState,
} from '../types';
import type { Json } from '../supabase/types/database';
import { getSupabaseClient } from './supabaseClient';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const toJson = (value: unknown): Json => value as Json;

const isUuid = (value: string) => UUID_RE.test(value);

const makeUuid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
  return `${s4()}${s4()}-${s4()}-4${s4().slice(1)}-a${s4().slice(1)}-${s4()}${s4()}${s4()}`;
};

const normalizeRole = (value: string | null | undefined) => {
  if (value === 'owner' || value === 'editor' || value === 'viewer') return value;
  return 'viewer' as const;
};

export interface SaveProjectPayload {
  projectId?: string | null;
  name: string;
  description?: string | null;
  activeGroupId: string | null;
  uiState: ProjectUiState;
  groups: Array<{
    id: string;
    name: string;
    color: string;
    sortOrder: number;
    wellExternalKeys: string[];
    typeCurve: unknown;
    capex: unknown;
    opex: unknown;
    ownership: unknown;
  }>;
  scenarios: Array<{
    id: string;
    name: string;
    color: string;
    isBaseCase: boolean;
    pricing: unknown;
    schedule: unknown;
    capexScalar: number;
    productionScalar: number;
    sortOrder: number;
  }>;
}

export interface SaveProjectResult {
  projectId: string;
  groupIdMap: Record<string, string>;
  scenarioIdMap: Record<string, string>;
}

export interface LoadedProjectBundle {
  project: ProjectRecord;
  memberRole: 'owner' | 'editor' | 'viewer';
  groups: ProjectGroupRecord[];
  scenarios: ProjectScenarioRecord[];
}

export interface RunEconomicsPayload {
  inputHash: string;
  portfolioMetrics: EconomicsRunRecord['portfolioMetrics'];
  warnings: string[];
  groupMetrics: Array<{
    projectGroupId: string;
    rank: number | null;
    metrics: EconomicsRunGroupMetricRecord['metrics'];
  }>;
}

function requireSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY.');
  }
  return supabase;
}

async function requireUserId() {
  const supabase = requireSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user?.id) {
    throw new Error('No authenticated Supabase user.');
  }
  return data.user.id;
}

export async function listProjects(): Promise<ProjectRecord[]> {
  await requireUserId();
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from('projects')
    .select('id, owner_user_id, name, description, active_group_id, ui_state, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    description: row.description,
    activeGroupId: row.active_group_id,
    uiState: (row.ui_state || {}) as ProjectUiState,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getProject(projectId: string): Promise<LoadedProjectBundle> {
  await requireUserId();
  const supabase = requireSupabase();

  const [{ data: projectRow, error: projectError }, { data: roleData, error: roleError }] = await Promise.all([
    supabase
      .from('projects')
      .select('id, owner_user_id, name, description, active_group_id, ui_state, created_at, updated_at')
      .eq('id', projectId)
      .maybeSingle(),
    supabase.rpc('current_project_role', { target_project_id: projectId }),
  ]);

  if (projectError) throw projectError;
  if (roleError) throw roleError;
  if (!projectRow) throw new Error(`Project not found: ${projectId}`);

  const [groupsRes, scenariosRes] = await Promise.all([
    supabase
      .from('project_groups')
      .select('id, project_id, name, color, sort_order, type_curve, capex, opex, ownership, created_at, updated_at')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('project_scenarios')
      .select('id, project_id, name, color, is_base_case, pricing, schedule, capex_scalar, production_scalar, sort_order, created_at, updated_at')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true }),
  ]);

  if (groupsRes.error) throw groupsRes.error;
  if (scenariosRes.error) throw scenariosRes.error;

  const groupRows = groupsRes.data || [];
  const groupIds = groupRows.map((row: any) => row.id);

  let wellsByGroup = new Map<string, string[]>();
  if (groupIds.length > 0) {
    const groupWellsRes = await supabase
      .from('project_group_wells')
      .select('project_group_id, well_id')
      .in('project_group_id', groupIds);
    if (groupWellsRes.error) throw groupWellsRes.error;

    const wellIds = Array.from(new Set((groupWellsRes.data || []).map((row: any) => row.well_id)));
    const externalByWellId = new Map<string, string>();
    if (wellIds.length > 0) {
      const wellsRes = await supabase.from('wells').select('id, external_key').in('id', wellIds);
      if (wellsRes.error) throw wellsRes.error;
      (wellsRes.data || []).forEach((row: any) => {
        if (row.external_key) externalByWellId.set(row.id, row.external_key);
      });
    }

    wellsByGroup = (groupWellsRes.data || []).reduce((acc: Map<string, string[]>, row: any) => {
      const externalKey = externalByWellId.get(row.well_id);
      if (!externalKey) return acc;
      const next = acc.get(row.project_group_id) || [];
      next.push(externalKey);
      acc.set(row.project_group_id, next);
      return acc;
    }, new Map<string, string[]>());
  }

  return {
    project: {
      id: projectRow.id,
      ownerUserId: projectRow.owner_user_id,
      name: projectRow.name,
      description: projectRow.description,
      activeGroupId: projectRow.active_group_id,
      uiState: (projectRow.ui_state || {}) as ProjectUiState,
      createdAt: projectRow.created_at,
      updatedAt: projectRow.updated_at,
    },
    memberRole: normalizeRole((roleData as string | null) ?? null),
    groups: groupRows.map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      name: row.name,
      color: row.color,
      sortOrder: row.sort_order,
      wellIds: wellsByGroup.get(row.id) || [],
      typeCurve: row.type_curve,
      capex: row.capex,
      opex: row.opex,
      ownership: row.ownership,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    scenarios: (scenariosRes.data || []).map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      name: row.name,
      color: row.color,
      isBaseCase: row.is_base_case,
      pricing: row.pricing,
      schedule: row.schedule,
      capexScalar: row.capex_scalar,
      productionScalar: row.production_scalar,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  };
}

export async function saveProject(payload: SaveProjectPayload): Promise<SaveProjectResult> {
  await requireUserId();
  const supabase = requireSupabase();

  const groupIdMap = payload.groups.reduce<Record<string, string>>((acc, group) => {
    acc[group.id] = isUuid(group.id) ? group.id : makeUuid();
    return acc;
  }, {});

  const scenarioIdMap = payload.scenarios.reduce<Record<string, string>>((acc, scenario) => {
    acc[scenario.id] = isUuid(scenario.id) ? scenario.id : makeUuid();
    return acc;
  }, {});

  const allExternalKeys = Array.from(
    new Set(payload.groups.flatMap((group) => group.wellExternalKeys).filter(Boolean))
  );

  const wellIdByExternal = new Map<string, string>();
  if (allExternalKeys.length > 0) {
    const { data: wells, error } = await supabase
      .from('wells')
      .select('id, external_key')
      .in('external_key', allExternalKeys);
    if (error) throw error;

    (wells || []).forEach((row: any) => {
      if (row.external_key) {
        wellIdByExternal.set(row.external_key, row.id);
      }
    });

    const missing = allExternalKeys.filter((key) => !wellIdByExternal.has(key));
    if (missing.length > 0) {
      throw new Error(`Missing canonical wells for external keys: ${missing.join(', ')}`);
    }
  }

  const normalizedGroups = payload.groups.map((group) => ({
    id: groupIdMap[group.id],
    name: group.name,
    color: group.color,
    sort_order: group.sortOrder,
    type_curve: toJson(group.typeCurve),
    capex: toJson(group.capex),
    opex: toJson(group.opex),
    ownership: toJson(group.ownership),
    well_ids: group.wellExternalKeys
      .map((externalKey) => wellIdByExternal.get(externalKey))
      .filter((value): value is string => !!value),
  }));

  const normalizedScenarios = payload.scenarios.map((scenario) => ({
    id: scenarioIdMap[scenario.id],
    name: scenario.name,
    color: scenario.color,
    is_base_case: scenario.isBaseCase,
    pricing: toJson(scenario.pricing),
    schedule: toJson(scenario.schedule),
    capex_scalar: scenario.capexScalar,
    production_scalar: scenario.productionScalar,
    sort_order: scenario.sortOrder,
  }));

  const normalizedActiveGroupId = payload.activeGroupId
    ? groupIdMap[payload.activeGroupId] ?? null
    : null;

  const { data, error } = await supabase.rpc('save_project_bundle', {
    p_project_id: payload.projectId ?? null,
    p_name: payload.name,
    p_description: payload.description ?? null,
    p_active_group_id: normalizedActiveGroupId,
    p_ui_state: toJson(payload.uiState),
    p_groups: toJson(normalizedGroups),
    p_scenarios: toJson(normalizedScenarios),
  });

  if (error) throw error;

  return {
    projectId: data,
    groupIdMap,
    scenarioIdMap,
  };
}

export async function runEconomics(projectId: string, payload: RunEconomicsPayload): Promise<string> {
  await requireUserId();
  const supabase = requireSupabase();

  const { data, error } = await supabase.rpc('create_economics_run', {
    p_project_id: projectId,
    p_input_hash: payload.inputHash,
    p_portfolio_metrics: toJson(payload.portfolioMetrics),
    p_warnings: toJson(payload.warnings),
    p_group_metrics: toJson(
      payload.groupMetrics.map((row) => ({
        project_group_id: row.projectGroupId,
        rank: row.rank,
        metrics: row.metrics,
      }))
    ),
  });

  if (error) throw error;
  return data;
}

export async function listRuns(projectId: string): Promise<EconomicsRunRecord[]> {
  await requireUserId();
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from('economics_runs')
    .select('id, project_id, triggered_by, input_hash, portfolio_metrics, warnings, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    projectId: row.project_id,
    triggeredBy: row.triggered_by,
    inputHash: row.input_hash,
    portfolioMetrics: row.portfolio_metrics,
    warnings: (row.warnings || []) as string[],
    createdAt: row.created_at,
  }));
}
