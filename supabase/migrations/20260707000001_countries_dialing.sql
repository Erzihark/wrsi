-- Countries become a full standard catalog:
--   * name_es      — Spanish display name (app is Spanish-first; `name` stays English)
--   * calling_code — E.164 dialing prefix ('+52'); phone inputs are always preceded
--                    by a country-code selector fed from this column.
-- The full list itself ships in seed.sql (reference data, identical in every environment).

alter table public.countries
  add column name_es text,
  add column calling_code text;

-- Fix: a user holding both admin and super_admin received duplicate
-- notifications from the interest trigger (one per matching role row).
create or replace function public.notify_admins_on_university_interest()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, title, body, data)
  select distinct ur.user_id, 'university_interest', 'New university interest',
         'A student expressed interest in a university.',
         jsonb_build_object('student_id', new.student_id, 'university_id', new.university_id)
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  where r.name in ('admin', 'super_admin');
  return new;
end;
$$;
