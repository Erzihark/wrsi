-- Seed reference/lookup data. Idempotent (safe to re-run on `supabase db reset`).

insert into public.roles (name) values
  ('super_admin'), ('admin'), ('counselor'), ('student'), ('university'), ('high_school')
on conflict (name) do nothing;

insert into public.currencies (name, code, symbol) values
  ('Mexican Peso', 'MXN', '$'),
  ('US Dollar', 'USD', '$'),
  ('Canadian Dollar', 'CAD', '$'),
  ('Euro', 'EUR', '€'),
  ('British Pound', 'GBP', '£')
on conflict (code) do nothing;

insert into public.countries (name, iso_code) values
  ('Mexico', 'MX'), ('United States', 'US'), ('Canada', 'CA'),
  ('United Kingdom', 'GB'), ('Spain', 'ES'), ('Germany', 'DE'), ('Australia', 'AU')
on conflict (iso_code) do nothing;

insert into public.languages (name) values ('English'), ('Spanish')
on conflict (name) do nothing;

insert into public.language_exams (language_id, name)
select l.id, e.name
from public.languages l
join (values
  ('English', 'IELTS'), ('English', 'TOEFL'), ('English', 'PTE'), ('English', 'Cambridge'),
  ('Spanish', 'DELE')
) as e(lang, name) on e.lang = l.name
on conflict (language_id, name) do nothing;

insert into public.fields_of_study (name) values
  ('Business'), ('Engineering'), ('Computer Science'), ('Medicine'), ('Law'),
  ('Arts & Humanities'), ('Natural Sciences'), ('Social Sciences')
on conflict (name) do nothing;

insert into public.education_levels (name) values
  ('High School (Grade 12)'), ('Diploma / Certificate'), ('Bachelor''s Degree'),
  ('Master''s Degree'), ('Doctoral Degree (PhD)')
on conflict (name) do nothing;

insert into public.education_models (name) values
  ('Bilingual'), ('International Baccalaureate'), ('Technical'), ('General'), ('Montessori')
on conflict (name) do nothing;

insert into public.financial_plans (name) values
  ('Self-funded'), ('Scholarship'), ('Family Plan'), ('Loan')
on conflict (name) do nothing;

insert into public.industries (name) values
  ('Technology'), ('Education'), ('Finance'), ('Healthcare'), ('Manufacturing')
on conflict (name) do nothing;

insert into public.document_types (name, required) values
  ('Transcript', true), ('Passport', true), ('Recommendation Letter', false),
  ('Test Scores', false), ('Motivation Letter', false)
on conflict (name) do nothing;

-- Student lifecycle statuses.
insert into public.statuses (entity_type, name, color, sort_order, is_terminal) values
  ('student', 'Registered', '#94a3b8', 10, false),
  ('student', 'Onboarding', '#38bdf8', 20, false),
  ('student', 'Documentation Pending', '#f59e0b', 30, false),
  ('student', 'University Selection', '#a78bfa', 40, false),
  ('student', 'Application Submitted', '#6366f1', 50, false),
  ('student', 'Accepted', '#22c55e', 60, false),
  ('student', 'Enrolled', '#16a34a', 70, true)
on conflict (entity_type, name) do nothing;

-- Per-application statuses.
insert into public.statuses (entity_type, name, color, sort_order, is_terminal) values
  ('application', 'Draft', '#94a3b8', 10, false),
  ('application', 'Submitted', '#6366f1', 20, false),
  ('application', 'Under Review', '#f59e0b', 30, false),
  ('application', 'Accepted', '#22c55e', 40, true),
  ('application', 'Rejected', '#ef4444', 50, true),
  ('application', 'Enrolled', '#16a34a', 60, true)
on conflict (entity_type, name) do nothing;

-- High school partnership statuses.
insert into public.statuses (entity_type, name, color, sort_order, is_terminal) values
  ('high_school', 'Prospect', '#94a3b8', 10, false),
  ('high_school', 'Active', '#22c55e', 20, false),
  ('high_school', 'Inactive', '#ef4444', 30, true)
on conflict (entity_type, name) do nothing;
