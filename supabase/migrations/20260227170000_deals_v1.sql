-- ============================================================
-- Deals data model (Phase 0B + Phase 1)
-- ============================================================

-- deals -------------------------------------------------------
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id),
  name text not null,
  category text,
  status text not null default 'draft' check (status in ('draft', 'active', 'closed', 'archived')),
  basin text,
  metadata jsonb not null default '{}'::jsonb,
  baseline_scenario_id uuid,
  kpis jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- deal_well_groups (created before deal_wells so we can FK group_id) --
create table if not exists public.deal_well_groups (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  name text not null,
  color text not null default '#3b82f6',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- deal_wells --------------------------------------------------
create table if not exists public.deal_wells (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  well_id uuid references public.wells(id),
  slopcast_well_id text not null,
  group_id uuid references public.deal_well_groups(id) on delete set null,
  well_type text not null default 'undeveloped' check (well_type in ('developed', 'undeveloped')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(deal_id, slopcast_well_id)
);

-- deal_production_profiles ------------------------------------
create table if not exists public.deal_production_profiles (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  group_id uuid references public.deal_well_groups(id) on delete cascade,
  well_id uuid references public.deal_wells(id) on delete cascade,
  name text not null default 'Default',
  qi numeric not null,
  b numeric not null,
  di numeric not null,
  terminal_decline numeric not null default 8,
  gor_mcf_per_bbl numeric not null default 0,
  water_cut numeric not null default 0,
  params jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (group_id is not null or well_id is not null)
);

-- deal_capex_profiles -----------------------------------------
create table if not exists public.deal_capex_profiles (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  group_id uuid references public.deal_well_groups(id) on delete cascade,
  well_id uuid references public.deal_wells(id) on delete cascade,
  name text not null default 'Default',
  rig_count numeric not null default 2,
  drill_duration_days numeric not null default 18,
  stim_duration_days numeric not null default 12,
  rig_start_date date,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (group_id is not null or well_id is not null)
);

-- deal_opex_profiles ------------------------------------------
create table if not exists public.deal_opex_profiles (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  group_id uuid references public.deal_well_groups(id) on delete cascade,
  well_id uuid references public.deal_wells(id) on delete cascade,
  name text not null default 'Default',
  segments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (group_id is not null or well_id is not null)
);

-- deal_ownership_profiles -------------------------------------
create table if not exists public.deal_ownership_profiles (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  group_id uuid references public.deal_well_groups(id) on delete cascade,
  well_id uuid references public.deal_wells(id) on delete cascade,
  name text not null default 'Default',
  base_nri numeric not null default 0.75,
  base_cost_interest numeric not null default 1.0,
  agreements jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (group_id is not null or well_id is not null)
);

-- deal_scenarios ----------------------------------------------
create table if not exists public.deal_scenarios (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  name text not null,
  color text not null default '#3b82f6',
  is_base_case boolean not null default false,
  pricing jsonb not null default '{}'::jsonb,
  schedule jsonb not null default '{}'::jsonb,
  capex_scalar numeric not null default 1,
  production_scalar numeric not null default 1,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- deferred FK: deals.baseline_scenario_id -> deal_scenarios
alter table public.deals
  add constraint deals_baseline_scenario_id_fkey
  foreign key (baseline_scenario_id) references public.deal_scenarios(id)
  on delete set null;

-- deal_economics_runs -----------------------------------------
create table if not exists public.deal_economics_runs (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  scenario_id uuid references public.deal_scenarios(id) on delete set null,
  triggered_by uuid not null references auth.users(id),
  input_hash text not null,
  portfolio_metrics jsonb not null default '{}'::jsonb,
  group_metrics jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================

create unique index if not exists deal_scenarios_one_base_case
  on public.deal_scenarios(deal_id)
  where is_base_case;

create index if not exists deals_owner_user_id_idx on public.deals(owner_user_id);
create index if not exists deal_wells_deal_id_idx on public.deal_wells(deal_id);
create index if not exists deal_wells_group_id_idx on public.deal_wells(group_id);
create index if not exists deal_well_groups_deal_id_idx on public.deal_well_groups(deal_id);
create index if not exists deal_production_profiles_deal_id_idx on public.deal_production_profiles(deal_id);
create index if not exists deal_capex_profiles_deal_id_idx on public.deal_capex_profiles(deal_id);
create index if not exists deal_opex_profiles_deal_id_idx on public.deal_opex_profiles(deal_id);
create index if not exists deal_ownership_profiles_deal_id_idx on public.deal_ownership_profiles(deal_id);
create index if not exists deal_scenarios_deal_id_idx on public.deal_scenarios(deal_id);
create index if not exists deal_economics_runs_deal_id_idx on public.deal_economics_runs(deal_id);

-- ============================================================
-- Updated-at triggers
-- ============================================================

create trigger deals_set_updated_at
before update on public.deals
for each row execute function public.set_updated_at();

create trigger deal_well_groups_set_updated_at
before update on public.deal_well_groups
for each row execute function public.set_updated_at();

create trigger deal_production_profiles_set_updated_at
before update on public.deal_production_profiles
for each row execute function public.set_updated_at();

create trigger deal_capex_profiles_set_updated_at
before update on public.deal_capex_profiles
for each row execute function public.set_updated_at();

create trigger deal_opex_profiles_set_updated_at
before update on public.deal_opex_profiles
for each row execute function public.set_updated_at();

create trigger deal_ownership_profiles_set_updated_at
before update on public.deal_ownership_profiles
for each row execute function public.set_updated_at();

create trigger deal_scenarios_set_updated_at
before update on public.deal_scenarios
for each row execute function public.set_updated_at();

-- ============================================================
-- Helper functions
-- ============================================================

create or replace function public.current_deal_role(target_deal_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when d.owner_user_id = auth.uid() then 'owner'
    else null
  end
  from public.deals d
  where d.id = target_deal_id;
$$;

create or replace function public.has_deal_access(target_deal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.deals d
    where d.id = target_deal_id
      and d.owner_user_id = auth.uid()
  );
$$;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.deals enable row level security;
alter table public.deal_wells enable row level security;
alter table public.deal_well_groups enable row level security;
alter table public.deal_production_profiles enable row level security;
alter table public.deal_capex_profiles enable row level security;
alter table public.deal_opex_profiles enable row level security;
alter table public.deal_ownership_profiles enable row level security;
alter table public.deal_scenarios enable row level security;
alter table public.deal_economics_runs enable row level security;

-- deals policies
create policy deals_read_access
on public.deals for select
using (public.has_deal_access(id));

create policy deals_insert_owner
on public.deals for insert
with check (owner_user_id = auth.uid());

create policy deals_update_editor
on public.deals for update
using (public.current_deal_role(id) in ('owner', 'editor'))
with check (public.current_deal_role(id) in ('owner', 'editor'));

create policy deals_delete_owner
on public.deals for delete
using (public.current_deal_role(id) = 'owner');

-- deal_wells policies
create policy deal_wells_read_access
on public.deal_wells for select
using (public.has_deal_access(deal_id));

create policy deal_wells_write_editor
on public.deal_wells for all
using (public.current_deal_role(deal_id) in ('owner', 'editor'))
with check (public.current_deal_role(deal_id) in ('owner', 'editor'));

-- deal_well_groups policies
create policy deal_well_groups_read_access
on public.deal_well_groups for select
using (public.has_deal_access(deal_id));

create policy deal_well_groups_write_editor
on public.deal_well_groups for all
using (public.current_deal_role(deal_id) in ('owner', 'editor'))
with check (public.current_deal_role(deal_id) in ('owner', 'editor'));

-- deal_production_profiles policies
create policy deal_production_profiles_read_access
on public.deal_production_profiles for select
using (public.has_deal_access(deal_id));

create policy deal_production_profiles_write_editor
on public.deal_production_profiles for all
using (public.current_deal_role(deal_id) in ('owner', 'editor'))
with check (public.current_deal_role(deal_id) in ('owner', 'editor'));

-- deal_capex_profiles policies
create policy deal_capex_profiles_read_access
on public.deal_capex_profiles for select
using (public.has_deal_access(deal_id));

create policy deal_capex_profiles_write_editor
on public.deal_capex_profiles for all
using (public.current_deal_role(deal_id) in ('owner', 'editor'))
with check (public.current_deal_role(deal_id) in ('owner', 'editor'));

-- deal_opex_profiles policies
create policy deal_opex_profiles_read_access
on public.deal_opex_profiles for select
using (public.has_deal_access(deal_id));

create policy deal_opex_profiles_write_editor
on public.deal_opex_profiles for all
using (public.current_deal_role(deal_id) in ('owner', 'editor'))
with check (public.current_deal_role(deal_id) in ('owner', 'editor'));

-- deal_ownership_profiles policies
create policy deal_ownership_profiles_read_access
on public.deal_ownership_profiles for select
using (public.has_deal_access(deal_id));

create policy deal_ownership_profiles_write_editor
on public.deal_ownership_profiles for all
using (public.current_deal_role(deal_id) in ('owner', 'editor'))
with check (public.current_deal_role(deal_id) in ('owner', 'editor'));

-- deal_scenarios policies
create policy deal_scenarios_read_access
on public.deal_scenarios for select
using (public.has_deal_access(deal_id));

create policy deal_scenarios_write_editor
on public.deal_scenarios for all
using (public.current_deal_role(deal_id) in ('owner', 'editor'))
with check (public.current_deal_role(deal_id) in ('owner', 'editor'));

-- deal_economics_runs policies
create policy deal_economics_runs_read_access
on public.deal_economics_runs for select
using (public.has_deal_access(deal_id));

create policy deal_economics_runs_insert_editor
on public.deal_economics_runs for insert
with check (
  public.current_deal_role(deal_id) in ('owner', 'editor')
  and triggered_by = auth.uid()
);

-- ============================================================
-- save_deal_bundle RPC
-- ============================================================

create or replace function public.save_deal_bundle(
  p_deal_id uuid,
  p_name text,
  p_category text,
  p_status text,
  p_basin text,
  p_metadata jsonb,
  p_kpis jsonb,
  p_well_groups jsonb,
  p_wells jsonb,
  p_production_profiles jsonb,
  p_capex_profiles jsonb,
  p_opex_profiles jsonb,
  p_ownership_profiles jsonb,
  p_scenarios jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  target_deal_id uuid;
  row jsonb;
  base_scenario_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Upsert deal
  if p_deal_id is null then
    insert into public.deals (owner_user_id, name, category, status, basin, metadata, kpis)
    values (
      auth.uid(),
      coalesce(nullif(trim(p_name), ''), 'Untitled Deal'),
      p_category,
      coalesce(p_status, 'draft'),
      p_basin,
      coalesce(p_metadata, '{}'::jsonb),
      coalesce(p_kpis, '{}'::jsonb)
    )
    returning id into target_deal_id;
  else
    target_deal_id := p_deal_id;

    if public.current_deal_role(target_deal_id) not in ('owner', 'editor') then
      raise exception 'Permission denied';
    end if;

    update public.deals
    set name = coalesce(nullif(trim(p_name), ''), name),
        category = p_category,
        status = coalesce(p_status, status),
        basin = p_basin,
        metadata = coalesce(p_metadata, metadata),
        kpis = coalesce(p_kpis, kpis),
        baseline_scenario_id = null
    where id = target_deal_id;
  end if;

  -- Clear child tables (delete-and-reinsert strategy)
  delete from public.deal_economics_runs where deal_id = target_deal_id;
  delete from public.deal_production_profiles where deal_id = target_deal_id;
  delete from public.deal_capex_profiles where deal_id = target_deal_id;
  delete from public.deal_opex_profiles where deal_id = target_deal_id;
  delete from public.deal_ownership_profiles where deal_id = target_deal_id;
  delete from public.deal_scenarios where deal_id = target_deal_id;
  delete from public.deal_wells where deal_id = target_deal_id;
  delete from public.deal_well_groups where deal_id = target_deal_id;

  -- Insert well groups
  for row in select value from jsonb_array_elements(coalesce(p_well_groups, '[]'::jsonb))
  loop
    insert into public.deal_well_groups (id, deal_id, name, color, sort_order)
    values (
      (row ->> 'id')::uuid,
      target_deal_id,
      coalesce(row ->> 'name', 'Group'),
      coalesce(row ->> 'color', '#3b82f6'),
      coalesce((row ->> 'sort_order')::integer, 0)
    );
  end loop;

  -- Insert wells
  for row in select value from jsonb_array_elements(coalesce(p_wells, '[]'::jsonb))
  loop
    insert into public.deal_wells (id, deal_id, well_id, slopcast_well_id, group_id, well_type, metadata)
    values (
      (row ->> 'id')::uuid,
      target_deal_id,
      (row ->> 'well_id')::uuid,
      row ->> 'slopcast_well_id',
      (row ->> 'group_id')::uuid,
      coalesce(row ->> 'well_type', 'undeveloped'),
      coalesce(row -> 'metadata', '{}'::jsonb)
    );
  end loop;

  -- Insert production profiles
  for row in select value from jsonb_array_elements(coalesce(p_production_profiles, '[]'::jsonb))
  loop
    insert into public.deal_production_profiles (
      id, deal_id, group_id, well_id, name, qi, b, di,
      terminal_decline, gor_mcf_per_bbl, water_cut, params
    )
    values (
      (row ->> 'id')::uuid,
      target_deal_id,
      (row ->> 'group_id')::uuid,
      (row ->> 'well_id')::uuid,
      coalesce(row ->> 'name', 'Default'),
      (row ->> 'qi')::numeric,
      (row ->> 'b')::numeric,
      (row ->> 'di')::numeric,
      coalesce((row ->> 'terminal_decline')::numeric, 8),
      coalesce((row ->> 'gor_mcf_per_bbl')::numeric, 0),
      coalesce((row ->> 'water_cut')::numeric, 0),
      coalesce(row -> 'params', '{}'::jsonb)
    );
  end loop;

  -- Insert capex profiles
  for row in select value from jsonb_array_elements(coalesce(p_capex_profiles, '[]'::jsonb))
  loop
    insert into public.deal_capex_profiles (
      id, deal_id, group_id, well_id, name, rig_count,
      drill_duration_days, stim_duration_days, rig_start_date, items
    )
    values (
      (row ->> 'id')::uuid,
      target_deal_id,
      (row ->> 'group_id')::uuid,
      (row ->> 'well_id')::uuid,
      coalesce(row ->> 'name', 'Default'),
      coalesce((row ->> 'rig_count')::numeric, 2),
      coalesce((row ->> 'drill_duration_days')::numeric, 18),
      coalesce((row ->> 'stim_duration_days')::numeric, 12),
      (row ->> 'rig_start_date')::date,
      coalesce(row -> 'items', '[]'::jsonb)
    );
  end loop;

  -- Insert opex profiles
  for row in select value from jsonb_array_elements(coalesce(p_opex_profiles, '[]'::jsonb))
  loop
    insert into public.deal_opex_profiles (id, deal_id, group_id, well_id, name, segments)
    values (
      (row ->> 'id')::uuid,
      target_deal_id,
      (row ->> 'group_id')::uuid,
      (row ->> 'well_id')::uuid,
      coalesce(row ->> 'name', 'Default'),
      coalesce(row -> 'segments', '[]'::jsonb)
    );
  end loop;

  -- Insert ownership profiles
  for row in select value from jsonb_array_elements(coalesce(p_ownership_profiles, '[]'::jsonb))
  loop
    insert into public.deal_ownership_profiles (
      id, deal_id, group_id, well_id, name,
      base_nri, base_cost_interest, agreements
    )
    values (
      (row ->> 'id')::uuid,
      target_deal_id,
      (row ->> 'group_id')::uuid,
      (row ->> 'well_id')::uuid,
      coalesce(row ->> 'name', 'Default'),
      coalesce((row ->> 'base_nri')::numeric, 0.75),
      coalesce((row ->> 'base_cost_interest')::numeric, 1.0),
      coalesce(row -> 'agreements', '[]'::jsonb)
    );
  end loop;

  -- Insert scenarios
  for row in select value from jsonb_array_elements(coalesce(p_scenarios, '[]'::jsonb))
  loop
    insert into public.deal_scenarios (
      id, deal_id, name, color, is_base_case, pricing, schedule,
      capex_scalar, production_scalar, sort_order
    )
    values (
      (row ->> 'id')::uuid,
      target_deal_id,
      coalesce(row ->> 'name', 'Scenario'),
      coalesce(row ->> 'color', '#3b82f6'),
      coalesce((row ->> 'is_base_case')::boolean, false),
      coalesce(row -> 'pricing', '{}'::jsonb),
      coalesce(row -> 'schedule', '{}'::jsonb),
      coalesce((row ->> 'capex_scalar')::numeric, 1),
      coalesce((row ->> 'production_scalar')::numeric, 1),
      coalesce((row ->> 'sort_order')::integer, 0)
    );

    if (row ->> 'is_base_case')::boolean then
      base_scenario_id := (row ->> 'id')::uuid;
    end if;
  end loop;

  -- Point baseline_scenario_id to the base-case scenario
  if base_scenario_id is not null then
    update public.deals
    set baseline_scenario_id = base_scenario_id
    where id = target_deal_id;
  end if;

  return target_deal_id;
end;
$$;
