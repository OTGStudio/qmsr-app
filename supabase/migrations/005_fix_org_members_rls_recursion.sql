-- org_members policies that subquery org_members re-enter RLS → infinite recursion.
-- SECURITY DEFINER helpers read org_members as the migration owner (bypasses RLS).

create or replace function public.user_is_org_member(p_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.org_members
    where org_id = p_org_id
      and user_id = auth.uid()
      and accepted_at is not null
  );
$$;

create or replace function public.user_is_org_admin(p_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.org_members
    where org_id = p_org_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
      and accepted_at is not null
  );
$$;

create or replace function public.user_is_org_owner(p_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.org_members
    where org_id = p_org_id
      and user_id = auth.uid()
      and role = 'owner'
      and accepted_at is not null
  );
$$;

grant execute on function public.user_is_org_member(uuid) to authenticated;
grant execute on function public.user_is_org_admin(uuid) to authenticated;
grant execute on function public.user_is_org_owner(uuid) to authenticated;

-- Scenarios: replace org_members subqueries
drop policy if exists "Users can CRUD their own scenarios" on scenarios;
drop policy if exists "Org members can read org scenarios" on scenarios;
drop policy if exists "Org admins/owners can write org scenarios" on scenarios;

create policy "Users can CRUD their own scenarios"
  on scenarios for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Org members can read org scenarios"
  on scenarios for select
  using (
    org_id is not null
    and public.user_is_org_member(org_id)
  );

create policy "Org admins/owners can write org scenarios"
  on scenarios for all
  using (
    org_id is not null
    and public.user_is_org_admin(org_id)
  )
  with check (
    org_id is not null
    and public.user_is_org_admin(org_id)
  );

-- Organizations
drop policy if exists "Org members can read their org" on organizations;
drop policy if exists "Org owners can update their org" on organizations;

create policy "Org members can read their org"
  on organizations for select
  using (public.user_is_org_member(id));

create policy "Org owners can update their org"
  on organizations for update
  using (public.user_is_org_owner(id));

-- Org members: remove recursive policy
drop policy if exists "Users can see their own memberships" on org_members;
drop policy if exists "Org admins/owners can manage membership" on org_members;

create policy "Users can see their own memberships"
  on org_members for select
  using (user_id = auth.uid());

create policy "Org admins/owners can manage membership"
  on org_members for all
  using (public.user_is_org_admin(org_id))
  with check (public.user_is_org_admin(org_id));
