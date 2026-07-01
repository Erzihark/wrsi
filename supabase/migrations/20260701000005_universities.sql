-- University programs and student "save/like" interest in universities.

create table public.university_programs (
  id                 uuid primary key default gen_random_uuid(),
  university_id      uuid not null references public.universities (id) on delete cascade,
  field_of_study_id  uuid references public.fields_of_study (id) on delete set null,
  education_level_id uuid references public.education_levels (id) on delete set null,
  name               text not null,
  duration           text,
  tuition            numeric(12, 2),
  tuition_currency_id uuid references public.currencies (id) on delete set null,
  requirements       text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index university_programs_university_id_idx on public.university_programs (university_id);
create trigger university_programs_set_updated_at
  before update on public.university_programs
  for each row execute function public.set_updated_at();

-- Save / like a university (rating = ranking). Formal apply lives in student_applications.
-- An admin notification is raised on insert (trigger added in the RLS/logic migration).
create table public.student_university_interest (
  student_id    uuid not null references public.students (id) on delete cascade,
  university_id uuid not null references public.universities (id) on delete cascade,
  rating        int,
  created_at    timestamptz not null default now(),
  primary key (student_id, university_id)
);
