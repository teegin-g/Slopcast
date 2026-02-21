set check_function_bodies = off;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.wells (
  id uuid primary key default gen_random_uuid(),
  external_key text unique,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  lateral_length numeric not null,
  status text not null check (status in ('PRODUCING', 'DUC', 'PERMIT')),
  operator text not null,
  formation text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id),
  name text not null,
  description text,
  active_group_id uuid,
  ui_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table if not exists public.project_groups (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  color text not null,
  sort_order integer not null default 0,
  type_curve jsonb not null,
  capex jsonb not null,
  opex jsonb not null,
  ownership jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects
  add constraint projects_active_group_id_fkey
  foreign key (active_group_id) references public.project_groups(id)
  on delete set null;

create table if not exists public.project_group_wells (
  project_group_id uuid not null references public.project_groups(id) on delete cascade,
  well_id uuid not null references public.wells(id),
  primary key (project_group_id, well_id)
);

create table if not exists public.project_scenarios (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  color text not null,
  is_base_case boolean not null default false,
  pricing jsonb not null,
  schedule jsonb not null,
  capex_scalar numeric not null default 1,
  production_scalar numeric not null default 1,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.economics_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  triggered_by uuid not null references auth.users(id),
  input_hash text not null,
  portfolio_metrics jsonb not null,
  warnings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.economics_run_group_metrics (
  economics_run_id uuid not null references public.economics_runs(id) on delete cascade,
  project_group_id uuid not null references public.project_groups(id) on delete cascade,
  metrics jsonb not null,
  rank integer,
  primary key (economics_run_id, project_group_id)
);

create unique index if not exists project_scenarios_one_base_case
  on public.project_scenarios(project_id)
  where is_base_case;

create index if not exists projects_owner_user_id_idx on public.projects(owner_user_id);
create index if not exists project_members_user_id_idx on public.project_members(user_id);
create index if not exists project_groups_project_id_idx on public.project_groups(project_id);
create index if not exists project_scenarios_project_id_idx on public.project_scenarios(project_id);
create index if not exists economics_runs_project_id_idx on public.economics_runs(project_id);
create index if not exists economics_run_group_metrics_group_id_idx on public.economics_run_group_metrics(project_group_id);

create trigger wells_set_updated_at
before update on public.wells
for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger project_groups_set_updated_at
before update on public.project_groups
for each row execute function public.set_updated_at();

create trigger project_scenarios_set_updated_at
before update on public.project_scenarios
for each row execute function public.set_updated_at();

create or replace function public.current_project_role(target_project_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p.owner_user_id = auth.uid() then 'owner'
    else pm.role
  end
  from public.projects p
  left join public.project_members pm
    on pm.project_id = p.id and pm.user_id = auth.uid()
  where p.id = target_project_id;
$$;

create or replace function public.has_project_access(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    left join public.project_members pm
      on pm.project_id = p.id and pm.user_id = auth.uid()
    where p.id = target_project_id
      and (p.owner_user_id = auth.uid() or pm.user_id is not null)
  );
$$;

alter table public.wells enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_groups enable row level security;
alter table public.project_group_wells enable row level security;
alter table public.project_scenarios enable row level security;
alter table public.economics_runs enable row level security;
alter table public.economics_run_group_metrics enable row level security;

create policy wells_read_authenticated
on public.wells
for select
using (auth.uid() is not null);

create policy projects_read_access
on public.projects
for select
using (public.has_project_access(id));

create policy projects_insert_owner
on public.projects
for insert
with check (owner_user_id = auth.uid());

create policy projects_update_editor
on public.projects
for update
using (public.current_project_role(id) in ('owner', 'editor'))
with check (public.current_project_role(id) in ('owner', 'editor'));

create policy projects_delete_owner
on public.projects
for delete
using (public.current_project_role(id) = 'owner');

create policy project_members_read_access
on public.project_members
for select
using (public.has_project_access(project_id));

create policy project_members_owner_manage
on public.project_members
for all
using (public.current_project_role(project_id) = 'owner')
with check (public.current_project_role(project_id) = 'owner');

create policy project_groups_read_access
on public.project_groups
for select
using (public.has_project_access(project_id));

create policy project_groups_write_editor
on public.project_groups
for all
using (public.current_project_role(project_id) in ('owner', 'editor'))
with check (public.current_project_role(project_id) in ('owner', 'editor'));

create policy project_group_wells_read_access
on public.project_group_wells
for select
using (
  exists (
    select 1
    from public.project_groups pg
    where pg.id = project_group_id
      and public.has_project_access(pg.project_id)
  )
);

create policy project_group_wells_write_editor
on public.project_group_wells
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

create policy project_scenarios_read_access
on public.project_scenarios
for select
using (public.has_project_access(project_id));

create policy project_scenarios_write_editor
on public.project_scenarios
for all
using (public.current_project_role(project_id) in ('owner', 'editor'))
with check (public.current_project_role(project_id) in ('owner', 'editor'));

create policy economics_runs_read_access
on public.economics_runs
for select
using (public.has_project_access(project_id));

create policy economics_runs_insert_editor
on public.economics_runs
for insert
with check (
  public.current_project_role(project_id) in ('owner', 'editor')
  and triggered_by = auth.uid()
);

create policy economics_run_group_metrics_read_access
on public.economics_run_group_metrics
for select
using (
  exists (
    select 1
    from public.economics_runs er
    where er.id = economics_run_id
      and public.has_project_access(er.project_id)
  )
);

create policy economics_run_group_metrics_insert_editor
on public.economics_run_group_metrics
for insert
with check (
  exists (
    select 1
    from public.economics_runs er
    where er.id = economics_run_id
      and public.current_project_role(er.project_id) in ('owner', 'editor')
  )
);

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
security invoker
set search_path = public
as $$
declare
  target_project_id uuid;
  group_row jsonb;
  scenario_row jsonb;
  well_id_text text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_project_id is null then
    insert into public.projects (owner_user_id, name, description, active_group_id, ui_state)
    values (auth.uid(), coalesce(nullif(trim(p_name), ''), 'Untitled Project'), p_description, null, coalesce(p_ui_state, '{}'::jsonb))
    returning id into target_project_id;

    insert into public.project_members (project_id, user_id, role)
    values (target_project_id, auth.uid(), 'owner')
    on conflict (project_id, user_id) do update set role = excluded.role;
  else
    target_project_id := p_project_id;

    if public.current_project_role(target_project_id) not in ('owner', 'editor') then
      raise exception 'Permission denied';
    end if;

    update public.projects
    set name = coalesce(nullif(trim(p_name), ''), name),
        description = p_description,
        active_group_id = null,
        ui_state = coalesce(p_ui_state, '{}'::jsonb)
    where id = target_project_id;
  end if;

  delete from public.project_scenarios
  where project_id = target_project_id;

  delete from public.project_groups
  where project_id = target_project_id;

  for group_row in
    select value from jsonb_array_elements(coalesce(p_groups, '[]'::jsonb))
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
      ownership
    )
    values (
      (group_row ->> 'id')::uuid,
      target_project_id,
      coalesce(group_row ->> 'name', 'Group'),
      coalesce(group_row ->> 'color', '#3b82f6'),
      coalesce((group_row ->> 'sort_order')::integer, 0),
      coalesce(group_row -> 'type_curve', '{}'::jsonb),
      coalesce(group_row -> 'capex', '{}'::jsonb),
      coalesce(group_row -> 'opex', '{}'::jsonb),
      coalesce(group_row -> 'ownership', '{}'::jsonb)
    );

    for well_id_text in
      select jsonb_array_elements_text(coalesce(group_row -> 'well_ids', '[]'::jsonb))
    loop
      insert into public.project_group_wells (project_group_id, well_id)
      values ((group_row ->> 'id')::uuid, well_id_text::uuid)
      on conflict do nothing;
    end loop;
  end loop;

  for scenario_row in
    select value from jsonb_array_elements(coalesce(p_scenarios, '[]'::jsonb))
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
      sort_order
    )
    values (
      (scenario_row ->> 'id')::uuid,
      target_project_id,
      coalesce(scenario_row ->> 'name', 'Scenario'),
      coalesce(scenario_row ->> 'color', '#9ED3F0'),
      coalesce((scenario_row ->> 'is_base_case')::boolean, false),
      coalesce(scenario_row -> 'pricing', '{}'::jsonb),
      coalesce(scenario_row -> 'schedule', '{}'::jsonb),
      coalesce((scenario_row ->> 'capex_scalar')::numeric, 1),
      coalesce((scenario_row ->> 'production_scalar')::numeric, 1),
      coalesce((scenario_row ->> 'sort_order')::integer, 0)
    );
  end loop;

  update public.projects
  set active_group_id = p_active_group_id
  where id = target_project_id
    and (p_active_group_id is null or exists (
      select 1 from public.project_groups pg
      where pg.id = p_active_group_id
        and pg.project_id = target_project_id
    ));

  return target_project_id;
end;
$$;

create or replace function public.create_economics_run(
  p_project_id uuid,
  p_input_hash text,
  p_portfolio_metrics jsonb,
  p_warnings jsonb,
  p_group_metrics jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  created_run_id uuid;
  metric_row jsonb;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if public.current_project_role(p_project_id) not in ('owner', 'editor') then
    raise exception 'Permission denied';
  end if;

  insert into public.economics_runs (
    project_id,
    triggered_by,
    input_hash,
    portfolio_metrics,
    warnings
  )
  values (
    p_project_id,
    auth.uid(),
    p_input_hash,
    coalesce(p_portfolio_metrics, '{}'::jsonb),
    coalesce(p_warnings, '[]'::jsonb)
  )
  returning id into created_run_id;

  for metric_row in
    select value from jsonb_array_elements(coalesce(p_group_metrics, '[]'::jsonb))
  loop
    insert into public.economics_run_group_metrics (
      economics_run_id,
      project_group_id,
      metrics,
      rank
    )
    values (
      created_run_id,
      (metric_row ->> 'project_group_id')::uuid,
      coalesce(metric_row -> 'metrics', '{}'::jsonb),
      (metric_row ->> 'rank')::integer
    );
  end loop;

  return created_run_id;
end;
$$;
