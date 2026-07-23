-- Student event experience (the designer's pre/during/post event views).
--
-- Three model changes, all driven by the comp:
--
-- 1. University interest gains a *level* (interesada vs favorita) and a personal
--    `rank`, so "Mis universidades → Mi ranking" is an ordered top list rather
--    than a flat saved set. Deliberately global (on student_university_interest)
--    rather than event-scoped: a ranking built at the tour is the same ranking
--    the student sees in the Universidades tab afterwards.
--
-- 2. Workshops and 1:1 meetings become *requests* with an approval decision.
--    The comp's tabs are Solicitados / Aprobados / Rechazados with Pendiente /
--    Aprobado badges and an assigned room ("Salón 7"), which the previous
--    instant-registration and first-come-slot models could not express.
--
-- 3. `one_to_ones` flips from admin-created open slots that students claim to
--    student-created requests that staff schedule (time + room) and approve.
--    Pre-existing rows are backfilled to 'approved' — they were confirmed
--    bookings under the old model.

-- ===========================================================================
-- 1. University interest: interesada / favorita + personal ranking
-- ===========================================================================
alter table public.student_university_interest
  add column interest_level text not null default 'interested'
    check (interest_level in ('interested', 'favorite')),
  add column rank int;

comment on column public.student_university_interest.interest_level is
  'interested = ☆ "Interesada" (considering); favorite = ★ "Favorita" (in the student''s top / ranking).';
comment on column public.student_university_interest.rank is
  'Position in the student''s personal top list, 1-based. Only meaningful for interest_level = ''favorite''. Not uniquely constrained on purpose: reordering rewrites the whole block in one statement, and a unique index would reject the intermediate state. Read it as ORDER BY rank NULLS LAST, created_at.';
comment on column public.student_university_interest.rating is
  'Legacy 1-5 star rating from the original schema. Superseded by rank/interest_level; retained so no data is lost. Nothing writes it.';

create index student_university_interest_rank_idx
  on public.student_university_interest (student_id, rank);

-- ===========================================================================
-- 2. Shared decision-authority guard for request tables
-- ===========================================================================
-- Both request tables are student-owned rows under `can_access_student` RLS,
-- which by itself would let a student UPDATE their own row's status and
-- self-approve. RLS can't express "you may write this row but not these
-- columns", so the column-level authority lives here: only an admin may set a
-- decision, and the decision metadata is stamped rather than trusted.
create or replace function public.enforce_request_decision_authority()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  -- The service/seed context (no auth.uid()) writes decided rows directly, so
  -- it counts as staff — otherwise seeded approved requests get forced back to
  -- pending. Mirrors the hardening triggers' `is_service_context()` guard.
  v_admin boolean := public.is_admin() or public.is_service_context();
begin
  if tg_op = 'INSERT' then
    if not v_admin then
      -- A student may only ever create a pending, unscheduled request — the
      -- time and room are staff's to assign. Blank every staff-owned field so a
      -- crafted insert can't self-schedule or self-approve. `start_time`/
      -- `end_time` only exist on one_to_ones; guard the reference so the same
      -- trigger stays usable on workshop_registrations (which has neither).
      new.status     := 'pending';
      new.room       := null;
      new.decided_at := null;
      new.decided_by := null;
      if tg_table_name = 'one_to_ones' then
        new.start_time := null;
        new.end_time   := null;
      end if;
    end if;
    if v_admin and new.status <> 'pending' then
      new.decided_at := coalesce(new.decided_at, now());
      new.decided_by := coalesce(new.decided_by, auth.uid());
    end if;
    return new;
  end if;

  -- UPDATE. `student_note` is the one field a student owns after submitting;
  -- everything else — status, room, and the scheduled time itself — is staff's.
  -- Comparing the whole row minus that field is deliberate: it stays correct if
  -- a later migration adds a column, instead of silently leaving it unguarded.
  if not v_admin then
    if (to_jsonb(new) - 'student_note') is distinct from (to_jsonb(old) - 'student_note') then
      raise exception 'only staff may decide or schedule a request'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    if new.status = 'pending' then
      new.decided_at := null;
      new.decided_by := null;
    else
      new.decided_at := now();
      new.decided_by := auth.uid();
    end if;
  end if;
  return new;
end;
$$;

-- Notify the student when staff decide one of their requests. The event id is
-- carried in `data` so the app can deep-link straight back to the event.
create or replace function public.notify_student_on_request_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_event_id uuid;
  v_label text;
begin
  if new.status = 'pending' or new.status is not distinct from old.status then
    return new;
  end if;

  select s.user_id into v_user_id from public.students s where s.id = new.student_id;
  if v_user_id is null then
    return new;
  end if;

  if tg_argv[0] = 'workshop' then
    select w.event_id into v_event_id from public.workshops w where w.id = new.workshop_id;
    v_label := 'Workshop';
  else
    v_event_id := new.event_id;
    v_label := 'Meeting 1 a 1';
  end if;

  insert into public.notifications (user_id, type, title, body, data)
  values (
    v_user_id,
    'event_request_' || new.status,
    v_label,
    case when new.status = 'approved'
      then 'Tu solicitud fue aprobada.'
      else 'Tu solicitud fue rechazada.' end,
    jsonb_build_object(
      'event_id', v_event_id,
      'kind', tg_argv[0],
      'status', new.status
    )
  );
  return new;
end;
$$;

-- ===========================================================================
-- 3. Workshop registrations become workshop requests
-- ===========================================================================
alter table public.workshop_registrations
  add column status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  add column room text,
  add column decided_at timestamptz,
  add column decided_by uuid references public.users (id) on delete set null;

-- Rows that predate this migration were confirmed spots under the old
-- instant-registration model, not pending requests.
update public.workshop_registrations
  set status = 'approved', decided_at = created_at
  where status = 'pending';

comment on column public.workshop_registrations.room is
  'Salón assigned by staff when the request is approved. Null while pending.';

create index workshop_registrations_status_idx
  on public.workshop_registrations (student_id, status);

create trigger workshop_registrations_decision_authority
  before insert or update on public.workshop_registrations
  for each row execute function public.enforce_request_decision_authority();

create trigger workshop_registrations_notify_decision
  after update on public.workshop_registrations
  for each row execute function public.notify_student_on_request_decision('workshop');

-- The no-double-booking rule now applies to *approved* spots only: a pending
-- request must not be blocked by (or block) another pending request, since
-- staff resolve those conflicts by rejecting one. Re-created to add the status
-- filter and to run on approval as well as on insert.
create or replace function public.prevent_workshop_time_overlap()
returns trigger
language plpgsql
as $$
declare
  new_start timestamptz;
  new_end   timestamptz;
  conflicts int;
begin
  if new.status <> 'approved' then
    return new;
  end if;

  select start_time, end_time into new_start, new_end
  from public.workshops where id = new.workshop_id;

  select count(*) into conflicts
  from public.workshop_registrations wr
  join public.workshops w on w.id = wr.workshop_id
  where wr.student_id = new.student_id
    and wr.workshop_id <> new.workshop_id
    and wr.status = 'approved'
    and tstzrange(w.start_time, w.end_time) && tstzrange(new_start, new_end);

  if conflicts > 0 then
    raise exception 'Student already registered for a workshop overlapping this time slot'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger workshop_registrations_no_overlap_on_approve
  before update on public.workshop_registrations
  for each row
  when (new.status = 'approved' and old.status is distinct from 'approved')
  execute function public.prevent_workshop_time_overlap();

-- ===========================================================================
-- 4. one_to_ones become meeting requests
-- ===========================================================================
-- A request carries no time until staff schedule it, so the times go nullable.
alter table public.one_to_ones
  alter column start_time drop not null,
  alter column end_time   drop not null;

alter table public.one_to_ones
  add column status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  add column room text,
  add column student_note text,
  add column decided_at timestamptz,
  add column decided_by uuid references public.users (id) on delete set null;

-- Everything that already exists was created by staff: booked slots were
-- confirmed meetings, and unclaimed slots are staff-prepared rows that simply
-- belong to no student (and so never surface in the student's request list).
update public.one_to_ones
  set status = 'approved', decided_at = created_at
  where status = 'pending';

comment on table public.one_to_ones is
  'Student-requested 1:1 meetings with a university at an event. A student inserts a pending row (no time); staff set start_time/end_time/room and approve or reject it. Rows with a null student_id are legacy staff-prepared slots from the pre-request model.';
comment on column public.one_to_ones.room is
  'Salón assigned by staff when the meeting is approved. Null while pending.';
comment on column public.one_to_ones.student_note is
  'Optional message the student attaches to the request (what they want to discuss).';

create index one_to_ones_student_status_idx on public.one_to_ones (student_id, status);

-- One live request per student per university per event; a rejected request may
-- be re-submitted, so rejected rows are excluded from the constraint.
create unique index one_to_ones_one_live_request_per_university
  on public.one_to_ones (event_id, university_id, student_id)
  where student_id is not null and status in ('pending', 'approved');

create trigger one_to_ones_decision_authority
  before insert or update on public.one_to_ones
  for each row execute function public.enforce_request_decision_authority();

create trigger one_to_ones_notify_decision
  after update on public.one_to_ones
  for each row execute function public.notify_student_on_request_decision('meeting');

-- The pre-request hardening trigger (`guard_one_to_one_booking`) enforced
-- "a non-staff update may only book a free slot or cancel your own booking".
-- That semantics is gone — students now insert a request and delete it, never
-- flip `student_id` on someone else's row — and `enforce_request_decision_authority`
-- above is the stricter successor (it rejects a non-staff write to any field
-- but `student_note`). Drop the old guard so there aren't two overlapping ones
-- with a now-misleading error message.
drop trigger if exists one_to_ones_guard_booking on public.one_to_ones;
drop function if exists public.guard_one_to_one_booking();

-- ---------------------------------------------------------------------------
-- RLS: requests are personal
-- ---------------------------------------------------------------------------
-- The old policies were written for the open-slot model (everyone could read
-- every slot, and any student could claim a free one). Under the request model
-- a row is one student's private request, so reads narrow to the owner + staff,
-- and "claiming" is replaced by inserting your own row.
drop policy one_to_ones_read on public.one_to_ones;
drop policy one_to_ones_student_book on public.one_to_ones;

create policy one_to_ones_read on public.one_to_ones
  for select to authenticated
  using (public.is_admin() or student_id is null or public.can_access_student(student_id));

create policy one_to_ones_student_request on public.one_to_ones
  for insert to authenticated
  with check (student_id = public.current_student_id());

-- A student may withdraw a request; the decision-authority trigger is what
-- stops them from editing its status in place.
create policy one_to_ones_student_withdraw on public.one_to_ones
  for delete to authenticated
  using (public.can_access_student(student_id));

create policy one_to_ones_student_update_note on public.one_to_ones
  for update to authenticated
  using (public.can_access_student(student_id))
  with check (public.can_access_student(student_id));
