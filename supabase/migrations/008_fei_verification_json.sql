-- Structured FEI verification evidence (replaces legacy fei_verification_status text).
alter table public.scenarios add column if not exists fei_verification jsonb;

update public.scenarios
set fei_verification = jsonb_build_object(
  'version', 1,
  'status', case fei_verification_status
    when 'passed' then 'matched'
    when 'failed' then 'verification_failed'
    else 'not_attempted'
  end,
  'fei', coalesce(fei_number, ''),
  'confidence', 'unknown',
  'source', 'legacy-column',
  'notes', jsonb_build_array('Imported from legacy fei_verification_status'),
  'userInitiatedLookup', false,
  'checkedAt', null
)
where fei_verification is null
  and fei_verification_status is not null
  and fei_verification_status <> 'not_attempted'
  and coalesce(nullif(trim(fei_number), ''), '') <> '';

alter table public.scenarios drop constraint if exists scenarios_fei_verification_status_check;
alter table public.scenarios drop column if exists fei_verification_status;
