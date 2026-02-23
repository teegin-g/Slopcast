-- Project invites table for collaboration
create table if not exists public.project_invites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  invited_email text not null,
  role text not null check (role in ('editor', 'viewer')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  invited_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists project_invites_project_id_idx on public.project_invites(project_id);
create index if not exists project_invites_email_idx on public.project_invites(invited_email);

alter table public.project_invites enable row level security;

-- Owner can create invites
create policy project_invites_owner_create
on public.project_invites
for insert
with check (public.current_project_role(project_id) = 'owner' and invited_by = auth.uid());

-- Project members can read invites
create policy project_invites_read_access
on public.project_invites
for select
using (public.has_project_access(project_id));

-- Invited user can update their own invite (accept/decline)
create policy project_invites_recipient_update
on public.project_invites
for update
using (invited_email = (select email from auth.users where id = auth.uid()))
with check (invited_email = (select email from auth.users where id = auth.uid()));
