create table stripe_customers (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  customer_id    text unique not null,
  created_at     timestamptz default now()
);

create type subscription_status as enum (
  'active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete'
);

create table subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade,
  org_id              uuid references organizations(id) on delete cascade,
  stripe_sub_id       text unique not null,
  stripe_price_id     text not null,
  status              subscription_status not null,
  current_period_end  timestamptz,
  cancel_at_period_end boolean default false,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table subscriptions enable row level security;

create policy "Users can read their own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);

create trigger subscriptions_updated_at
  before update on subscriptions
  for each row execute function update_updated_at();
