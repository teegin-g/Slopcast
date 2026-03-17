/**
 * Profile Repository — CRUD for deal type curve presets.
 * Uses the deal_type_curve_presets table created in the Phase 1A migration.
 */

import type { DealTypeCurvePreset, ProfileType } from '../types';
import { getSupabaseClient } from './supabaseClient';

function requireSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }
  return supabase;
}

function unwrapContract<T>(value: unknown): T {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return (value ?? {}) as T;
  }
  const next = { ...(value as Record<string, unknown>) };
  delete next.schema_version;
  delete next.validated_at;
  delete next.validator_name;
  return next as T;
}

function mapRow(row: any): DealTypeCurvePreset {
  return {
    id: row.id,
    organizationId: row.organization_id,
    ownerUserId: row.owner_user_id,
    scope: row.scope,
    name: row.name,
    profileType: row.preset_type as ProfileType,
    parentPresetId: row.parent_preset_id ?? null,
    basin: row.basin,
    formation: row.formation,
    operator: row.operator,
    config: unwrapContract<Record<string, unknown>>(row.config_jsonb),
    isTemplate: row.is_template,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ListPresetsFilters {
  profileType?: ProfileType;
  basin?: string;
  formation?: string;
  operator?: string;
  includeTemplates?: boolean;
}

export async function listPresets(filters?: ListPresetsFilters): Promise<DealTypeCurvePreset[]> {
  const supabase = requireSupabase();

  let query = supabase
    .from('model_presets')
    .select('*')
    .order('updated_at', { ascending: false });

  if (filters?.profileType) {
    query = query.eq('preset_type', filters.profileType);
  }
  if (filters?.basin) {
    query = query.eq('basin', filters.basin);
  }
  if (filters?.formation) {
    query = query.eq('formation', filters.formation);
  }
  if (filters?.operator) {
    query = query.eq('operator', filters.operator);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapRow);
}

export async function getPreset(id: string): Promise<DealTypeCurvePreset | null> {
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from('model_presets')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRow(data) : null;
}

export interface CreatePresetPayload {
  name: string;
  profileType: ProfileType;
  parentPresetId?: string | null;
  basin?: string | null;
  formation?: string | null;
  operator?: string | null;
  config: Record<string, unknown>;
  isTemplate?: boolean;
}

export async function createPreset(payload: CreatePresetPayload): Promise<DealTypeCurvePreset> {
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from('model_presets')
    .insert({
      name: payload.name,
      scope: 'user',
      preset_type: payload.profileType,
      basin: payload.basin ?? null,
      formation: payload.formation ?? null,
      operator: payload.operator ?? null,
      config_jsonb: payload.config,
      is_template: payload.isTemplate ?? false,
    })
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}

export async function updatePreset(
  id: string,
  updates: Partial<CreatePresetPayload>
): Promise<DealTypeCurvePreset> {
  const supabase = requireSupabase();

  const row: Record<string, unknown> = {};
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.profileType !== undefined) row.preset_type = updates.profileType;
  if (updates.basin !== undefined) row.basin = updates.basin;
  if (updates.formation !== undefined) row.formation = updates.formation;
  if (updates.operator !== undefined) row.operator = updates.operator;
  if (updates.config !== undefined) row.config_jsonb = updates.config;
  if (updates.isTemplate !== undefined) row.is_template = updates.isTemplate;
  row.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('model_presets')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}

export async function deletePreset(id: string): Promise<void> {
  const supabase = requireSupabase();

  const { error } = await supabase
    .from('model_presets')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
