-- Product decision (2026-07-07): editing a student *record* is admin/super-admin
-- only. Counselors keep their operational writes (status_history, tasks, comments,
-- documents on assigned students) but may no longer UPDATE the students row itself.
--
-- Students may still update their own row (self-service / onboarding), gated by the
-- existing students_guard_restricted_columns trigger which blocks them from changing
-- assignment columns.
drop policy students_update on public.students;
create policy students_update on public.students
  for update to authenticated
  using (public.is_admin() or user_id = auth.uid())
  with check (public.is_admin() or user_id = auth.uid());
