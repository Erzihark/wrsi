-- LOCAL DEVELOPMENT dummy data (lorem-ipsum flavored, per convention).
-- Applied automatically on `supabase db reset` (wired in config.toml). Reference
-- catalogs (countries, roles, statuses, ...) live in seed.sql and are shared by
-- every environment — this file only creates fake people/orgs/activity.
--
-- Test accounts (all password: password123):
--   admin@wrsi.dev      super_admin + admin
--   counselor@wrsi.dev  counselor (assigned to the first two students)
--   student1@wrsi.dev   onboarded, furthest along (Documentation Pending)
--   student2@wrsi.dev   onboarded (Onboarding)
--   student3@wrsi.dev   onboarded, no counselor assigned
--   student4@wrsi.dev   fresh signup (lands on the onboarding wizard)
--   highschool1@wrsi.dev / highschool2@wrsi.dev   high_school portal logins
--   university1@wrsi.dev / university2@wrsi.dev   university portal logins

-- Creates a confirmed email/password auth user the app can sign in as.
create or replace function pg_temp.seed_user(p_id uuid, p_email text, p_password text)
returns void language plpgsql as $$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new
  ) values (
    '00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated',
    p_email, extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
  ) on conflict (id) do nothing;

  insert into auth.identities (
    id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), p_id::text, p_id,
    jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true),
    'email', now(), now(), now()
  ) on conflict do nothing;
end $$;

-- Grants a role by name, replacing the default 'student' when p_replace.
create or replace function pg_temp.seed_role(p_user uuid, p_role text, p_replace boolean)
returns void language plpgsql as $$
begin
  if p_replace then
    delete from public.user_roles where user_id = p_user;
  end if;
  insert into public.user_roles (user_id, role_id)
  select p_user, id from public.roles where name = p_role
  on conflict do nothing;
end $$;

do $seed$
declare
  u_admin     uuid := 'aaaa0000-0000-4000-8000-000000000001';
  u_counselor uuid := 'aaaa0000-0000-4000-8000-000000000002';
  u_s1 uuid := 'aaaa0000-0000-4000-8000-000000000011';
  u_s2 uuid := 'aaaa0000-0000-4000-8000-000000000012';
  u_s3 uuid := 'aaaa0000-0000-4000-8000-000000000013';
  u_s4 uuid := 'aaaa0000-0000-4000-8000-000000000014';
  u_hs1 uuid := 'aaaa0000-0000-4000-8000-000000000021';
  u_hs2 uuid := 'aaaa0000-0000-4000-8000-000000000022';
  u_un1 uuid := 'aaaa0000-0000-4000-8000-000000000031';
  u_un2 uuid := 'aaaa0000-0000-4000-8000-000000000032';
  c1   uuid := 'bbbb0000-0000-4000-8000-000000000001';
  hs1  uuid := 'cccc0000-0000-4000-8000-000000000001';
  hs2  uuid := 'cccc0000-0000-4000-8000-000000000002';
  un1  uuid := 'dddd0000-0000-4000-8000-000000000001';
  un2  uuid := 'dddd0000-0000-4000-8000-000000000002';
  s1   uuid := 'eeee0000-0000-4000-8000-000000000001';
  s2   uuid := 'eeee0000-0000-4000-8000-000000000002';
  s3   uuid := 'eeee0000-0000-4000-8000-000000000003';
  ev1  uuid := 'ffff0000-0000-4000-8000-000000000001';
  w1   uuid := 'ffff0000-0000-4000-8000-000000000011';
  w2   uuid := 'ffff0000-0000-4000-8000-000000000012';
  mx uuid; es uuid; ca uuid; usd uuid;
  st_onb uuid; st_doc uuid; hs_active uuid;
begin
  select id into mx from public.countries where iso_code = 'MX';
  select id into es from public.countries where iso_code = 'ES';
  select id into ca from public.countries where iso_code = 'CA';
  select id into usd from public.currencies where code = 'USD';
  select id into st_onb from public.statuses where entity_type = 'student' and name = 'Onboarding';
  select id into st_doc from public.statuses where entity_type = 'student' and name = 'Documentation Pending';
  select id into hs_active from public.statuses where entity_type = 'high_school' and name = 'Active';

  -- Accounts -----------------------------------------------------------------
  perform pg_temp.seed_user(u_admin, 'admin@wrsi.dev', 'password123');
  perform pg_temp.seed_role(u_admin, 'super_admin', true);
  perform pg_temp.seed_role(u_admin, 'admin', false);

  perform pg_temp.seed_user(u_counselor, 'counselor@wrsi.dev', 'password123');
  perform pg_temp.seed_role(u_counselor, 'counselor', true);
  insert into public.counselors (id, user_id, first_name, last_name, phone)
  values (c1, u_counselor, 'Lorem', 'Consectetur', '+525511111111')
  on conflict (id) do nothing;

  perform pg_temp.seed_user(u_s1, 'student1@wrsi.dev', 'password123');
  perform pg_temp.seed_user(u_s2, 'student2@wrsi.dev', 'password123');
  perform pg_temp.seed_user(u_s3, 'student3@wrsi.dev', 'password123');
  perform pg_temp.seed_user(u_s4, 'student4@wrsi.dev', 'password123');

  -- High schools + universities are login-capable accounts (user_id NOT NULL),
  -- so each seeded org gets its own auth user + portal role.
  perform pg_temp.seed_user(u_hs1, 'highschool1@wrsi.dev', 'password123');
  perform pg_temp.seed_role(u_hs1, 'high_school', true);
  perform pg_temp.seed_user(u_hs2, 'highschool2@wrsi.dev', 'password123');
  perform pg_temp.seed_role(u_hs2, 'high_school', true);
  perform pg_temp.seed_user(u_un1, 'university1@wrsi.dev', 'password123');
  perform pg_temp.seed_role(u_un1, 'university', true);
  perform pg_temp.seed_user(u_un2, 'university2@wrsi.dev', 'password123');
  perform pg_temp.seed_role(u_un2, 'university', true);

  -- Directory ----------------------------------------------------------------
  insert into public.high_schools (id, user_id, name, status_id, contact_first_name, contact_last_name, phone_number, monthly_cost, monthly_cost_currency_id)
  values
    (hs1, u_hs1, 'Lorem Ipsum Academy', hs_active, 'Dolor', 'Amet', '+529981234567', 8500, usd),
    (hs2, u_hs2, 'Dolor Sit High School', hs_active, 'Elit', 'Adipiscing', '+529987654321', 6200, usd)
  on conflict (id) do nothing;

  insert into public.universities (id, user_id, name, description, website, currency_id)
  values
    (un1, u_un1, 'Universidad Lorem', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor.', 'https://lorem.example.edu', usd),
    (un2, u_un2, 'Amet Elit University', 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.', 'https://amet.example.edu', usd)
  on conflict (id) do nothing;

  insert into public.university_programs (university_id, field_of_study_id, education_level_id, name, duration, tuition, tuition_currency_id)
  select un1, f.id, l.id, 'Lorem ' || f.name, '4 years', 14000, usd
  from public.fields_of_study f, public.education_levels l
  where f.name in ('Business', 'Computer Science') and l.name = 'Bachelor''s Degree'
  on conflict do nothing;
  insert into public.university_programs (university_id, field_of_study_id, education_level_id, name, duration, tuition, tuition_currency_id)
  select un2, f.id, l.id, 'Ipsum ' || f.name, '2 years', 21000, usd
  from public.fields_of_study f, public.education_levels l
  where f.name = 'Medicine' and l.name = 'Master''s Degree'
  on conflict do nothing;

  -- Students -----------------------------------------------------------------
  insert into public.students (
    id, user_id, counselor_id, high_school_id, country_id, first_name, last_name,
    birth_date, phone_number, parent_or_guardian_name, average_grade, cefr_level,
    budget, budget_currency_id, financial_plan_id, highest_education_level_id,
    desired_intake_term, desired_intake_year, expected_graduation_year, onboarding_completed_at
  ) values
    (s1, u_s1, c1, hs1, mx, 'Lorem', 'Ipsumson', '2008-03-14', '+529981000001', 'Dolor Ipsumson',
     91.5, 'B2', 15000, usd,
     (select id from public.financial_plans where name = 'Family Plan'),
     (select id from public.education_levels where name like 'High School%'),
     'fall', extract(year from now())::int + 1, extract(year from now())::int, now() - interval '20 days'),
    (s2, u_s2, c1, hs1, mx, 'Sit', 'Ametson', '2008-11-02', '+529981000002', 'Elit Ametson',
     84.0, 'B1', 12500, usd,
     (select id from public.financial_plans where name = 'Scholarship'),
     (select id from public.education_levels where name like 'High School%'),
     'winter', extract(year from now())::int + 2, extract(year from now())::int + 1, now() - interval '5 days'),
    (s3, u_s3, null, hs2, mx, 'Consectetur', 'Elitson', '2007-07-21', '+529981000003', 'Tempor Elitson',
     76.0, 'C1', 22500, usd,
     (select id from public.financial_plans where name = 'Self-funded'),
     (select id from public.education_levels where name like 'High School%'),
     'fall', extract(year from now())::int + 1, extract(year from now())::int, now() - interval '2 days')
  on conflict (id) do nothing;
  -- u_s4 intentionally has no students row -> exercises the onboarding wizard.

  insert into public.student_passports (student_id, country_id)
  values (s1, mx), (s2, mx), (s3, mx) on conflict do nothing;
  insert into public.student_countries_interest (student_id, country_id)
  values (s1, es), (s1, ca), (s2, es), (s3, ca) on conflict do nothing;
  insert into public.student_fields_of_study_interest (student_id, field_of_study_id)
  select s1, id from public.fields_of_study where name in ('Business', 'Computer Science')
  on conflict do nothing;
  insert into public.student_fields_of_study_interest (student_id, field_of_study_id)
  select s2, id from public.fields_of_study where name = 'Medicine' on conflict do nothing;
  insert into public.student_education_level_interest (student_id, education_level_id)
  select s.sid, l.id from (values (s1), (s2), (s3)) as s(sid),
    public.education_levels l where l.name = 'Bachelor''s Degree'
  on conflict do nothing;

  insert into public.status_history (student_id, status_id, changed_by, note, changed_at) values
    (s1, st_onb, u_s1, 'Onboarding completed', now() - interval '20 days'),
    (s1, st_doc, u_counselor, 'Lorem ipsum documents requested', now() - interval '10 days'),
    (s2, st_onb, u_s2, 'Onboarding completed', now() - interval '5 days'),
    (s3, st_onb, u_s3, 'Onboarding completed', now() - interval '2 days');

  -- Activity -----------------------------------------------------------------
  insert into public.tasks (student_id, assigned_to, title, description, due_date, status) values
    (s1, u_s1, 'Upload lorem transcript', 'Lorem ipsum dolor sit amet.', current_date + 7, 'open'),
    (s1, u_counselor, 'Review ipsum essay', 'Consectetur adipiscing elit.', current_date + 3, 'in_progress');

  insert into public.events (id, title, description, location, event_type, start_date, end_date, registration_deadline)
  values (ev1, 'Feria Lorem ' || (extract(year from now())::int + 1), 'Lorem ipsum education fair.',
          'Centro Ipsum, Cancún', 'fair', current_date + 60, current_date + 64, now() + interval '45 days')
  on conflict (id) do nothing;
  insert into public.event_universities (university_id, event_id) values (un1, ev1), (un2, ev1) on conflict do nothing;
  insert into public.workshops (id, event_id, university_id, title, start_time, end_time) values
    (w1, ev1, un1, 'Lorem Admissions 101', (current_date + 60)::timestamptz + interval '10 hours', (current_date + 60)::timestamptz + interval '11 hours'),
    (w2, ev1, un2, 'Ipsum Scholarships', (current_date + 60)::timestamptz + interval '12 hours', (current_date + 60)::timestamptz + interval '13 hours')
  on conflict (id) do nothing;
  insert into public.event_registrations (student_id, event_id) values (s1, ev1) on conflict do nothing;
  insert into public.workshop_registrations (student_id, workshop_id) values (s1, w1) on conflict do nothing;
  insert into public.event_notes (student_id, event_id, university_id, note, ranking)
  values (s1, ev1, un1, 'Lorem ipsum: liked the campus tour talk.', 1);

  -- Fires the admin-notification trigger -> admin gets a notification too.
  insert into public.student_university_interest (student_id, university_id, rating)
  values (s1, un1, 5) on conflict do nothing;

  insert into public.comments (author_user_id, entity_type, entity_id, body)
  values (u_counselor, 'student', s1, 'Lorem ipsum: strong candidate, waiting on transcript.');
end $seed$;
