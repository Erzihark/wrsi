-- Identity: public.users mirrors auth.users 1:1; role-profile tables link to it.

create table public.users (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      extensions.citext,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- Many-to-many roles per user (a user can be, e.g., both admin and counselor).
create table public.user_roles (
  user_id uuid not null references public.users (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete cascade,
  primary key (user_id, role_id)
);

create table public.counselors (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references public.users (id) on delete cascade,
  first_name text not null,
  last_name  text not null,
  phone      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger counselors_set_updated_at
  before update on public.counselors
  for each row execute function public.set_updated_at();

create table public.high_schools (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid unique references public.users (id) on delete set null, -- portal login (Phase 2)
  state_province_id  uuid references public.states_provinces (id) on delete set null,
  status_id          uuid references public.statuses (id) on delete set null,
  education_model_id uuid references public.education_models (id) on delete set null,
  name               text not null,
  contact_first_name text,
  contact_last_name  text,
  monthly_cost       numeric(12, 2),
  monthly_cost_currency_id uuid references public.currencies (id) on delete set null,
  phone_number       text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger high_schools_set_updated_at
  before update on public.high_schools
  for each row execute function public.set_updated_at();

create table public.universities (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid unique references public.users (id) on delete set null, -- portal login (Phase 2)
  state_province_id uuid references public.states_provinces (id) on delete set null,
  currency_id       uuid references public.currencies (id) on delete set null,
  status_id         uuid references public.statuses (id) on delete set null,
  name              text not null,
  description       text,
  requirements      text,
  logo_url          text,
  website           text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger universities_set_updated_at
  before update on public.universities
  for each row execute function public.set_updated_at();

create table public.students (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null unique references public.users (id) on delete cascade,
  counselor_id              uuid references public.counselors (id) on delete set null,
  high_school_id            uuid references public.high_schools (id) on delete set null,
  country_id                uuid references public.countries (id) on delete set null, -- primary nationality
  financial_plan_id         uuid references public.financial_plans (id) on delete set null,
  highest_education_level_id uuid references public.education_levels (id) on delete set null, -- achieved
  budget_currency_id        uuid references public.currencies (id) on delete set null,
  first_name                text not null,
  last_name                 text not null,
  birth_date                date,
  budget                    numeric(12, 2),
  average_grade             numeric(5, 2),
  cefr_level                text,            -- CEFR English reference (A1..C2)
  desired_intake_term       public.intake_term,
  desired_intake_year       int,
  expected_graduation_year  int,
  parent_or_guardian_name   text,
  phone_number              text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);
create index students_counselor_id_idx on public.students (counselor_id);
create index students_high_school_id_idx on public.students (high_school_id);
create trigger students_set_updated_at
  before update on public.students
  for each row execute function public.set_updated_at();

-- Sponsors / special partners. Credential columns are internal admin-only reference notes
-- (NOT the login mechanism -- Supabase auth handles authentication); locked down via RLS.
create table public.sponsors_and_allies (
  id             uuid primary key default gen_random_uuid(),
  industry_id    uuid references public.industries (id) on delete set null,
  status_id      uuid references public.statuses (id) on delete set null,
  name           text not null,
  email          extensions.citext,
  login_username text,
  login_password text,
  links          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger sponsors_and_allies_set_updated_at
  before update on public.sponsors_and_allies
  for each row execute function public.set_updated_at();

create table public.special_partners (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  contact_first_name text,
  contact_last_name  text,
  webpage            text,
  login_username     text,
  phone              text,
  wrsi_id            text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger special_partners_set_updated_at
  before update on public.special_partners
  for each row execute function public.set_updated_at();

-- Accreditations held by a high school (many-to-many).
create table public.high_school_accreditations (
  high_school_id  uuid not null references public.high_schools (id) on delete cascade,
  accreditation_id uuid not null references public.accreditations (id) on delete cascade,
  primary key (high_school_id, accreditation_id)
);
