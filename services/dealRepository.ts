import type {
  DealRecord,
  DealWellRecord,
  DealWellGroupRecord,
  DealProductionProfile,
  DealCapexProfile,
  DealOpexProfile,
  DealOwnershipProfile,
  DealScenarioRecord,
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

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface LoadedDealBundle {
  deal: DealRecord;
  memberRole: 'owner' | 'editor' | 'viewer';
  wellGroups: DealWellGroupRecord[];
  wells: DealWellRecord[];
  productionProfiles: DealProductionProfile[];
  capexProfiles: DealCapexProfile[];
  opexProfiles: DealOpexProfile[];
  ownershipProfiles: DealOwnershipProfile[];
  scenarios: DealScenarioRecord[];
}

export interface SaveDealPayload {
  dealId?: string | null;
  name: string;
  category?: string | null;
  status?: string | null;
  basin?: string | null;
  metadata?: Record<string, unknown>;
  kpis?: Record<string, unknown>;
  wellGroups: Array<{
    id: string;
    name: string;
    color: string;
    sortOrder: number;
  }>;
  wells: Array<{
    id: string;
    wellId?: string | null;
    slopcastWellId: string;
    groupId?: string | null;
    wellType: string;
    metadata?: Record<string, unknown>;
  }>;
  productionProfiles: Array<{
    id: string;
    groupId?: string | null;
    wellId?: string | null;
    name: string;
    qi: number;
    b: number;
    di: number;
    terminalDecline: number;
    gorMcfPerBbl: number;
    waterCut: number;
    params?: Record<string, unknown>;
  }>;
  capexProfiles: Array<{
    id: string;
    groupId?: string | null;
    wellId?: string | null;
    name: string;
    rigCount: number;
    drillDurationDays: number;
    stimDurationDays: number;
    rigStartDate?: string | null;
    items: unknown[];
  }>;
  opexProfiles: Array<{
    id: string;
    groupId?: string | null;
    wellId?: string | null;
    name: string;
    segments: unknown[];
  }>;
  ownershipProfiles: Array<{
    id: string;
    groupId?: string | null;
    wellId?: string | null;
    name: string;
    baseNri: number;
    baseCostInterest: number;
    agreements: unknown[];
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

export interface SaveDealResult {
  dealId: string;
  wellGroupIdMap: Record<string, string>;
  wellIdMap: Record<string, string>;
  scenarioIdMap: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function ensureUuid(map: Record<string, string>, id: string): string {
  if (!map[id]) {
    map[id] = isUuid(id) ? id : makeUuid();
  }
  return map[id];
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function listDeals(): Promise<DealRecord[]> {
  await requireUserId();
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from('deals')
    .select('id, owner_user_id, name, category, status, basin, metadata, baseline_scenario_id, kpis, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    category: row.category,
    status: row.status,
    basin: row.basin,
    metadata: (row.metadata || {}) as Record<string, unknown>,
    baselineScenarioId: row.baseline_scenario_id,
    kpis: (row.kpis || {}) as DealRecord['kpis'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getDeal(dealId: string): Promise<LoadedDealBundle> {
  await requireUserId();
  const supabase = requireSupabase();

  const [{ data: dealRow, error: dealError }, { data: roleData, error: roleError }] = await Promise.all([
    supabase
      .from('deals')
      .select('id, owner_user_id, name, category, status, basin, metadata, baseline_scenario_id, kpis, created_at, updated_at')
      .eq('id', dealId)
      .maybeSingle(),
    supabase.rpc('current_deal_role', { target_deal_id: dealId }),
  ]);

  if (dealError) throw dealError;
  if (roleError) throw roleError;
  if (!dealRow) throw new Error(`Deal not found: ${dealId}`);

  const [wellGroupsRes, wellsRes, prodRes, capexRes, opexRes, ownershipRes, scenariosRes] = await Promise.all([
    supabase
      .from('deal_well_groups')
      .select('id, deal_id, name, color, sort_order, created_at, updated_at')
      .eq('deal_id', dealId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('deal_wells')
      .select('id, deal_id, well_id, slopcast_well_id, group_id, well_type, metadata, created_at')
      .eq('deal_id', dealId),
    supabase
      .from('deal_production_profiles')
      .select('id, deal_id, group_id, well_id, name, qi, b, di, terminal_decline, gor_mcf_per_bbl, water_cut, params, created_at, updated_at')
      .eq('deal_id', dealId),
    supabase
      .from('deal_capex_profiles')
      .select('id, deal_id, group_id, well_id, name, rig_count, drill_duration_days, stim_duration_days, rig_start_date, items, created_at, updated_at')
      .eq('deal_id', dealId),
    supabase
      .from('deal_opex_profiles')
      .select('id, deal_id, group_id, well_id, name, segments, created_at, updated_at')
      .eq('deal_id', dealId),
    supabase
      .from('deal_ownership_profiles')
      .select('id, deal_id, group_id, well_id, name, base_nri, base_cost_interest, agreements, created_at, updated_at')
      .eq('deal_id', dealId),
    supabase
      .from('deal_scenarios')
      .select('id, deal_id, name, color, is_base_case, pricing, schedule, capex_scalar, production_scalar, sort_order, created_at, updated_at')
      .eq('deal_id', dealId)
      .order('sort_order', { ascending: true }),
  ]);

  if (wellGroupsRes.error) throw wellGroupsRes.error;
  if (wellsRes.error) throw wellsRes.error;
  if (prodRes.error) throw prodRes.error;
  if (capexRes.error) throw capexRes.error;
  if (opexRes.error) throw opexRes.error;
  if (ownershipRes.error) throw ownershipRes.error;
  if (scenariosRes.error) throw scenariosRes.error;

  return {
    deal: {
      id: dealRow.id,
      ownerUserId: dealRow.owner_user_id,
      name: dealRow.name,
      category: dealRow.category,
      status: dealRow.status,
      basin: dealRow.basin,
      metadata: (dealRow.metadata || {}) as Record<string, unknown>,
      baselineScenarioId: dealRow.baseline_scenario_id,
      kpis: (dealRow.kpis || {}) as DealRecord['kpis'],
      createdAt: dealRow.created_at,
      updatedAt: dealRow.updated_at,
    },
    memberRole: normalizeRole((roleData as string | null) ?? null),
    wellGroups: (wellGroupsRes.data || []).map((row: any) => ({
      id: row.id,
      dealId: row.deal_id,
      name: row.name,
      color: row.color,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    wells: (wellsRes.data || []).map((row: any) => ({
      id: row.id,
      dealId: row.deal_id,
      wellId: row.well_id,
      slopcastWellId: row.slopcast_well_id,
      groupId: row.group_id,
      wellType: row.well_type,
      metadata: (row.metadata || {}) as Record<string, unknown>,
      createdAt: row.created_at,
    })),
    productionProfiles: (prodRes.data || []).map((row: any) => ({
      id: row.id,
      dealId: row.deal_id,
      groupId: row.group_id,
      wellId: row.well_id,
      name: row.name,
      qi: Number(row.qi),
      b: Number(row.b),
      di: Number(row.di),
      terminalDecline: Number(row.terminal_decline),
      gorMcfPerBbl: Number(row.gor_mcf_per_bbl),
      waterCut: Number(row.water_cut),
      params: (row.params || {}) as Record<string, unknown>,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    capexProfiles: (capexRes.data || []).map((row: any) => ({
      id: row.id,
      dealId: row.deal_id,
      groupId: row.group_id,
      wellId: row.well_id,
      name: row.name,
      rigCount: Number(row.rig_count),
      drillDurationDays: Number(row.drill_duration_days),
      stimDurationDays: Number(row.stim_duration_days),
      rigStartDate: row.rig_start_date,
      items: (row.items || []) as DealCapexProfile['items'],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    opexProfiles: (opexRes.data || []).map((row: any) => ({
      id: row.id,
      dealId: row.deal_id,
      groupId: row.group_id,
      wellId: row.well_id,
      name: row.name,
      segments: (row.segments || []) as DealOpexProfile['segments'],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    ownershipProfiles: (ownershipRes.data || []).map((row: any) => ({
      id: row.id,
      dealId: row.deal_id,
      groupId: row.group_id,
      wellId: row.well_id,
      name: row.name,
      baseNri: Number(row.base_nri),
      baseCostInterest: Number(row.base_cost_interest),
      agreements: (row.agreements || []) as DealOwnershipProfile['agreements'],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    scenarios: (scenariosRes.data || []).map((row: any) => ({
      id: row.id,
      dealId: row.deal_id,
      name: row.name,
      color: row.color,
      isBaseCase: row.is_base_case,
      pricing: row.pricing,
      schedule: row.schedule,
      capexScalar: Number(row.capex_scalar),
      productionScalar: Number(row.production_scalar),
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  };
}

export async function saveDeal(payload: SaveDealPayload): Promise<SaveDealResult> {
  await requireUserId();
  const supabase = requireSupabase();

  const wellGroupIdMap: Record<string, string> = {};
  const wellIdMap: Record<string, string> = {};
  const scenarioIdMap: Record<string, string> = {};

  payload.wellGroups.forEach((g) => ensureUuid(wellGroupIdMap, g.id));
  payload.wells.forEach((w) => ensureUuid(wellIdMap, w.id));
  payload.scenarios.forEach((s) => ensureUuid(scenarioIdMap, s.id));

  const profileIdMap: Record<string, string> = {};
  const ensureProfileId = (id: string) => ensureUuid(profileIdMap, id);

  const resolveGroupId = (groupId?: string | null) =>
    groupId ? wellGroupIdMap[groupId] ?? null : null;
  const resolveWellId = (wellId?: string | null) =>
    wellId ? wellIdMap[wellId] ?? null : null;

  const normalizedWellGroups = payload.wellGroups.map((g) => ({
    id: wellGroupIdMap[g.id],
    name: g.name,
    color: g.color,
    sort_order: g.sortOrder,
  }));

  const normalizedWells = payload.wells.map((w) => ({
    id: wellIdMap[w.id],
    well_id: w.wellId ?? null,
    slopcast_well_id: w.slopcastWellId,
    group_id: resolveGroupId(w.groupId),
    well_type: w.wellType,
    metadata: w.metadata ?? {},
  }));

  const normalizedProd = payload.productionProfiles.map((p) => ({
    id: ensureProfileId(p.id),
    group_id: resolveGroupId(p.groupId),
    well_id: resolveWellId(p.wellId),
    name: p.name,
    qi: p.qi,
    b: p.b,
    di: p.di,
    terminal_decline: p.terminalDecline,
    gor_mcf_per_bbl: p.gorMcfPerBbl,
    water_cut: p.waterCut,
    params: p.params ?? {},
  }));

  const normalizedCapex = payload.capexProfiles.map((p) => ({
    id: ensureProfileId(p.id),
    group_id: resolveGroupId(p.groupId),
    well_id: resolveWellId(p.wellId),
    name: p.name,
    rig_count: p.rigCount,
    drill_duration_days: p.drillDurationDays,
    stim_duration_days: p.stimDurationDays,
    rig_start_date: p.rigStartDate ?? null,
    items: p.items,
  }));

  const normalizedOpex = payload.opexProfiles.map((p) => ({
    id: ensureProfileId(p.id),
    group_id: resolveGroupId(p.groupId),
    well_id: resolveWellId(p.wellId),
    name: p.name,
    segments: p.segments,
  }));

  const normalizedOwnership = payload.ownershipProfiles.map((p) => ({
    id: ensureProfileId(p.id),
    group_id: resolveGroupId(p.groupId),
    well_id: resolveWellId(p.wellId),
    name: p.name,
    base_nri: p.baseNri,
    base_cost_interest: p.baseCostInterest,
    agreements: p.agreements,
  }));

  const normalizedScenarios = payload.scenarios.map((s) => ({
    id: scenarioIdMap[s.id],
    name: s.name,
    color: s.color,
    is_base_case: s.isBaseCase,
    pricing: s.pricing,
    schedule: s.schedule,
    capex_scalar: s.capexScalar,
    production_scalar: s.productionScalar,
    sort_order: s.sortOrder,
  }));

  const { data, error } = await supabase.rpc('save_deal_bundle', {
    p_deal_id: payload.dealId ?? null,
    p_name: payload.name,
    p_category: payload.category ?? null,
    p_status: payload.status ?? null,
    p_basin: payload.basin ?? null,
    p_metadata: toJson(payload.metadata ?? {}),
    p_kpis: toJson(payload.kpis ?? {}),
    p_well_groups: toJson(normalizedWellGroups),
    p_wells: toJson(normalizedWells),
    p_production_profiles: toJson(normalizedProd),
    p_capex_profiles: toJson(normalizedCapex),
    p_opex_profiles: toJson(normalizedOpex),
    p_ownership_profiles: toJson(normalizedOwnership),
    p_scenarios: toJson(normalizedScenarios),
  });

  if (error) throw error;

  return {
    dealId: data,
    wellGroupIdMap,
    wellIdMap,
    scenarioIdMap,
  };
}

export async function deleteDeal(dealId: string): Promise<void> {
  await requireUserId();
  const supabase = requireSupabase();

  const { error } = await supabase
    .from('deals')
    .delete()
    .eq('id', dealId);

  if (error) throw error;
}
