-- Explicit WITH CHECK so INSERTs are not rejected on some Postgres/RLS combinations
-- when only USING was defined on FOR ALL policies.
drop policy if exists "Users can CRUD their own scenarios" on scenarios;

create policy "Users can CRUD their own scenarios"
  on scenarios for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
