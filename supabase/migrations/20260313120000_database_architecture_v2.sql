set check_function_bodies = off;

create extension if not exists postgis;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'disabled')),
  settings_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('org_owner', 'org_admin', 'org_member')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index if not exists organization_members_user_id_idx on public.organization_members(user_id);

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create or replace function public.slugify(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(value, 'workspace')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.with_jsonb_contract(
  payload jsonb,
  validator text default 'slopcast-sql-v2',
  schema_version integer default 2
)
returns jsonb
language sql
stable
as $$
  select
    (coalesce(payload, '{}'::jsonb) - 'schema_version' - 'validated_at' - 'validator_name')
    || jsonb_build_object(
      'schema_version', schema_version,
      'validated_at', now(),
      'validator_name', validator
    );
$$;

create or replace function public.ensure_personal_organization(p_user_id uuid default auth.uid())
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_org_id uuid;
  next_slug text;
  user_email text;
begin
  if p_user_id is null then
    raise exception 'Cannot ensure organization without a user id';
  end if;

  select om.organization_id
  into existing_org_id
  from public.organization_members om
  join public.organizations o on o.id = om.organization_id
  where om.user_id = p_user_id
    and om.role = 'org_owner'
    and coalesce((o.settings_jsonb ->> 'personal')::boolean, false)
  order by o.created_at
  limit 1;

  if existing_org_id is not null then
    return existing_org_id;
  end if;

  select email into user_email
  from auth.users
  where id = p_user_id;

  next_slug := public.slugify(coalesce(split_part(user_email, '@', 1), 'workspace') || '-' || left(replace(p_user_id::text, '-', ''), 8));

  insert into public.organizations (name, slug, settings_jsonb)
  values (
    coalesce(split_part(user_email, '@', 1), 'Workspace') || ' Workspace',
    next_slug,
    jsonb_build_object('personal', true)
  )
  returning id into existing_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (existing_org_id, p_user_id, 'org_owner')
  on conflict (organization_id, user_id) do update set role = excluded.role;

  return existing_org_id;
end;
$$;

create or replace function public.current_organization_role(target_organization_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select om.role
  from public.organization_members om
  where om.organization_id = target_organization_id
    and om.user_id = auth.uid();
$$;

create or replace function public.has_organization_access(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_organization_id
      and om.user_id = auth.uid()
  );
$$;

alter table public.projects
  add column if not exists organization_id uuid references public.organizations(id),
  add column if not exists project_kind text not null default 'portfolio_model',
  add column if not exists status text not null default 'active',
  add column if not exists current_version_id uuid,
  add column if not exists ui_state_jsonb jsonb not null default '{}'::jsonb,
  add column if not exists metadata_jsonb jsonb not null default '{}'::jsonb;

update public.projects
set organization_id = public.ensure_personal_organization(owner_user_id)
where organization_id is null;

update public.projects
set ui_state_jsonb = public.with_jsonb_contract(coalesce(ui_state, '{}'::jsonb), 'project.ui_state')
where ui_state_jsonb = '{}'::jsonb;

update public.projects
set metadata_jsonb = public.with_jsonb_contract(coalesce(metadata_jsonb, '{}'::jsonb), 'project.metadata')
where metadata_jsonb = '{}'::jsonb;

alter table public.projects
  alter column organization_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_project_kind_check'
  ) then
    alter table public.projects
      add constraint projects_project_kind_check
      check (project_kind in ('portfolio_model', 'deal_evaluation'));
  end if;
end $$;

alter table public.wells
  add column if not exists organization_id uuid references public.organizations(id),
  add column if not exists canonical_api text,
  add column if not exists canonical_uwi text,
  add column if not exists basin text,
  add column if not exists surface_point geometry(Point, 4326),
  add column if not exists metadata_jsonb jsonb not null default '{}'::jsonb;

update public.wells
set surface_point = st_setsrid(st_makepoint(lng, lat), 4326)
where surface_point is null;

update public.wells
set metadata_jsonb = public.with_jsonb_contract(
  case
    when external_key is null then coalesce(metadata_jsonb, '{}'::jsonb)
    else coalesce(metadata_jsonb, '{}'::jsonb) || jsonb_build_object('legacy_external_key', external_key)
  end,
  'well.metadata'
)
where metadata_jsonb = '{}'::jsonb or (external_key is not null and not (metadata_jsonb ? 'legacy_external_key'));

create index if not exists wells_surface_point_gix on public.wells using gist (surface_point);
create index if not exists wells_canonical_api_idx on public.wells(canonical_api);
create index if not exists wells_canonical_uwi_idx on public.wells(canonical_uwi);

create table if not exists public.well_laterals (
  well_id uuid primary key references public.wells(id) on delete cascade,
  lateral_geom geometry(LineString, 4326),
  lateral_length_ft numeric,
  source_priority integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.acreage_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  name text not null,
  asset_kind text not null default 'acreage',
  geom geometry(MultiPolygon, 4326),
  metadata_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists acreage_assets_org_idx on public.acreage_assets(organization_id);
create index if not exists acreage_assets_project_idx on public.acreage_assets(project_id);
create index if not exists acreage_assets_geom_gix on public.acreage_assets using gist (geom);

create table if not exists public.well_source_refs (
  id uuid primary key default gen_random_uuid(),
  well_id uuid not null references public.wells(id) on delete cascade,
  source_connection_id uuid,
  external_key text not null,
  source_record_hash text,
  last_seen_at timestamptz,
  is_deleted_in_source boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_connection_id, external_key)
);

create index if not exists well_source_refs_well_id_idx on public.well_source_refs(well_id);

create table if not exists public.well_monthly_production (
  id uuid primary key default gen_random_uuid(),
  well_id uuid not null references public.wells(id) on delete cascade,
  production_month date not null,
  oil_volume numeric not null default 0,
  gas_volume numeric not null default 0,
  water_volume numeric not null default 0,
  days_on integer,
  source_run_id uuid,
  raw_payload_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (well_id, production_month)
);

create index if not exists well_monthly_production_well_month_idx
  on public.well_monthly_production(well_id, production_month desc);

alter table public.project_groups
  add column if not exists config_jsonb jsonb not null default '{}'::jsonb;

update public.project_groups
set config_jsonb = public.with_jsonb_contract(
  jsonb_build_object(
    'typeCurve', coalesce(type_curve, '{}'::jsonb),
    'capex', coalesce(capex, '{}'::jsonb),
    'opex', coalesce(opex, '{}'::jsonb),
    'ownership', coalesce(ownership, '{}'::jsonb)
  ),
  'project_group.config'
)
where config_jsonb = '{}'::jsonb;

create table if not exists public.group_well_memberships (
  project_group_id uuid not null references public.project_groups(id) on delete cascade,
  well_id uuid not null references public.wells(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_group_id, well_id)
);

insert into public.group_well_memberships (project_group_id, well_id)
select pgw.project_group_id, pgw.well_id
from public.project_group_wells pgw
on conflict (project_group_id, well_id) do nothing;

alter table public.project_scenarios
  add column if not exists pricing_jsonb jsonb not null default '{}'::jsonb,
  add column if not exists schedule_jsonb jsonb not null default '{}'::jsonb,
  add column if not exists scalar_jsonb jsonb not null default '{}'::jsonb;

update public.project_scenarios
set pricing_jsonb = public.with_jsonb_contract(coalesce(pricing, '{}'::jsonb), 'project_scenario.pricing')
where pricing_jsonb = '{}'::jsonb;

update public.project_scenarios
set schedule_jsonb = public.with_jsonb_contract(coalesce(schedule, '{}'::jsonb), 'project_scenario.schedule')
where schedule_jsonb = '{}'::jsonb;

update public.project_scenarios
set scalar_jsonb = public.with_jsonb_contract(
  jsonb_build_object(
    'capexScalar', coalesce(capex_scalar, 1),
    'productionScalar', coalesce(production_scalar, 1)
  ),
  'project_scenario.scalar'
)
where scalar_jsonb = '{}'::jsonb;

create table if not exists public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version_no integer not null,
  version_kind text not null check (version_kind in ('checkpoint', 'pre_run', 'published', 'migration')),
  created_by uuid references auth.users(id),
  change_reason text,
  snapshot_jsonb jsonb not null,
  input_hash text,
  created_at timestamptz not null default now(),
  unique (project_id, version_no)
);

create index if not exists project_versions_project_idx on public.project_versions(project_id, created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_current_version_id_fkey'
  ) then
    alter table public.projects
      add constraint projects_current_version_id_fkey
      foreign key (current_version_id) references public.project_versions(id) on delete set null;
  end if;
end $$;

alter table public.economics_runs
  add column if not exists project_version_id uuid references public.project_versions(id) on delete set null,
  add column if not exists run_kind text not null default 'manual',
  add column if not exists engine_version text not null default 'ts-v1';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'economics_runs_run_kind_check'
  ) then
    alter table public.economics_runs
      add constraint economics_runs_run_kind_check
      check (run_kind in ('manual', 'analysis', 'import', 'rerun'));
  end if;
end $$;

create table if not exists public.economics_run_results (
  id uuid primary key default gen_random_uuid(),
  economics_run_id uuid not null references public.economics_runs(id) on delete cascade,
  scenario_id uuid references public.project_scenarios(id) on delete set null,
  group_id uuid references public.project_groups(id) on delete set null,
  result_level text not null check (result_level in ('portfolio', 'group')),
  metrics_jsonb jsonb not null,
  rank integer,
  created_at timestamptz not null default now()
);

create index if not exists economics_run_results_run_idx
  on public.economics_run_results(economics_run_id, scenario_id, group_id);
create unique index if not exists economics_run_results_uniqueness_idx
  on public.economics_run_results(
    economics_run_id,
    result_level,
    coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(scenario_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create table if not exists public.economics_cashflows (
  id uuid primary key default gen_random_uuid(),
  economics_run_id uuid not null references public.economics_runs(id) on delete cascade,
  scenario_id uuid references public.project_scenarios(id) on delete set null,
  group_id uuid references public.project_groups(id) on delete set null,
  month_index integer not null,
  month_date date not null,
  cashflow_jsonb jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists economics_cashflows_run_idx
  on public.economics_cashflows(economics_run_id, scenario_id, group_id, month_index);
create unique index if not exists economics_cashflows_uniqueness_idx
  on public.economics_cashflows(
    economics_run_id,
    coalesce(scenario_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid),
    month_index
  );

create table if not exists public.project_artifacts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  artifact_type text not null,
  source_run_id uuid references public.economics_runs(id) on delete set null,
  storage_path text not null,
  metadata_jsonb jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists project_artifacts_project_idx
  on public.project_artifacts(project_id, created_at desc);

create table if not exists public.project_audit_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  event_type text not null,
  entity_type text not null,
  entity_id text,
  payload_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists project_audit_events_project_idx on public.project_audit_events(project_id);
create index if not exists project_audit_events_created_idx on public.project_audit_events(created_at);

insert into public.project_audit_events (id, project_id, actor_user_id, event_type, entity_type, entity_id, payload_jsonb, created_at)
select pal.id, pal.project_id, pal.user_id, pal.action, pal.entity_type, pal.entity_id, pal.payload, pal.created_at
from public.project_audit_log pal
where not exists (
  select 1
  from public.project_audit_events pae
  where pae.id = pal.id
);

alter table public.project_comments
  add column if not exists author_user_id uuid references auth.users(id),
  add column if not exists parent_comment_id uuid references public.project_comments(id) on delete cascade;

update public.project_comments
set author_user_id = user_id
where author_user_id is null;

alter table public.project_comments
  alter column author_user_id set not null;

alter table public.project_invites
  add column if not exists organization_id uuid references public.organizations(id);

update public.project_invites pi
set organization_id = p.organization_id
from public.projects p
where p.id = pi.project_id
  and pi.organization_id is null;

create table if not exists public.source_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  connection_type text not null check (connection_type in ('supabase', 'postgres', 'sqlserver', 'csv')),
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'error')),
  config_jsonb jsonb not null default '{}'::jsonb,
  field_mappings_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists source_connections_org_idx on public.source_connections(organization_id);

create table if not exists public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  source_connection_id uuid not null references public.source_connections(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  cursor_jsonb jsonb not null default '{}'::jsonb,
  row_counts_jsonb jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists sync_runs_source_idx on public.sync_runs(source_connection_id, created_at desc);

create table if not exists public.sync_errors (
  id uuid primary key default gen_random_uuid(),
  sync_run_id uuid not null references public.sync_runs(id) on delete cascade,
  error_kind text not null,
  record_locator text,
  message text not null,
  payload_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists sync_errors_run_idx on public.sync_errors(sync_run_id);

create table if not exists public.model_presets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null check (scope in ('user', 'organization')),
  preset_type text not null check (preset_type in ('type_curve', 'capex', 'opex', 'ownership', 'pricing', 'composite')),
  name text not null,
  basin text,
  formation text,
  operator text,
  config_jsonb jsonb not null default '{}'::jsonb,
  is_template boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists model_presets_owner_idx on public.model_presets(owner_user_id);
create index if not exists model_presets_org_idx on public.model_presets(organization_id);
create index if not exists model_presets_type_idx on public.model_presets(preset_type);

create table if not exists public.legacy_deal_project_map (
  deal_id uuid primary key references public.deals(id) on delete cascade,
  project_id uuid not null unique references public.projects(id) on delete cascade,
  created_at timestamptz not null default now()
);

insert into public.source_connections (id, organization_id, owner_user_id, name, connection_type, status, config_jsonb, field_mappings_jsonb, created_at, updated_at)
select
  ic.id,
  public.ensure_personal_organization(ic.owner_user_id),
  ic.owner_user_id,
  ic.name,
  ic.connection_type,
  ic.status,
  public.with_jsonb_contract(coalesce(ic.connection_params, '{}'::jsonb), 'source_connection.config'),
  public.with_jsonb_contract(coalesce(ic.field_mappings, '{}'::jsonb), 'source_connection.mappings'),
  ic.created_at,
  ic.updated_at
from public.integration_configs ic
where not exists (
  select 1 from public.source_connections sc where sc.id = ic.id
);

insert into public.sync_runs (id, source_connection_id, status, row_counts_jsonb, started_at, completed_at, created_by, created_at)
select
  ij.id,
  ij.config_id,
  ij.status,
  public.with_jsonb_contract(
    jsonb_build_object(
      'recordsProcessed', ij.records_processed,
      'recordsFailed', ij.records_failed
    ),
    'sync_run.row_counts'
  ),
  ij.started_at,
  ij.completed_at,
  null,
  ij.created_at
from public.integration_jobs ij
where exists (
  select 1 from public.source_connections sc where sc.id = ij.config_id
)
and not exists (
  select 1 from public.sync_runs sr where sr.id = ij.id
);

insert into public.model_presets (id, organization_id, owner_user_id, scope, preset_type, name, basin, formation, operator, config_jsonb, is_template, created_at, updated_at)
select
  p.id,
  public.ensure_personal_organization(p.owner_user_id),
  p.owner_user_id,
  'user',
  p.profile_type,
  p.name,
  p.basin,
  p.formation,
  p.operator,
  public.with_jsonb_contract(coalesce(p.config, '{}'::jsonb), 'model_preset.config'),
  p.is_template,
  p.created_at,
  p.updated_at
from public.deal_type_curve_presets p
where not exists (
  select 1 from public.model_presets mp where mp.id = p.id
);

insert into public.legacy_deal_project_map (deal_id, project_id)
select d.id, gen_random_uuid()
from public.deals d
where not exists (
  select 1 from public.legacy_deal_project_map m where m.deal_id = d.id
);

insert into public.projects (
  id,
  organization_id,
  owner_user_id,
  project_kind,
  status,
  name,
  description,
  ui_state,
  ui_state_jsonb,
  metadata_jsonb,
  created_at,
  updated_at
)
select
  m.project_id,
  public.ensure_personal_organization(d.owner_user_id),
  d.owner_user_id,
  'deal_evaluation',
  coalesce(d.status, 'draft'),
  d.name,
  nullif(trim(concat_ws(' · ', d.category, d.basin)), ''),
  '{}'::jsonb,
  public.with_jsonb_contract('{}'::jsonb, 'project.ui_state'),
  public.with_jsonb_contract(
    jsonb_build_object(
      'legacyDealId', d.id,
      'category', d.category,
      'basin', d.basin,
      'kpis', coalesce(d.kpis, '{}'::jsonb),
      'dealMetadata', coalesce(d.metadata, '{}'::jsonb)
    ),
    'project.metadata'
  ),
  d.created_at,
  d.updated_at
from public.deals d
join public.legacy_deal_project_map m on m.deal_id = d.id
where not exists (
  select 1 from public.projects p where p.id = m.project_id
);

insert into public.project_groups (
  id,
  project_id,
  name,
  color,
  sort_order,
  type_curve,
  capex,
  opex,
  ownership,
  config_jsonb,
  created_at,
  updated_at
)
select
  dwg.id,
  m.project_id,
  dwg.name,
  dwg.color,
  dwg.sort_order,
  coalesce((
    select jsonb_build_object(
      'qi', dpp.qi,
      'b', dpp.b,
      'di', dpp.di,
      'terminalDecline', dpp.terminal_decline,
      'gorMcfPerBbl', dpp.gor_mcf_per_bbl
    )
    from public.deal_production_profiles dpp
    where dpp.group_id = dwg.id
    order by dpp.updated_at desc
    limit 1
  ), '{}'::jsonb),
  coalesce((
    select jsonb_build_object(
      'rigCount', dcp.rig_count,
      'drillDurationDays', dcp.drill_duration_days,
      'stimDurationDays', dcp.stim_duration_days,
      'rigStartDate', dcp.rig_start_date,
      'items', dcp.items
    )
    from public.deal_capex_profiles dcp
    where dcp.group_id = dwg.id
    order by dcp.updated_at desc
    limit 1
  ), '{}'::jsonb),
  coalesce((
    select jsonb_build_object('segments', dop.segments)
    from public.deal_opex_profiles dop
    where dop.group_id = dwg.id
    order by dop.updated_at desc
    limit 1
  ), '{}'::jsonb),
  coalesce((
    select jsonb_build_object(
      'baseNri', dop.base_nri,
      'baseCostInterest', dop.base_cost_interest,
      'agreements', dop.agreements
    )
    from public.deal_ownership_profiles dop
    where dop.group_id = dwg.id
    order by dop.updated_at desc
    limit 1
  ), '{}'::jsonb),
  public.with_jsonb_contract(
    jsonb_build_object(
      'typeCurve', coalesce((
        select jsonb_build_object(
          'qi', dpp.qi,
          'b', dpp.b,
          'di', dpp.di,
          'terminalDecline', dpp.terminal_decline,
          'gorMcfPerBbl', dpp.gor_mcf_per_bbl
        )
        from public.deal_production_profiles dpp
        where dpp.group_id = dwg.id
        order by dpp.updated_at desc
        limit 1
      ), '{}'::jsonb),
      'capex', coalesce((
        select jsonb_build_object(
          'rigCount', dcp.rig_count,
          'drillDurationDays', dcp.drill_duration_days,
          'stimDurationDays', dcp.stim_duration_days,
          'rigStartDate', dcp.rig_start_date,
          'items', dcp.items
        )
        from public.deal_capex_profiles dcp
        where dcp.group_id = dwg.id
        order by dcp.updated_at desc
        limit 1
      ), '{}'::jsonb),
      'opex', coalesce((
        select jsonb_build_object('segments', dopx.segments)
        from public.deal_opex_profiles dopx
        where dopx.group_id = dwg.id
        order by dopx.updated_at desc
        limit 1
      ), '{}'::jsonb),
      'ownership', coalesce((
        select jsonb_build_object(
          'baseNri', doo.base_nri,
          'baseCostInterest', doo.base_cost_interest,
          'agreements', doo.agreements
        )
        from public.deal_ownership_profiles doo
        where doo.group_id = dwg.id
        order by doo.updated_at desc
        limit 1
      ), '{}'::jsonb),
      'legacyDealId', dwg.deal_id
    ),
    'project_group.config'
  ),
  dwg.created_at,
  dwg.updated_at
from public.deal_well_groups dwg
join public.legacy_deal_project_map m on m.deal_id = dwg.deal_id
where not exists (
  select 1 from public.project_groups pg where pg.id = dwg.id
);

insert into public.group_well_memberships (project_group_id, well_id)
select dw.group_id, dw.well_id
from public.deal_wells dw
where dw.group_id is not null
  and dw.well_id is not null
on conflict (project_group_id, well_id) do nothing;

insert into public.project_scenarios (
  id,
  project_id,
  name,
  color,
  is_base_case,
  pricing,
  schedule,
  capex_scalar,
  production_scalar,
  pricing_jsonb,
  schedule_jsonb,
  scalar_jsonb,
  sort_order,
  created_at,
  updated_at
)
select
  ds.id,
  m.project_id,
  ds.name,
  ds.color,
  ds.is_base_case,
  ds.pricing,
  ds.schedule,
  ds.capex_scalar,
  ds.production_scalar,
  public.with_jsonb_contract(coalesce(ds.pricing, '{}'::jsonb), 'project_scenario.pricing'),
  public.with_jsonb_contract(coalesce(ds.schedule, '{}'::jsonb), 'project_scenario.schedule'),
  public.with_jsonb_contract(
    jsonb_build_object(
      'capexScalar', ds.capex_scalar,
      'productionScalar', ds.production_scalar
    ),
    'project_scenario.scalar'
  ),
  ds.sort_order,
  ds.created_at,
  ds.updated_at
from public.deal_scenarios ds
join public.legacy_deal_project_map m on m.deal_id = ds.deal_id
where not exists (
  select 1 from public.project_scenarios ps where ps.id = ds.id
);

update public.projects p
set active_group_id = first_group.id
from (
  select distinct on (pg.project_id) pg.project_id, pg.id
  from public.project_groups pg
  order by pg.project_id, pg.sort_order, pg.created_at
) first_group
where p.id = first_group.project_id
  and p.active_group_id is null;

create or replace function public.build_project_snapshot(p_project_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'project',
    jsonb_build_object(
      'id', p.id,
      'organizationId', p.organization_id,
      'projectKind', p.project_kind,
      'status', p.status,
      'name', p.name,
      'description', p.description,
      'activeGroupId', p.active_group_id,
      'uiState', p.ui_state_jsonb,
      'metadata', p.metadata_jsonb
    ),
    'groups',
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', pg.id,
          'name', pg.name,
          'color', pg.color,
          'sortOrder', pg.sort_order,
          'config', pg.config_jsonb,
          'wellIds', coalesce((
            select jsonb_agg(gwm.well_id order by gwm.well_id)
            from public.group_well_memberships gwm
            where gwm.project_group_id = pg.id
          ), '[]'::jsonb)
        )
        order by pg.sort_order, pg.created_at
      )
      from public.project_groups pg
      where pg.project_id = p.id
    ), '[]'::jsonb),
    'scenarios',
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', ps.id,
          'name', ps.name,
          'color', ps.color,
          'isBaseCase', ps.is_base_case,
          'pricing', ps.pricing_jsonb,
          'schedule', ps.schedule_jsonb,
          'scalar', ps.scalar_jsonb,
          'sortOrder', ps.sort_order
        )
        order by ps.sort_order, ps.created_at
      )
      from public.project_scenarios ps
      where ps.project_id = p.id
    ), '[]'::jsonb)
  )
  from public.projects p
  where p.id = p_project_id;
$$;

create or replace function public.create_project_version(
  p_project_id uuid,
  p_version_kind text,
  p_change_reason text default null,
  p_input_hash text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  next_version_no integer;
  next_version_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if public.current_project_role(p_project_id) not in ('owner', 'editor') then
    raise exception 'Permission denied';
  end if;

  select coalesce(max(version_no), 0) + 1
  into next_version_no
  from public.project_versions
  where project_id = p_project_id;

  insert into public.project_versions (
    project_id,
    version_no,
    version_kind,
    created_by,
    change_reason,
    snapshot_jsonb,
    input_hash
  )
  values (
    p_project_id,
    next_version_no,
    p_version_kind,
    auth.uid(),
    p_change_reason,
    public.build_project_snapshot(p_project_id),
    p_input_hash
  )
  returning id into next_version_id;

  update public.projects
  set current_version_id = next_version_id
  where id = p_project_id;

  return next_version_id;
end;
$$;

insert into public.project_versions (project_id, version_no, version_kind, created_by, change_reason, snapshot_jsonb, input_hash, created_at)
select
  p.id,
  1,
  'migration',
  p.owner_user_id,
  'Initial v2 migration snapshot',
  public.build_project_snapshot(p.id),
  null,
  p.updated_at
from public.projects p
where not exists (
  select 1 from public.project_versions pv where pv.project_id = p.id
);

update public.projects p
set current_version_id = pv.id
from public.project_versions pv
where pv.project_id = p.id
  and pv.version_no = (
    select max(version_no) from public.project_versions pv2 where pv2.project_id = p.id
  )
  and p.current_version_id is null;

create or replace function public.current_project_role(target_project_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  with project_ctx as (
    select p.id, p.owner_user_id, p.organization_id
    from public.projects p
    where p.id = target_project_id
  )
  select case
    when exists (
      select 1
      from project_ctx pc
      where pc.owner_user_id = auth.uid()
    ) then 'owner'
    when exists (
      select 1
      from project_ctx pc
      join public.organization_members om
        on om.organization_id = pc.organization_id
       and om.user_id = auth.uid()
       and om.role = 'org_owner'
    ) then 'owner'
    when exists (
      select 1
      from project_ctx pc
      join public.organization_members om
        on om.organization_id = pc.organization_id
       and om.user_id = auth.uid()
       and om.role = 'org_admin'
    ) then 'editor'
    else (
      select pm.role
      from public.project_members pm
      where pm.project_id = target_project_id
        and pm.user_id = auth.uid()
      limit 1
    )
  end;
$$;

create or replace function public.has_project_access(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_project_role(target_project_id) is not null;
$$;

create or replace function public.save_project_bundle(
  p_project_id uuid,
  p_name text,
  p_description text,
  p_active_group_id uuid,
  p_ui_state jsonb,
  p_groups jsonb,
  p_scenarios jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_project_id uuid;
  target_org_id uuid;
  row jsonb;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  target_org_id := public.ensure_personal_organization(auth.uid());

  if p_project_id is null then
    insert into public.projects (
      organization_id,
      owner_user_id,
      project_kind,
      status,
      name,
      description,
      ui_state,
      ui_state_jsonb,
      metadata_jsonb
    )
    values (
      target_org_id,
      auth.uid(),
      'portfolio_model',
      'active',
      coalesce(nullif(trim(p_name), ''), 'Untitled Project'),
      p_description,
      coalesce(p_ui_state, '{}'::jsonb),
      public.with_jsonb_contract(coalesce(p_ui_state, '{}'::jsonb), 'project.ui_state'),
      public.with_jsonb_contract('{}'::jsonb, 'project.metadata')
    )
    returning id into target_project_id;
  else
    target_project_id := p_project_id;

    if public.current_project_role(target_project_id) not in ('owner', 'editor') then
      raise exception 'Permission denied';
    end if;

    update public.projects
    set name = coalesce(nullif(trim(p_name), ''), name),
        description = p_description,
        active_group_id = null,
        ui_state = coalesce(p_ui_state, ui_state),
        ui_state_jsonb = public.with_jsonb_contract(coalesce(p_ui_state, '{}'::jsonb), 'project.ui_state'),
        updated_at = now()
    where id = target_project_id;
  end if;

  delete from public.group_well_memberships
  where project_group_id in (
    select id from public.project_groups where project_id = target_project_id
  );

  delete from public.project_group_wells
  where project_group_id in (
    select id from public.project_groups where project_id = target_project_id
  );

  delete from public.project_scenarios where project_id = target_project_id;
  delete from public.project_groups where project_id = target_project_id;

  for row in
    select value
    from jsonb_array_elements(coalesce(p_groups, '[]'::jsonb))
  loop
    insert into public.project_groups (
      id,
      project_id,
      name,
      color,
      sort_order,
      type_curve,
      capex,
      opex,
      ownership,
      config_jsonb
    )
    values (
      (row ->> 'id')::uuid,
      target_project_id,
      coalesce(row ->> 'name', 'Group'),
      coalesce(row ->> 'color', '#3b82f6'),
      coalesce((row ->> 'sort_order')::integer, 0),
      coalesce(row -> 'type_curve', '{}'::jsonb),
      coalesce(row -> 'capex', '{}'::jsonb),
      coalesce(row -> 'opex', '{}'::jsonb),
      coalesce(row -> 'ownership', '{}'::jsonb),
      public.with_jsonb_contract(
        jsonb_build_object(
          'typeCurve', coalesce(row -> 'type_curve', '{}'::jsonb),
          'capex', coalesce(row -> 'capex', '{}'::jsonb),
          'opex', coalesce(row -> 'opex', '{}'::jsonb),
          'ownership', coalesce(row -> 'ownership', '{}'::jsonb)
        ),
        'project_group.config'
      )
    );

    insert into public.group_well_memberships (project_group_id, well_id)
    select
      (row ->> 'id')::uuid,
      value::text::uuid
    from jsonb_array_elements_text(coalesce(row -> 'well_ids', '[]'::jsonb))
    on conflict (project_group_id, well_id) do nothing;

    insert into public.project_group_wells (project_group_id, well_id)
    select
      (row ->> 'id')::uuid,
      value::text::uuid
    from jsonb_array_elements_text(coalesce(row -> 'well_ids', '[]'::jsonb))
    on conflict (project_group_id, well_id) do nothing;
  end loop;

  for row in
    select value
    from jsonb_array_elements(coalesce(p_scenarios, '[]'::jsonb))
  loop
    insert into public.project_scenarios (
      id,
      project_id,
      name,
      color,
      is_base_case,
      pricing,
      schedule,
      capex_scalar,
      production_scalar,
      pricing_jsonb,
      schedule_jsonb,
      scalar_jsonb,
      sort_order
    )
    values (
      (row ->> 'id')::uuid,
      target_project_id,
      coalesce(row ->> 'name', 'Scenario'),
      coalesce(row ->> 'color', '#3b82f6'),
      coalesce((row ->> 'is_base_case')::boolean, false),
      coalesce(row -> 'pricing', '{}'::jsonb),
      coalesce(row -> 'schedule', '{}'::jsonb),
      coalesce((row ->> 'capex_scalar')::numeric, 1),
      coalesce((row ->> 'production_scalar')::numeric, 1),
      public.with_jsonb_contract(coalesce(row -> 'pricing', '{}'::jsonb), 'project_scenario.pricing'),
      public.with_jsonb_contract(coalesce(row -> 'schedule', '{}'::jsonb), 'project_scenario.schedule'),
      public.with_jsonb_contract(
        jsonb_build_object(
          'capexScalar', coalesce((row ->> 'capex_scalar')::numeric, 1),
          'productionScalar', coalesce((row ->> 'production_scalar')::numeric, 1)
        ),
        'project_scenario.scalar'
      ),
      coalesce((row ->> 'sort_order')::integer, 0)
    );
  end loop;

  update public.projects
  set active_group_id = p_active_group_id,
      updated_at = now()
  where id = target_project_id;

  if not exists (
    select 1
    from public.project_versions pv
    where pv.project_id = target_project_id
  ) then
    perform public.create_project_version(
      target_project_id,
      'checkpoint',
      'Initial project state',
      null
    );
  end if;

  return target_project_id;
end;
$$;

drop function if exists public.create_economics_run(uuid, text, jsonb, jsonb, jsonb);
drop function if exists public.create_economics_run(uuid, text, jsonb, jsonb, jsonb, text, text);

create or replace function public.create_economics_run(
  p_project_id uuid,
  p_input_hash text,
  p_portfolio_metrics jsonb,
  p_warnings jsonb,
  p_group_metrics jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  run_id uuid;
  version_id uuid;
  row jsonb;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if public.current_project_role(p_project_id) not in ('owner', 'editor') then
    raise exception 'Permission denied';
  end if;

  version_id := public.create_project_version(
    p_project_id,
    'pre_run',
    'Pre-run snapshot',
    p_input_hash
  );

  insert into public.economics_runs (
    project_id,
    project_version_id,
    triggered_by,
    input_hash,
    portfolio_metrics,
    warnings,
    run_kind,
    engine_version
  )
  values (
    p_project_id,
    version_id,
    auth.uid(),
    p_input_hash,
    coalesce(p_portfolio_metrics, '{}'::jsonb),
    coalesce(p_warnings, '[]'::jsonb),
    'manual',
    'ts-v1'
  )
  returning id into run_id;

  insert into public.economics_run_results (
    economics_run_id,
    scenario_id,
    group_id,
    result_level,
    metrics_jsonb,
    rank
  )
  values (
    run_id,
    null,
    null,
    'portfolio',
    coalesce(p_portfolio_metrics, '{}'::jsonb),
    null
  );

  for row in
    select value
    from jsonb_array_elements(coalesce(p_group_metrics, '[]'::jsonb))
  loop
    insert into public.economics_run_group_metrics (
      economics_run_id,
      project_group_id,
      metrics,
      rank
    )
    values (
      run_id,
      (row ->> 'project_group_id')::uuid,
      coalesce(row -> 'metrics', '{}'::jsonb),
      (row ->> 'rank')::integer
    )
    on conflict (economics_run_id, project_group_id) do update
      set metrics = excluded.metrics,
          rank = excluded.rank;

    insert into public.economics_run_results (
      economics_run_id,
      scenario_id,
      group_id,
      result_level,
      metrics_jsonb,
      rank
    )
    values (
      run_id,
      null,
      (row ->> 'project_group_id')::uuid,
      'group',
      coalesce(row -> 'metrics', '{}'::jsonb),
      (row ->> 'rank')::integer
    );
  end loop;

  return run_id;
end;
$$;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.well_laterals enable row level security;
alter table public.acreage_assets enable row level security;
alter table public.well_source_refs enable row level security;
alter table public.well_monthly_production enable row level security;
alter table public.group_well_memberships enable row level security;
alter table public.project_versions enable row level security;
alter table public.economics_run_results enable row level security;
alter table public.economics_cashflows enable row level security;
alter table public.project_artifacts enable row level security;
alter table public.project_audit_events enable row level security;
alter table public.source_connections enable row level security;
alter table public.sync_runs enable row level security;
alter table public.sync_errors enable row level security;
alter table public.model_presets enable row level security;

drop policy if exists organizations_read_access on public.organizations;
create policy organizations_read_access
on public.organizations
for select
using (public.has_organization_access(id));

drop policy if exists organization_members_read_access on public.organization_members;
create policy organization_members_read_access
on public.organization_members
for select
using (public.has_organization_access(organization_id));

drop policy if exists organization_members_owner_manage on public.organization_members;
create policy organization_members_owner_manage
on public.organization_members
for all
using (public.current_organization_role(organization_id) = 'org_owner')
with check (public.current_organization_role(organization_id) = 'org_owner');

drop policy if exists projects_insert_owner on public.projects;
create policy projects_insert_owner
on public.projects
for insert
with check (
  owner_user_id = auth.uid()
);

drop policy if exists wells_read_authenticated on public.wells;
create policy wells_read_authenticated
on public.wells
for select
using (auth.uid() is not null);

drop policy if exists well_laterals_read_authenticated on public.well_laterals;
create policy well_laterals_read_authenticated
on public.well_laterals
for select
using (auth.uid() is not null);

drop policy if exists acreage_assets_read_access on public.acreage_assets;
create policy acreage_assets_read_access
on public.acreage_assets
for select
using (public.has_organization_access(organization_id));

drop policy if exists acreage_assets_write_org on public.acreage_assets;
create policy acreage_assets_write_org
on public.acreage_assets
for all
using (public.current_organization_role(organization_id) in ('org_owner', 'org_admin'))
with check (public.current_organization_role(organization_id) in ('org_owner', 'org_admin'));

drop policy if exists well_source_refs_read_authenticated on public.well_source_refs;
create policy well_source_refs_read_authenticated
on public.well_source_refs
for select
using (auth.uid() is not null);

drop policy if exists well_monthly_production_read_authenticated on public.well_monthly_production;
create policy well_monthly_production_read_authenticated
on public.well_monthly_production
for select
using (auth.uid() is not null);

drop policy if exists group_well_memberships_read_access on public.group_well_memberships;
create policy group_well_memberships_read_access
on public.group_well_memberships
for select
using (
  exists (
    select 1
    from public.project_groups pg
    where pg.id = project_group_id
      and public.has_project_access(pg.project_id)
  )
);

drop policy if exists group_well_memberships_write_editor on public.group_well_memberships;
create policy group_well_memberships_write_editor
on public.group_well_memberships
for all
using (
  exists (
    select 1
    from public.project_groups pg
    where pg.id = project_group_id
      and public.current_project_role(pg.project_id) in ('owner', 'editor')
  )
)
with check (
  exists (
    select 1
    from public.project_groups pg
    where pg.id = project_group_id
      and public.current_project_role(pg.project_id) in ('owner', 'editor')
  )
);

drop policy if exists project_versions_read_access on public.project_versions;
create policy project_versions_read_access
on public.project_versions
for select
using (public.has_project_access(project_id));

drop policy if exists project_versions_write_editor on public.project_versions;
create policy project_versions_write_editor
on public.project_versions
for insert
with check (public.current_project_role(project_id) in ('owner', 'editor'));

drop policy if exists economics_run_results_read_access on public.economics_run_results;
create policy economics_run_results_read_access
on public.economics_run_results
for select
using (
  exists (
    select 1
    from public.economics_runs er
    where er.id = economics_run_id
      and public.has_project_access(er.project_id)
  )
);

drop policy if exists economics_run_results_write_editor on public.economics_run_results;
create policy economics_run_results_write_editor
on public.economics_run_results
for insert
with check (
  exists (
    select 1
    from public.economics_runs er
    where er.id = economics_run_id
      and public.current_project_role(er.project_id) in ('owner', 'editor')
  )
);

drop policy if exists economics_cashflows_read_access on public.economics_cashflows;
create policy economics_cashflows_read_access
on public.economics_cashflows
for select
using (
  exists (
    select 1
    from public.economics_runs er
    where er.id = economics_run_id
      and public.has_project_access(er.project_id)
  )
);

drop policy if exists economics_cashflows_write_editor on public.economics_cashflows;
create policy economics_cashflows_write_editor
on public.economics_cashflows
for insert
with check (
  exists (
    select 1
    from public.economics_runs er
    where er.id = economics_run_id
      and public.current_project_role(er.project_id) in ('owner', 'editor')
  )
);

drop policy if exists project_artifacts_read_access on public.project_artifacts;
create policy project_artifacts_read_access
on public.project_artifacts
for select
using (public.has_project_access(project_id));

drop policy if exists project_artifacts_write_editor on public.project_artifacts;
create policy project_artifacts_write_editor
on public.project_artifacts
for insert
with check (public.current_project_role(project_id) in ('owner', 'editor'));

drop policy if exists project_artifacts_delete_owner on public.project_artifacts;
create policy project_artifacts_delete_owner
on public.project_artifacts
for delete
using (public.current_project_role(project_id) = 'owner');

drop policy if exists project_audit_events_read_access on public.project_audit_events;
create policy project_audit_events_read_access
on public.project_audit_events
for select
using (public.has_project_access(project_id));

drop policy if exists project_audit_events_write_editor on public.project_audit_events;
create policy project_audit_events_write_editor
on public.project_audit_events
for insert
with check (
  public.current_project_role(project_id) in ('owner', 'editor')
  and actor_user_id = auth.uid()
);

drop policy if exists source_connections_read_access on public.source_connections;
create policy source_connections_read_access
on public.source_connections
for select
using (public.has_organization_access(organization_id));

drop policy if exists source_connections_write_org on public.source_connections;
create policy source_connections_write_org
on public.source_connections
for all
using (public.current_organization_role(organization_id) in ('org_owner', 'org_admin'))
with check (public.current_organization_role(organization_id) in ('org_owner', 'org_admin'));

drop policy if exists sync_runs_read_access on public.sync_runs;
create policy sync_runs_read_access
on public.sync_runs
for select
using (
  exists (
    select 1
    from public.source_connections sc
    where sc.id = source_connection_id
      and public.has_organization_access(sc.organization_id)
  )
);

drop policy if exists sync_runs_write_org on public.sync_runs;
create policy sync_runs_write_org
on public.sync_runs
for all
using (
  exists (
    select 1
    from public.source_connections sc
    where sc.id = source_connection_id
      and public.current_organization_role(sc.organization_id) in ('org_owner', 'org_admin')
  )
)
with check (
  exists (
    select 1
    from public.source_connections sc
    where sc.id = source_connection_id
      and public.current_organization_role(sc.organization_id) in ('org_owner', 'org_admin')
  )
);

drop policy if exists sync_errors_read_access on public.sync_errors;
create policy sync_errors_read_access
on public.sync_errors
for select
using (
  exists (
    select 1
    from public.sync_runs sr
    join public.source_connections sc on sc.id = sr.source_connection_id
    where sr.id = sync_run_id
      and public.has_organization_access(sc.organization_id)
  )
);

drop policy if exists sync_errors_write_org on public.sync_errors;
create policy sync_errors_write_org
on public.sync_errors
for all
using (
  exists (
    select 1
    from public.sync_runs sr
    join public.source_connections sc on sc.id = sr.source_connection_id
    where sr.id = sync_run_id
      and public.current_organization_role(sc.organization_id) in ('org_owner', 'org_admin')
  )
)
with check (
  exists (
    select 1
    from public.sync_runs sr
    join public.source_connections sc on sc.id = sr.source_connection_id
    where sr.id = sync_run_id
      and public.current_organization_role(sc.organization_id) in ('org_owner', 'org_admin')
  )
);

drop policy if exists model_presets_read_access on public.model_presets;
create policy model_presets_read_access
on public.model_presets
for select
using (
  owner_user_id = auth.uid()
  or (organization_id is not null and public.has_organization_access(organization_id))
  or is_template = true
);

drop policy if exists model_presets_write_access on public.model_presets;
create policy model_presets_write_access
on public.model_presets
for all
using (
  owner_user_id = auth.uid()
  or (
    scope = 'organization'
    and organization_id is not null
    and public.current_organization_role(organization_id) in ('org_owner', 'org_admin')
  )
)
with check (
  owner_user_id = auth.uid()
  or (
    scope = 'organization'
    and organization_id is not null
    and public.current_organization_role(organization_id) in ('org_owner', 'org_admin')
  )
);
