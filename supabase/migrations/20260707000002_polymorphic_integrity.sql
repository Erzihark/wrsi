-- Polymorphic reference integrity.
--
-- comments/activities point at varying tables via (entity_type, entity_id), so a
-- real FK is impossible — Postgres can't reference "a table chosen per row". A
-- relationship-integrity audit (2026-07-07) confirmed every other *_id column has
-- a FK (77 constraints); these triggers close the polymorphic gap so a bad
-- entity_id (or a typo'd entity_type) is rejected at write time exactly like a
-- FK violation would be.
--
-- audit_logs is intentionally NOT validated: audit records must survive the
-- deletion of the entity they describe.

create or replace function public.entity_ref_exists(p_entity_type text, p_entity_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return case p_entity_type
    when 'student'             then exists (select 1 from public.students where id = p_entity_id)
    when 'counselor'           then exists (select 1 from public.counselors where id = p_entity_id)
    when 'high_school'         then exists (select 1 from public.high_schools where id = p_entity_id)
    when 'university'          then exists (select 1 from public.universities where id = p_entity_id)
    when 'event'               then exists (select 1 from public.events where id = p_entity_id)
    when 'student_application' then exists (select 1 from public.student_applications where id = p_entity_id)
    else false  -- unknown entity_type: reject so typos surface immediately
  end;
end;
$$;

create or replace function public.guard_polymorphic_ref()
returns trigger language plpgsql as $$
begin
  -- activities allows null entity refs (pure user-scoped log lines).
  if new.entity_type is null and new.entity_id is null then
    return new;
  end if;
  if new.entity_type is null or new.entity_id is null then
    raise exception 'entity_type and entity_id must be set together'
      using errcode = '23514';
  end if;
  if not public.entity_ref_exists(new.entity_type, new.entity_id) then
    raise exception 'no % with id % (polymorphic reference violation)',
      new.entity_type, new.entity_id using errcode = '23503';
  end if;
  return new;
end;
$$;

create trigger comments_guard_entity_ref
  before insert or update of entity_type, entity_id on public.comments
  for each row execute function public.guard_polymorphic_ref();

create trigger activities_guard_entity_ref
  before insert or update of entity_type, entity_id on public.activities
  for each row execute function public.guard_polymorphic_ref();

-- Deleting a parent can't cascade into polymorphic children (no FK), so clean
-- up comments/activities when the entities they point at are deleted.
create or replace function public.cleanup_polymorphic_refs()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_type text := tg_argv[0];
begin
  delete from public.comments where entity_type = v_type and entity_id = old.id;
  delete from public.activities where entity_type = v_type and entity_id = old.id;
  return old;
end;
$$;

create trigger students_cleanup_polymorphic
  after delete on public.students
  for each row execute function public.cleanup_polymorphic_refs('student');
create trigger counselors_cleanup_polymorphic
  after delete on public.counselors
  for each row execute function public.cleanup_polymorphic_refs('counselor');
create trigger high_schools_cleanup_polymorphic
  after delete on public.high_schools
  for each row execute function public.cleanup_polymorphic_refs('high_school');
create trigger universities_cleanup_polymorphic
  after delete on public.universities
  for each row execute function public.cleanup_polymorphic_refs('university');
create trigger events_cleanup_polymorphic
  after delete on public.events
  for each row execute function public.cleanup_polymorphic_refs('event');
create trigger student_applications_cleanup_polymorphic
  after delete on public.student_applications
  for each row execute function public.cleanup_polymorphic_refs('student_application');
