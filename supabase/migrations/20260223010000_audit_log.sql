-- Project audit log for version history
create table if not exists public.project_audit_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists project_audit_log_project_id_idx on public.project_audit_log(project_id);
create index if not exists project_audit_log_created_at_idx on public.project_audit_log(created_at);

alter table public.project_audit_log enable row level security;

-- Anyone with project access can read audit log
create policy project_audit_log_read_access
on public.project_audit_log
for select
using (public.has_project_access(project_id));

-- Editors and owners can write audit log entries
create policy project_audit_log_write_editor
on public.project_audit_log
for insert
with check (
  public.current_project_role(project_id) in ('owner', 'editor')
  and user_id = auth.uid()
);
