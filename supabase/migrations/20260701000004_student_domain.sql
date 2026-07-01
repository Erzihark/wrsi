-- Student domain: nationality, onboarding interests, exams, applications, status history.

-- Student lifecycle status changes (Registered -> Onboarding -> ... -> Enrolled).
create table public.status_history (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  status_id  uuid not null references public.statuses (id) on delete restrict,
  changed_by uuid references public.users (id) on delete set null,
  note       text,
  changed_at timestamptz not null default now()
);
create index status_history_student_id_idx on public.status_history (student_id);

-- Multi-nationality: authoritative passport list (drives eligibility).
create table public.student_passports (
  student_id uuid not null references public.students (id) on delete cascade,
  country_id uuid not null references public.countries (id) on delete restrict,
  primary key (student_id, country_id)
);

create table public.student_fields_of_study_interest (
  student_id       uuid not null references public.students (id) on delete cascade,
  field_of_study_id uuid not null references public.fields_of_study (id) on delete cascade,
  rating           int,
  created_at       timestamptz not null default now(),
  primary key (student_id, field_of_study_id)
);

create table public.student_countries_interest (
  student_id uuid not null references public.students (id) on delete cascade,
  country_id uuid not null references public.countries (id) on delete cascade,
  rating     int,
  created_at timestamptz not null default now(),
  primary key (student_id, country_id)
);

-- Intended level of study (distinct from the achieved level on students).
create table public.student_education_level_interest (
  student_id         uuid not null references public.students (id) on delete cascade,
  education_level_id uuid not null references public.education_levels (id) on delete cascade,
  created_at         timestamptz not null default now(),
  primary key (student_id, education_level_id)
);

create table public.student_language_exams (
  student_id      uuid not null references public.students (id) on delete cascade,
  language_exam_id uuid not null references public.language_exams (id) on delete restrict,
  score           numeric(4, 1),   -- IELTS/PTE use decimals
  exam_date       date,
  expiry_date     date,
  primary key (student_id, language_exam_id)
);

-- Formal applications (distinct from save/like interest).
create table public.student_applications (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.students (id) on delete cascade,
  university_id uuid not null references public.universities (id) on delete restrict,
  status_id   uuid references public.statuses (id) on delete set null,
  intake_year int,
  intake_term public.intake_term,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index student_applications_student_id_idx on public.student_applications (student_id);
create index student_applications_university_id_idx on public.student_applications (university_id);
create trigger student_applications_set_updated_at
  before update on public.student_applications
  for each row execute function public.set_updated_at();

create table public.application_status_history (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.student_applications (id) on delete cascade,
  status_id      uuid not null references public.statuses (id) on delete restrict,
  changed_by     uuid references public.users (id) on delete set null,
  changed_at     timestamptz not null default now()
);
create index application_status_history_application_id_idx
  on public.application_status_history (application_id);
