-- Scenarios: users own their own; org members see org scenarios
-- PostgreSQL allows one command per policy: use FOR ALL with USING + WITH CHECK when writes need both.
alter table scenarios enable row level security;

create policy "Users can CRUD their own scenarios"
  on scenarios for all
  using (auth.uid() = user_id);

create policy "Org members can read org scenarios"
  on scenarios for select
  using (
    org_id is not null and
    exists (
      select 1 from org_members
      where org_id = scenarios.org_id
        and user_id = auth.uid()
        and accepted_at is not null
    )
  );

create policy "Org admins/owners can write org scenarios"
  on scenarios for all
  using (
    org_id is not null and
    exists (
      select 1 from org_members
      where org_id = scenarios.org_id
        and user_id = auth.uid()
        and role in ('owner', 'admin')
        and accepted_at is not null
    )
  )
  with check (
    org_id is not null and
    exists (
      select 1 from org_members
      where org_id = scenarios.org_id
        and user_id = auth.uid()
        and role in ('owner', 'admin')
        and accepted_at is not null
    )
  );

-- Organizations
alter table organizations enable row level security;

create policy "Org members can read their org"
  on organizations for select
  using (
    exists (
      select 1 from org_members
      where org_id = organizations.id
        and user_id = auth.uid()
        and accepted_at is not null
    )
  );

create policy "Org owners can update their org"
  on organizations for update
  using (
    exists (
      select 1 from org_members
      where org_id = organizations.id
        and user_id = auth.uid()
        and role = 'owner'
    )
  );

-- Org members
alter table org_members enable row level security;

create policy "Users can see their own memberships"
  on org_members for select
  using (user_id = auth.uid());

create policy "Org admins/owners can manage membership"
  on org_members for all
  using (
    exists (
      select 1 from org_members m2
      where m2.org_id = org_members.org_id
        and m2.user_id = auth.uid()
        and m2.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from org_members m2
      where m2.org_id = org_members.org_id
        and m2.user_id = auth.uid()
        and m2.role in ('owner', 'admin')
    )
  );
