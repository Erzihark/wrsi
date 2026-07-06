-- Onboarding is now strictly validated server-side (defense in depth: the app
-- validates with Zod, but the DB is the last line). All onboarding fields are
-- required per product decision 2026-07-03.
--
-- Note: constraints on the *table* stay NULL-tolerant so the future Monday.com
-- import (partial legacy data) still lands; the strict requiredness lives in
-- the RPC, which only gates the student self-onboarding path.

-- Sanity CHECK constraints (NULL passes -> import-safe).
alter table public.students
  add constraint students_average_grade_range
    check (average_grade is null or (average_grade >= 0 and average_grade <= 100)),
  add constraint students_budget_nonnegative
    check (budget is null or budget >= 0),
  add constraint students_intake_year_range
    check (desired_intake_year is null or (desired_intake_year between 2000 and 2100)),
  add constraint students_graduation_year_range
    check (expected_graduation_year is null or (expected_graduation_year between 1990 and 2100)),
  add constraint students_cefr_level_valid
    check (cefr_level is null or cefr_level in ('A1','A2','B1','B2','C1','C2'));

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
  v_uid        uuid := auth.uid();
  v_student    public.students;
  v_status     uuid;
  v_birth_date date;
  v_grade      numeric;
  v_budget     numeric;
  v_intake_yr  int;
  v_grad_yr    int;
  v_phone      text;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  -- ------------------------------------------------------------------
  -- Validation: every onboarding field is required.
  -- ------------------------------------------------------------------
  if coalesce(trim(p_profile->>'first_name'), '') = '' then
    raise exception 'first_name is required' using errcode = '23514';
  end if;
  if coalesce(trim(p_profile->>'last_name'), '') = '' then
    raise exception 'last_name is required' using errcode = '23514';
  end if;
  if coalesce(trim(p_profile->>'parent_or_guardian_name'), '') = '' then
    raise exception 'parent_or_guardian_name is required' using errcode = '23514';
  end if;

  v_phone := regexp_replace(coalesce(p_profile->>'phone_number', ''), '[^0-9+]', '', 'g');
  if v_phone !~ '^\+?[0-9]{8,15}$' then
    raise exception 'phone_number must be 8-15 digits' using errcode = '23514';
  end if;

  v_birth_date := nullif(p_profile->>'birth_date', '')::date;
  if v_birth_date is null then
    raise exception 'birth_date is required' using errcode = '23514';
  end if;
  if v_birth_date > current_date - interval '10 years'
     or v_birth_date < current_date - interval '100 years' then
    raise exception 'birth_date out of accepted range' using errcode = '23514';
  end if;

  if nullif(p_profile->>'country_id', '') is null then
    raise exception 'country_id (nationality) is required' using errcode = '23514';
  end if;
  if nullif(p_profile->>'highest_education_level_id', '') is null then
    raise exception 'highest_education_level_id is required' using errcode = '23514';
  end if;
  if nullif(p_profile->>'financial_plan_id', '') is null then
    raise exception 'financial_plan_id is required' using errcode = '23514';
  end if;
  if nullif(p_profile->>'budget_currency_id', '') is null then
    raise exception 'budget_currency_id is required' using errcode = '23514';
  end if;

  v_grade := nullif(p_profile->>'average_grade', '')::numeric;
  if v_grade is null or v_grade < 0 or v_grade > 100 then
    raise exception 'average_grade must be between 0 and 100' using errcode = '23514';
  end if;

  if coalesce(p_profile->>'cefr_level', '') not in ('A1','A2','B1','B2','C1','C2') then
    raise exception 'cefr_level must be a CEFR level (A1-C2)' using errcode = '23514';
  end if;

  v_budget := nullif(p_profile->>'budget', '')::numeric;
  if v_budget is null or v_budget <= 0 then
    raise exception 'budget is required' using errcode = '23514';
  end if;

  if nullif(p_profile->>'desired_intake_term', '') is null then
    raise exception 'desired_intake_term is required' using errcode = '23514';
  end if;
  v_intake_yr := nullif(p_profile->>'desired_intake_year', '')::int;
  if v_intake_yr is null
     or v_intake_yr < extract(year from current_date)::int
     or v_intake_yr > extract(year from current_date)::int + 6 then
    raise exception 'desired_intake_year must be within the next 6 years' using errcode = '23514';
  end if;
  v_grad_yr := nullif(p_profile->>'expected_graduation_year', '')::int;
  if v_grad_yr is null
     or v_grad_yr < extract(year from current_date)::int - 10
     or v_grad_yr > extract(year from current_date)::int + 10 then
    raise exception 'expected_graduation_year out of accepted range' using errcode = '23514';
  end if;

  if coalesce(array_length(p_passport_country_ids, 1), 0) = 0 then
    raise exception 'at least one passport is required' using errcode = '23514';
  end if;
  if coalesce(array_length(p_country_interest_ids, 1), 0) = 0 then
    raise exception 'at least one country of interest is required' using errcode = '23514';
  end if;
  if coalesce(array_length(p_field_ids, 1), 0) = 0 then
    raise exception 'at least one field of study is required' using errcode = '23514';
  end if;
  if coalesce(array_length(p_intended_level_ids, 1), 0) = 0 then
    raise exception 'at least one intended study level is required' using errcode = '23514';
  end if;

  -- ------------------------------------------------------------------
  -- Write (unchanged semantics: atomic + idempotent, own profile only).
  -- ------------------------------------------------------------------
  insert into public.students as s (
    user_id, first_name, last_name, birth_date, phone_number, parent_or_guardian_name,
    country_id, highest_education_level_id, average_grade, cefr_level,
    budget, budget_currency_id, financial_plan_id,
    desired_intake_term, desired_intake_year, expected_graduation_year,
    onboarding_completed_at
  )
  values (
    v_uid,
    trim(p_profile->>'first_name'),
    trim(p_profile->>'last_name'),
    v_birth_date,
    v_phone,
    trim(p_profile->>'parent_or_guardian_name'),
    (p_profile->>'country_id')::uuid,
    (p_profile->>'highest_education_level_id')::uuid,
    v_grade,
    p_profile->>'cefr_level',
    v_budget,
    (p_profile->>'budget_currency_id')::uuid,
    (p_profile->>'financial_plan_id')::uuid,
    (p_profile->>'desired_intake_term')::public.intake_term,
    v_intake_yr,
    v_grad_yr,
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

  select id into v_status from public.statuses
    where entity_type = 'student' and name = 'Onboarding' limit 1;
  if v_status is not null then
    insert into public.status_history (student_id, status_id, changed_by, note)
    values (v_student.id, v_status, v_uid, 'Onboarding completed');
  end if;

  return v_student;
end;
$$;
