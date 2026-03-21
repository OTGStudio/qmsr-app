-- Organizations (team workspaces)
create table organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Organization membership
create type org_role as enum ('owner', 'admin', 'member');

create table org_members (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid references organizations(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete cascade,
  role            org_role default 'member',
  invited_email   text,
  accepted_at     timestamptz,
  created_at      timestamptz default now(),
  unique(org_id, user_id)
);

-- Scenarios
create table scenarios (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade,
  org_id          uuid references organizations(id) on delete set null,
  name            text not null default 'Untitled scenario',
  notes           text,

  -- Scenario data (stored as jsonb for flexibility during v1)
  product_name    text,
  company_name    text,
  fei_number      text,
  insp_type       text not null default 'baseline',
  marketed_us     boolean default true,
  pathway         text default 'standard',
  manual_class    text default '2',
  class_source    text default 'manual',
  device_class    text,
  product_code    text,
  regulation_num  text,
  risk            text,
  signals         text[] default '{}',
  ai_enabled      boolean default false,
  sw_enabled      boolean default false,
  cyber_enabled   boolean default false,
  pccp_planned    boolean default false,
  ratings         jsonb default '{"mgmt":"unknown","dd":"unknown","prod":"unknown","change":"unknown","out":"unknown","meas":"unknown"}',
  area_notes      jsonb default '{"mgmt":"","dd":"","prod":"","change":"","out":"","meas":""}',

  -- FDA signal cache (refreshed on demand, not stale-checked)
  fda_data        jsonb,
  fda_pulled_at   timestamptz,

  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger scenarios_updated_at
  before update on scenarios
  for each row execute function update_updated_at();

create trigger organizations_updated_at
  before update on organizations
  for each row execute function update_updated_at();
