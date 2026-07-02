-- Student onboarding: completion flag, atomic write RPC, and Realtime for status.

alter table public.students
  add column onboarding_completed_at timestamptz;

-- Atomically create/refresh the caller's student profile + interest rows, then set the
-- initial lifecycle status. SECURITY DEFINER, but user_id is forced to auth.uid() so a
-- student can only ever write their own profile.
create or replace function public.complete_student_onboarding(
  p_profile              jsonb,
  p_passport_country_ids uuid[] default '{}'::uuid[],
  p_country_interest_ids uuid[] default '{}'::uuid[],
  p_field_ids            uuid[] default '{}'::uuid[],
  p_intended_level_ids   uuid[] default '{}'::uuid[]
)
returns public.students
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_student public.students;
  v_status  uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  insert into public.students as s (
    user_id, first_name, last_name, birth_date, phone_number, parent_or_guardian_name,
    country_id, highest_education_level_id, average_grade, cefr_level,
    budget, budget_currency_id, financial_plan_id,
    desired_intake_term, desired_intake_year, expected_graduation_year,
    onboarding_completed_at
  )
  values (
    v_uid,
    p_profile->>'first_name',
    p_profile->>'last_name',
    nullif(p_profile->>'birth_date', '')::date,
    p_profile->>'phone_number',
    p_profile->>'parent_or_guardian_name',
    nullif(p_profile->>'country_id', '')::uuid,
    nullif(p_profile->>'highest_education_level_id', '')::uuid,
    nullif(p_profile->>'average_grade', '')::numeric,
    p_profile->>'cefr_level',
    nullif(p_profile->>'budget', '')::numeric,
    nullif(p_profile->>'budget_currency_id', '')::uuid,
    nullif(p_profile->>'financial_plan_id', '')::uuid,
    nullif(p_profile->>'desired_intake_term', '')::public.intake_term,
    nullif(p_profile->>'desired_intake_year', '')::int,
    nullif(p_profile->>'expected_graduation_year', '')::int,
    now()
  )
  on conflict (user_id) do update set
    first_name                 = excluded.first_name,
    last_name                  = excluded.last_name,
    birth_date                 = excluded.birth_date,
    phone_number               = excluded.phone_number,
    parent_or_guardian_name    = excluded.parent_or_guardian_name,
    country_id                 = excluded.country_id,
    highest_education_level_id = excluded.highest_education_level_id,
    average_grade              = excluded.average_grade,
    cefr_level                 = excluded.cefr_level,
    budget                     = excluded.budget,
    budget_currency_id         = excluded.budget_currency_id,
    financial_plan_id          = excluded.financial_plan_id,
    desired_intake_term        = excluded.desired_intake_term,
    desired_intake_year        = excluded.desired_intake_year,
    expected_graduation_year   = excluded.expected_graduation_year,
    onboarding_completed_at    = now()
  returning s.* into v_student;

  -- Replace child rows so re-running onboarding is idempotent.
  delete from public.student_passports where student_id = v_student.id;
  insert into public.student_passports (student_id, country_id)
  select v_student.id, cid from unnest(p_passport_country_ids) as cid
  on conflict do nothing;

  delete from public.student_countries_interest where student_id = v_student.id;
  insert into public.student_countries_interest (student_id, country_id)
  select v_student.id, cid from unnest(p_country_interest_ids) as cid
  on conflict do nothing;

  delete from public.student_fields_of_study_interest where student_id = v_student.id;
  insert into public.student_fields_of_study_interest (student_id, field_of_study_id)
  select v_student.id, fid from unnest(p_field_ids) as fid
  on conflict do nothing;

  delete from public.student_education_level_interest where student_id = v_student.id;
  insert into public.student_education_level_interest (student_id, education_level_id)
  select v_student.id, lid from unnest(p_intended_level_ids) as lid
  on conflict do nothing;

  -- Automatic lifecycle advance on completion → 'Onboarding'.
  select id into v_status from public.statuses
    where entity_type = 'student' and name = 'Onboarding' limit 1;
  if v_status is not null then
    insert into public.status_history (student_id, status_id, changed_by, note)
    values (v_student.id, v_status, v_uid, 'Onboarding completed');
  end if;

  return v_student;
end;
$$;

grant execute on function public.complete_student_onboarding(jsonb, uuid[], uuid[], uuid[], uuid[])
  to authenticated;

-- Let the student dashboard subscribe to its own lifecycle status changes in real time.
alter publication supabase_realtime add table public.status_history;
