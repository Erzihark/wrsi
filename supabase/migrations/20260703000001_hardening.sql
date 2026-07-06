-- Security & robustness hardening from the architecture review (2026-07-03).
-- Fixes found before any production data exists:
--   1. comments were readable by every authenticated user (counselor notes leaked to students)
--   2. students could rewrite their own lifecycle history (status_history was student-writable)
--   3. students could reassign their own counselor / prepa / user_id via UPDATE students
--   4. users could reactivate themselves (is_active) and desync email from auth.users
--   5. one-to-one booking let a student edit slot times/university, and blocked cancelling
--   6. workshop time-overlap check was racy under concurrent registrations
--   7. missing indexes on the dashboard's hottest queries

-- Helper used by several guards below: true when running outside a user JWT
-- (service role, postgres, migrations) — those contexts stay unrestricted.
create or replace function public.is_service_context()
returns boolean language sql stable as $$
  select auth.uid() is null;
$$;

-- ===========================================================================
-- 1. Comments: entity-scoped read instead of read-all.
--    Comments about a student are visible only to those who can access that
--    student; other entity types (university, high_school, event...) stay
--    visible to authenticated users (directory-style discussion).
-- ===========================================================================
drop policy comments_read on public.comments;
create policy comments_read on public.comments
  for select to authenticated using (
    public.is_admin()
    or author_user_id = auth.uid()
    or case
         when entity_type = 'student' then public.can_access_student(entity_id)
         else true
       end
  );

-- ===========================================================================
-- 2. status_history: students may READ their history, but only staff
--    (assigned counselor / admin) or the service context may write it.
--    The onboarding RPC still works: SECURITY DEFINER bypasses RLS.
-- ===========================================================================
drop policy status_history_access on public.status_history;
create policy status_history_read on public.status_history
  for select to authenticated using (public.can_access_student(student_id));
create policy status_history_staff_write on public.status_history
  for insert to authenticated
  with check (public.is_admin() or public.is_counselor_of(student_id));
create policy status_history_admin_modify on public.status_history
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy status_history_admin_delete on public.status_history
  for delete to authenticated using (public.is_admin());

-- Same reasoning for the per-application status track.
drop policy application_status_history_access on public.application_status_history;
create policy application_status_history_read on public.application_status_history
  for select to authenticated
  using (public.can_access_student((select student_id from public.student_applications sa where sa.id = application_id)));
create policy application_status_history_staff_write on public.application_status_history
  for insert to authenticated
  with check (
    public.is_admin()
    or public.is_counselor_of((select student_id from public.student_applications sa where sa.id = application_id)));
create policy application_status_history_admin_modify on public.application_status_history
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy application_status_history_admin_delete on public.application_status_history
  for delete to authenticated using (public.is_admin());

-- ===========================================================================
-- 3. students: guard assignment/identity columns. RLS row policies stay as-is;
--    this trigger blocks non-staff from changing who they're assigned to.
-- ===========================================================================
create or replace function public.guard_student_restricted_columns()
returns trigger language plpgsql as $$
begin
  if public.is_service_context() or public.is_admin() then
    return new;
  end if;

  if new.user_id is distinct from old.user_id
     or new.counselor_id is distinct from old.counselor_id then
    raise exception 'only an admin can change student assignment columns'
      using errcode = '42501';
  end if;

  -- Prepa affiliation: staff-only (assigned counselor may correct it).
  if new.high_school_id is distinct from old.high_school_id
     and not public.is_counselor_of(old.id) then
    raise exception 'only staff can change a student''s high school'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger students_guard_restricted_columns
  before update on public.students
  for each row execute function public.guard_student_restricted_columns();

-- ===========================================================================
-- 4. users: only admins/service may change is_active or email
--    (email must stay in sync with auth.users; deactivation must stick).
-- ===========================================================================
create or replace function public.guard_user_restricted_columns()
returns trigger language plpgsql as $$
begin
  if public.is_service_context() or public.is_admin() then
    return new;
  end if;
  if new.is_active is distinct from old.is_active
     or new.email is distinct from old.email then
    raise exception 'only an admin can change account status or email'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger users_guard_restricted_columns
  before update on public.users
  for each row execute function public.guard_user_restricted_columns();

-- ===========================================================================
-- 5. one_to_ones: a non-staff update may ONLY book a free slot for yourself
--    or cancel your own booking — never touch times/university/event.
-- ===========================================================================
create or replace function public.guard_one_to_one_booking()
returns trigger language plpgsql as $$
begin
  if public.is_service_context() or public.is_admin() then
    return new;
  end if;

  if new.event_id is distinct from old.event_id
     or new.university_id is distinct from old.university_id
     or new.start_time is distinct from old.start_time
     or new.end_time is distinct from old.end_time then
    raise exception 'only an admin can modify one-to-one slot details'
      using errcode = '42501';
  end if;

  -- book: null -> own student id | cancel: own student id -> null
  if not (
    (old.student_id is null and new.student_id = public.current_student_id())
    or (old.student_id = public.current_student_id() and new.student_id is null)
    or new.student_id is not distinct from old.student_id
  ) then
    raise exception 'you can only book a free slot or cancel your own booking'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger one_to_ones_guard_booking
  before update on public.one_to_ones
  for each row execute function public.guard_one_to_one_booking();

-- Allow cancelling: the old WITH CHECK required student_id = self, which
-- rejected setting it back to null. The trigger above now enforces the rules.
drop policy one_to_ones_student_book on public.one_to_ones;
create policy one_to_ones_student_book on public.one_to_ones
  for update to authenticated
  using (public.is_admin() or student_id is null or public.can_access_student(student_id))
  with check (true);

-- ===========================================================================
-- 6. Workshop overlap: serialize per student so two concurrent registrations
--    can't both pass the check.
-- ===========================================================================
create or replace function public.prevent_workshop_time_overlap()
returns trigger
language plpgsql
as $$
declare
  new_start timestamptz;
  new_end   timestamptz;
  conflicts int;
begin
  -- One registration transaction per student at a time.
  perform pg_advisory_xact_lock(hashtext('workshop_reg:' || new.student_id::text));

  select start_time, end_time into new_start, new_end
  from public.workshops where id = new.workshop_id;

  select count(*) into conflicts
  from public.workshop_registrations wr
  join public.workshops w on w.id = wr.workshop_id
  where wr.student_id = new.student_id
    and wr.workshop_id <> new.workshop_id
    and tstzrange(w.start_time, w.end_time) && tstzrange(new_start, new_end);

  if conflicts > 0 then
    raise exception 'Student already registered for a workshop overlapping this time slot'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

-- ===========================================================================
-- 7. Indexes for the dashboard's hot paths.
-- ===========================================================================
-- Latest-status query: order by changed_at desc limit 1 per student.
create index status_history_student_changed_idx
  on public.status_history (student_id, changed_at desc);
drop index if exists public.status_history_student_id_idx;

-- Notifications list: all rows for a user, newest first (partial unread index
-- doesn't serve the full list).
create index notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

-- Attendance/roster lookups from the event side.
create index event_registrations_event_idx on public.event_registrations (event_id);
create index workshop_registrations_workshop_idx on public.workshop_registrations (workshop_id);
