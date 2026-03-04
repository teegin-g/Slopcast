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

function mapRow(row: any): DealTypeCurvePreset {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    profileType: row.profile_type as ProfileType,
    parentPresetId: row.parent_preset_id,
    basin: row.basin,
    formation: row.formation,
    operator: row.operator,
    config: (row.config || {}) as Record<string, unknown>,
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
    .from('deal_type_curve_presets')
    .select('*')
    .order('updated_at', { ascending: false });

  if (filters?.profileType) {
    query = query.eq('profile_type', filters.profileType);
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
    .from('deal_type_curve_presets')
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
    .from('deal_type_curve_presets')
    .insert({
      name: payload.name,
      profile_type: payload.profileType,
      parent_preset_id: payload.parentPresetId ?? null,
      basin: payload.basin ?? null,
      formation: payload.formation ?? null,
      operator: payload.operator ?? null,
      config: payload.config,
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
  if (updates.profileType !== undefined) row.profile_type = updates.profileType;
  if (updates.parentPresetId !== undefined) row.parent_preset_id = updates.parentPresetId;
  if (updates.basin !== undefined) row.basin = updates.basin;
  if (updates.formation !== undefined) row.formation = updates.formation;
  if (updates.operator !== undefined) row.operator = updates.operator;
  if (updates.config !== undefined) row.config = updates.config;
  if (updates.isTemplate !== undefined) row.is_template = updates.isTemplate;
  row.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('deal_type_curve_presets')
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
    .from('deal_type_curve_presets')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
