-- Row-Level Security. Enable on every table, then grant per-role access.
-- Conventions:
--   * reference/lookup + directory data: readable by any authenticated user, writable by admins
--   * student-owned data: student (self) + assigned counselor + admin
--   * sensitive partner data: admin only

alter table public.users                          enable row level security;
alter table public.roles                          enable row level security;
alter table public.user_roles                     enable row level security;
alter table public.counselors                     enable row level security;
alter table public.students                       enable row level security;
alter table public.high_schools                   enable row level security;
alter table public.universities                   enable row level security;
alter table public.sponsors_and_allies            enable row level security;
alter table public.special_partners               enable row level security;
alter table public.countries                      enable row level security;
alter table public.states_provinces               enable row level security;
alter table public.currencies                     enable row level security;
alter table public.languages                      enable row level security;
alter table public.language_exams                 enable row level security;
alter table public.fields_of_study                enable row level security;
alter table public.education_levels               enable row level security;
alter table public.education_models               enable row level security;
alter table public.accreditations                 enable row level security;
alter table public.financial_plans                enable row level security;
alter table public.industries                     enable row level security;
alter table public.document_types                 enable row level security;
alter table public.statuses                       enable row level security;
alter table public.high_school_accreditations     enable row level security;
alter table public.status_history                 enable row level security;
alter table public.student_passports              enable row level security;
alter table public.student_fields_of_study_interest enable row level security;
alter table public.student_countries_interest     enable row level security;
alter table public.student_education_level_interest enable row level security;
alter table public.student_language_exams         enable row level security;
alter table public.student_applications           enable row level security;
alter table public.application_status_history     enable row level security;
alter table public.university_programs            enable row level security;
alter table public.student_university_interest    enable row level security;
alter table public.events                         enable row level security;
alter table public.event_registrations            enable row level security;
alter table public.event_universities             enable row level security;
alter table public.workshops                      enable row level security;
alter table public.workshop_registrations         enable row level security;
alter table public.one_to_ones                    enable row level security;
alter table public.event_notes                    enable row level security;
alter table public.documents                      enable row level security;
alter table public.comments                       enable row level security;
alter table public.notifications                  enable row level security;
alter table public.push_tokens                    enable row level security;
alter table public.activities                     enable row level security;
alter table public.audit_logs                     enable row level security;
alter table public.tasks                          enable row level security;
alter table public.content_blocks                 enable row level security;

-- ===========================================================================
-- Reference / lookup tables: authenticated read, admin write.
-- ===========================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'roles','countries','states_provinces','currencies','languages','language_exams',
    'fields_of_study','education_levels','education_models','accreditations',
    'financial_plans','industries','document_types','statuses'
  ]
  loop
    execute format('create policy %I_read on public.%I for select to authenticated using (true);', t, t);
    execute format('create policy %I_admin_write on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin());', t, t);
  end loop;
end $$;

-- ===========================================================================
-- Identity
-- ===========================================================================
create policy users_self_or_admin_read on public.users
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy users_self_update on public.users
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy users_admin_all on public.users
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy user_roles_read on public.user_roles
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy user_roles_admin_write on public.user_roles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Counselors are visible to all authenticated users (students see their counselor).
create policy counselors_read on public.counselors
  for select to authenticated using (true);
create policy counselors_self_update on public.counselors
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy counselors_admin_write on public.counselors
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ===========================================================================
-- Students + owned child data
-- ===========================================================================
create policy students_read on public.students
  for select to authenticated using (public.can_access_student(id));
create policy students_self_insert on public.students
  for insert to authenticated with check (user_id = auth.uid() or public.is_admin());
create policy students_update on public.students
  for update to authenticated using (public.can_access_student(id)) with check (public.can_access_student(id));
create policy students_admin_delete on public.students
  for delete to authenticated using (public.is_admin());

-- Child tables keyed by student_id -> reuse can_access_student().
do $$
declare t text;
begin
  foreach t in array array[
    'status_history','student_passports','student_fields_of_study_interest',
    'student_countries_interest','student_education_level_interest','student_language_exams',
    'student_applications','student_university_interest','event_registrations',
    'workshop_registrations','event_notes'
  ]
  loop
    execute format(
      'create policy %I_access on public.%I for all to authenticated using (public.can_access_student(student_id)) with check (public.can_access_student(student_id));',
      t, t);
  end loop;
end $$;

-- application_status_history is keyed by application -> resolve to its student.
create policy application_status_history_access on public.application_status_history
  for all to authenticated
  using (public.can_access_student((select student_id from public.student_applications sa where sa.id = application_id)))
  with check (public.can_access_student((select student_id from public.student_applications sa where sa.id = application_id)));

-- ===========================================================================
-- Directory data: high schools, universities, programs
-- ===========================================================================
create policy high_schools_read on public.high_schools
  for select to authenticated using (true);
create policy high_schools_write on public.high_schools
  for all to authenticated
  using (public.is_admin() or user_id = auth.uid())
  with check (public.is_admin() or user_id = auth.uid());

create policy high_school_accreditations_read on public.high_school_accreditations
  for select to authenticated using (true);
create policy high_school_accreditations_admin_write on public.high_school_accreditations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy universities_read on public.universities
  for select to authenticated using (true);
create policy universities_write on public.universities
  for all to authenticated
  using (public.is_admin() or user_id = auth.uid())
  with check (public.is_admin() or user_id = auth.uid());

create policy university_programs_read on public.university_programs
  for select to authenticated using (true);
create policy university_programs_write on public.university_programs
  for all to authenticated
  using (public.is_admin() or exists (
    select 1 from public.universities u where u.id = university_id and u.user_id = auth.uid()))
  with check (public.is_admin() or exists (
    select 1 from public.universities u where u.id = university_id and u.user_id = auth.uid()));

-- ===========================================================================
-- Events (directory-style read, admin managed; registrations owned by students)
-- ===========================================================================
create policy events_read on public.events
  for select to authenticated using (true);
create policy events_admin_write on public.events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy event_universities_read on public.event_universities
  for select to authenticated using (true);
create policy event_universities_admin_write on public.event_universities
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy workshops_read on public.workshops
  for select to authenticated using (true);
create policy workshops_admin_write on public.workshops
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- One-to-ones: readable by all; a student may book/free their own slot; admins manage.
create policy one_to_ones_read on public.one_to_ones
  for select to authenticated using (true);
create policy one_to_ones_student_book on public.one_to_ones
  for update to authenticated
  using (public.is_admin() or student_id is null or public.can_access_student(student_id))
  with check (public.is_admin() or student_id = public.current_student_id());
create policy one_to_ones_admin_write on public.one_to_ones
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ===========================================================================
-- Documents (keyed by owner user_id)
-- ===========================================================================
create policy documents_access on public.documents
  for all to authenticated
  using (public.can_access_user(user_id))
  with check (public.can_access_user(user_id));

-- ===========================================================================
-- Comments (polymorphic). MVP: authenticated read; author writes own; admin moderates.
-- NOTE: per-entity_type authorization (e.g. only staff comment on a student) is a TODO.
-- ===========================================================================
create policy comments_read on public.comments
  for select to authenticated using (true);
create policy comments_insert_own on public.comments
  for insert to authenticated with check (author_user_id = auth.uid());
create policy comments_update_own on public.comments
  for update to authenticated using (author_user_id = auth.uid()) with check (author_user_id = auth.uid());
create policy comments_delete_own_or_admin on public.comments
  for delete to authenticated using (author_user_id = auth.uid() or public.is_admin());

-- ===========================================================================
-- Notifications & push tokens (owner scoped)
-- ===========================================================================
create policy notifications_own_read on public.notifications
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy notifications_own_update on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_admin_insert on public.notifications
  for insert to authenticated with check (public.is_admin());

create policy push_tokens_own on public.push_tokens
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===========================================================================
-- Activity timeline, audit log, tasks, content
-- ===========================================================================
create policy activities_read on public.activities
  for select to authenticated using (
    public.is_admin()
    or user_id = auth.uid()
    or (entity_type = 'student' and public.can_access_student(entity_id)));
create policy activities_admin_write on public.activities
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy audit_logs_admin_read on public.audit_logs
  for select to authenticated using (public.is_admin());

create policy tasks_access on public.tasks
  for all to authenticated
  using (public.is_admin() or assigned_to = auth.uid()
         or (student_id is not null and public.can_access_student(student_id)))
  with check (public.is_admin() or assigned_to = auth.uid()
         or (student_id is not null and public.can_access_student(student_id)));

create policy content_blocks_read on public.content_blocks
  for select to authenticated using (is_active or public.is_admin());
create policy content_blocks_admin_write on public.content_blocks
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ===========================================================================
-- Sensitive partner records: admin only
-- ===========================================================================
create policy sponsors_admin_only on public.sponsors_and_allies
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy special_partners_admin_only on public.special_partners
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
