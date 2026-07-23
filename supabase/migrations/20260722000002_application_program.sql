-- A formal application targets a specific *program*, not just a university: the
-- student's "Mis aplicaciones" card names the degree they applied to
-- ("Licenciatura en Business Administration"), which `student_applications`
-- could not express — it only pointed at the university.
--
-- Nullable on purpose: applications created before this column exists (and
-- staff drafts opened before the program is settled) legitimately have none,
-- and the card falls back to the intake term in that case.

-- The composite FK below needs a unique key it can point at. `id` is already
-- the primary key, so this pair is unique by construction — the constraint
-- exists purely to make that fact referenceable.
alter table public.university_programs
  add constraint university_programs_id_university_id_key unique (id, university_id);

alter table public.student_applications
  add column program_id uuid;

-- Referencing (id, university_id) rather than just (id) is what stops a program
-- from one university being attached to an application to another. MATCH SIMPLE
-- (the default) skips the check entirely when program_id is null, which is
-- exactly the "no program chosen yet" case above.
alter table public.student_applications
  add constraint student_applications_program_fkey
  foreign key (program_id, university_id)
  references public.university_programs (id, university_id)
  on update cascade
  on delete restrict;

create index student_applications_program_id_idx
  on public.student_applications (program_id);
