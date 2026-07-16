-- Fields the designed "Mi información" profile screen shows but the schema
-- didn't carry yet: a guardian phone, the info-use consent, personal notes, and
-- reference contacts.
--
-- Deliberately NOT added: English test type/score. The design's "Avanzado (C1) –
-- IELTS 7.0" is already expressible — the CEFR band is `students.cefr_level`,
-- and the exam + score belong in the existing `student_language_exams`
-- (language_exam_id -> the seeded IELTS/TOEFL/PTE/Cambridge catalog, score,
-- exam_date, expiry_date), which already has RLS via the can_access_student
-- child-table loop. It only lacked hooks.

-- The design shows the guardian as name + phone; only the name existed.
alter table public.students add column parent_or_guardian_phone text;

-- "Consentimiento — Permisos y liberación de información": the student's
-- permission to use their information for the application process. Product
-- decision (2026-07-16): a plain boolean. The companion timestamp is kept for
-- record-keeping — a consent you can't date is hard to stand behind later.
alter table public.students
  add column consent_info_use    boolean not null default false,
  add column consent_info_use_at timestamptz;

comment on column public.students.consent_info_use is
  'Student permits WRSI to use their information for the application process.';

-- "Notas personales": free-text context the student writes about themselves.
alter table public.students add column personal_notes text;

-- "Personas extra (Referencias / Recomendaciones)": 0..N contacts per student.
create table public.student_references (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.students (id) on delete cascade,
  full_name    text not null,
  relationship text,
  email        text,
  phone        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index student_references_student_id_idx on public.student_references (student_id);
create trigger student_references_set_updated_at
  before update on public.student_references
  for each row execute function public.set_updated_at();

-- Same access rule as every other student-keyed child table (self + assigned
-- counselor + admin). Spelled out rather than added to the loop in
-- 20260701000009_rls_policies.sql, which is already applied.
alter table public.student_references enable row level security;
create policy student_references_access on public.student_references
  for all to authenticated
  using (public.can_access_student(student_id))
  with check (public.can_access_student(student_id));

-- ---------------------------------------------------------------------------
-- update_student_profile: carry the new fields.
--
-- Replaces the version from 20260716000001. Same contract as before — strict
-- validation mirroring onboarding, UPDATE-only, no status_history row, no touch
-- of onboarding_completed_at — plus the new optional fields. The new fields are
-- optional because onboarding never collected them: requiring them would make
-- every existing student's first profile save fail.
-- ---------------------------------------------------------------------------
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
  v_uid           uuid := auth.uid();
  v_student       public.students;
  v_birth_date    date;
  v_grade         numeric;
  v_budget        numeric;
  v_intake_yr     int;
  v_grad_yr       int;
  v_phone         text;
  v_guardian_phone text;
  v_consent       boolean;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  -- --- Validation: identical to complete_student_onboarding -----------------
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

  -- --- Validation: new optional fields --------------------------------------
  -- Guardian phone is optional, but must look like a phone when supplied.
  v_guardian_phone := regexp_replace(
    coalesce(p_profile->>'parent_or_guardian_phone', ''), '[^0-9+]', '', 'g');
  if v_guardian_phone = '' then
    v_guardian_phone := null;
  elsif v_guardian_phone !~ '^\+?[0-9]{8,15}$' then
    raise exception 'parent_or_guardian_phone must be 8-15 digits' using errcode = '23514';
  end if;

  -- Absent key => leave consent as-is rather than silently revoking it.
  v_consent := (p_profile->>'consent_info_use')::boolean;

  -- --- Write ---------------------------------------------------------------
  update public.students s set
    first_name                 = trim(p_profile->>'first_name'),
    last_name                  = trim(p_profile->>'last_name'),
    birth_date                 = v_birth_date,
    phone_number               = v_phone,
    parent_or_guardian_name    = trim(p_profile->>'parent_or_guardian_name'),
    parent_or_guardian_phone   = v_guardian_phone,
    country_id                 = (p_profile->>'country_id')::uuid,
    highest_education_level_id = (p_profile->>'highest_education_level_id')::uuid,
    average_grade              = v_grade,
    cefr_level                 = p_profile->>'cefr_level',
    budget                     = v_budget,
    budget_currency_id         = (p_profile->>'budget_currency_id')::uuid,
    financial_plan_id          = (p_profile->>'financial_plan_id')::uuid,
    desired_intake_term        = (p_profile->>'desired_intake_term')::public.intake_term,
    desired_intake_year        = v_intake_yr,
    expected_graduation_year   = v_grad_yr,
    personal_notes             = nullif(trim(coalesce(p_profile->>'personal_notes', '')), ''),
    consent_info_use           = coalesce(v_consent, s.consent_info_use),
    -- Stamp the moment consent is first granted; clear it if revoked.
    consent_info_use_at        = case
      when v_consent is null then s.consent_info_use_at
      when v_consent and not s.consent_info_use then now()
      when not v_consent then null
      else s.consent_info_use_at
    end
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
