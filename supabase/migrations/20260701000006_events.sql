-- Events, participating universities, workshops, one-to-ones, and note/ranking capture.

create table public.events (
  id                   uuid primary key default gen_random_uuid(),
  state_province_id    uuid references public.states_provinces (id) on delete set null,
  title                text not null,
  description          text,
  location             text,
  event_type           text,          -- 'fair', 'open_fair_day', ...
  start_date           date,
  end_date             date,
  registration_deadline timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- Single registration per student per event (kills the duplicate-registration problem).
create table public.event_registrations (
  student_id uuid not null references public.students (id) on delete cascade,
  event_id   uuid not null references public.events (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, event_id)
);

create table public.event_universities (
  university_id uuid not null references public.universities (id) on delete cascade,
  event_id      uuid not null references public.events (id) on delete cascade,
  primary key (university_id, event_id)
);

create table public.workshops (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events (id) on delete cascade,
  university_id uuid references public.universities (id) on delete set null,
  title         text not null,
  start_time    timestamptz not null,
  end_time      timestamptz not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index workshops_event_id_idx on public.workshops (event_id);
create trigger workshops_set_updated_at
  before update on public.workshops
  for each row execute function public.set_updated_at();

create table public.workshop_registrations (
  student_id  uuid not null references public.students (id) on delete cascade,
  workshop_id uuid not null references public.workshops (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (student_id, workshop_id)
);

-- Enforce: a student cannot register for two time-overlapping workshops.
create or replace function public.prevent_workshop_time_overlap()
returns trigger
language plpgsql
as $$
declare
  new_start timestamptz;
  new_end   timestamptz;
  conflicts int;
begin
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

create trigger workshop_registrations_no_overlap
  before insert on public.workshop_registrations
  for each row execute function public.prevent_workshop_time_overlap();

-- Open Fair Day 1:1 appointments (student_id null until booked).
create table public.one_to_ones (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events (id) on delete cascade,
  university_id uuid references public.universities (id) on delete set null,
  student_id    uuid references public.students (id) on delete set null,
  start_time    timestamptz not null,
  end_time      timestamptz not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index one_to_ones_event_id_idx on public.one_to_ones (event_id);
create trigger one_to_ones_set_updated_at
  before update on public.one_to_ones
  for each row execute function public.set_updated_at();

-- Digital capture of student notes + university ranking during an event (replaces paper).
create table public.event_notes (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.students (id) on delete cascade,
  event_id      uuid not null references public.events (id) on delete cascade,
  university_id uuid references public.universities (id) on delete set null,
  note          text,
  ranking       int,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index event_notes_student_event_idx on public.event_notes (student_id, event_id);
create trigger event_notes_set_updated_at
  before update on public.event_notes
  for each row execute function public.set_updated_at();
