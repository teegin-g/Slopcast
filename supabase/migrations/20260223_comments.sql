-- Project comments for collaboration annotations
create table if not exists public.project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  entity_type text not null check (entity_type in ('well', 'group', 'scenario')),
  entity_id text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_comments_project_id_idx on public.project_comments(project_id);
create index if not exists project_comments_entity_idx on public.project_comments(entity_type, entity_id);

create trigger project_comments_set_updated_at
before update on public.project_comments
for each row execute function public.set_updated_at();

alter table public.project_comments enable row level security;

-- Project members can read comments
create policy project_comments_read_access
on public.project_comments
for select
using (public.has_project_access(project_id));

-- Editors and owners can create comments
create policy project_comments_write_editor
on public.project_comments
for insert
with check (
  public.current_project_role(project_id) in ('owner', 'editor')
  and user_id = auth.uid()
);

-- Users can delete their own comments
create policy project_comments_delete_own
on public.project_comments
for delete
using (user_id = auth.uid() and public.has_project_access(project_id));
