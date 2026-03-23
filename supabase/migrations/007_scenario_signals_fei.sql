-- Context-only signals and FEI verification state (format check remains client-side).
alter table public.scenarios
  add column if not exists unsupported_signals text[] default '{}';

alter table public.scenarios
  add column if not exists fei_verification_status text not null default 'not_attempted';

alter table public.scenarios
  drop constraint if exists scenarios_fei_verification_status_check;

alter table public.scenarios
  add constraint scenarios_fei_verification_status_check
  check (fei_verification_status in ('not_attempted', 'passed', 'failed'));
