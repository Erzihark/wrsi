-- Student home redesign: event display fields, profile/counselor photos, and a
-- profile-edit RPC that does NOT touch the lifecycle status (unlike onboarding).

-- Events gain the display fields the student dashboard's "next event" card needs:
-- a banner image (admin pastes a URL, same pattern as universities.logo_url) and a
-- day-schedule time range, independent of the multi-day start/end dates.
alter table public.events
  add column image_url  text,
  add column start_time time,
  add column end_time   time;

-- `location` was retained but unpopulated since events moved to structured
-- country/state geography; formalize its second life as the venue name.
comment on column public.events.location is
  'Venue name shown to students (e.g. "Universidad Estudio Creativo"). Structured geography lives in country_id/state_province_id.';

-- Profile photos. Objects live in the public `avatars` bucket (see the companion
-- storage migration); these columns hold the resolved public URL.
alter table public.students   add column photo_url text;
alter table public.counselors add column photo_url text;

-- Atomically update the caller's existing student profile + interest rows.
-- Clone of complete_student_onboarding (incl. its strict server-side validation —
-- all profile fields stay required per product decision 2026-07-03, so an edit
-- can't blank out data onboarding required) minus the parts that must only happen
-- at onboarding: it never inserts a status_history row (calling the onboarding RPC
-- from a profile edit would regress the lifecycle back to 'Onboarding') and never
-- touches onboarding_completed_at. SECURITY DEFINER with user_id forced to
-- auth.uid(), so a student can only ever write their own profile.
create or replace function public.update_student_profile(
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
  -- Validation: identical to complete_student_onboarding (kept in sync
  -- by tests/backend; the duplication is deliberate — applied migrations
  -- are immutable, so the shared block can't be factored out).
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
  -- Write: UPDATE only (an edit requires an existing profile), no
  -- lifecycle side effects.
  -- ------------------------------------------------------------------
  update public.students s set
    first_name                 = trim(p_profile->>'first_name'),
    last_name                  = trim(p_profile->>'last_name'),
    birth_date                 = v_birth_date,
    phone_number               = v_phone,
    parent_or_guardian_name    = trim(p_profile->>'parent_or_guardian_name'),
    country_id                 = (p_profile->>'country_id')::uuid,
    highest_education_level_id = (p_profile->>'highest_education_level_id')::uuid,
    average_grade              = v_grade,
    cefr_level                 = p_profile->>'cefr_level',
    budget                     = v_budget,
    budget_currency_id         = (p_profile->>'budget_currency_id')::uuid,
    financial_plan_id          = (p_profile->>'financial_plan_id')::uuid,
    desired_intake_term        = (p_profile->>'desired_intake_term')::public.intake_term,
    desired_intake_year        = v_intake_yr,
    expected_graduation_year   = v_grad_yr
  where s.user_id = v_uid
  returning s.* into v_student;

  if v_student.id is null then
    raise exception 'no student profile for this user' using errcode = 'P0002';
  end if;

  -- Replace child rows (same idempotent pattern as the onboarding RPC).
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

  return v_student;
end;
$$;

grant execute on function public.update_student_profile(jsonb, uuid[], uuid[], uuid[], uuid[])
  to authenticated;
