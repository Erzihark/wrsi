-- Reference / lookup tables. Editable catalogs (seeded in seed.sql).

create table public.roles (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table public.countries (
  id       uuid primary key default gen_random_uuid(),
  name     text not null,
  iso_code char(2) not null unique   -- ISO 3166-1 alpha-2
);

create table public.states_provinces (
  id         uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries (id) on delete cascade,
  name       text not null,
  unique (country_id, name)
);

create table public.currencies (
  id     uuid primary key default gen_random_uuid(),
  name   text not null,
  code   char(3) not null unique,     -- ISO 4217
  symbol text
);

create table public.languages (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table public.language_exams (
  id          uuid primary key default gen_random_uuid(),
  language_id uuid not null references public.languages (id) on delete cascade,
  name        text not null,          -- IELTS, TOEFL, PTE, Cambridge...
  unique (language_id, name)
);

create table public.fields_of_study (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);

-- Achieved and intended education levels (grade 12, bachelors, masters, PhD...).
create table public.education_levels (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);

-- Renamed from high_school_study_programs: describes a school's education style/model
-- (bilingual, IB, technical...), NOT a catalog of academic programs. 1:1 per high school.
create table public.education_models (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table public.accreditations (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table public.financial_plans (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table public.industries (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table public.document_types (
  id       uuid primary key default gen_random_uuid(),
  name     text not null unique,
  required boolean not null default false
);

-- Polymorphic status catalog keyed by entity_type (student, application, high_school...).
create table public.statuses (
  id          uuid primary key default gen_random_uuid(),
  entity_type text not null,
  name        text not null,
  color       text,
  sort_order  int not null default 0,
  is_terminal boolean not null default false,
  unique (entity_type, name)
);
create index statuses_entity_type_idx on public.statuses (entity_type);
