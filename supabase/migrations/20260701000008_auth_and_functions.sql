-- Auth wiring, role helpers, access predicates, and business triggers.

-- On auth signup: mirror into public.users and grant the default 'student' role.
-- Admin-created accounts (counselors, universities, high schools) get roles adjusted afterward.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role_id)
  select new.id, r.id from public.roles r where r.name = 'student'
  on conflict do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Custom access token hook: inject the user's role names into the JWT for client use.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims    jsonb;
  roles_arr jsonb;
begin
  select coalesce(jsonb_agg(r.name), '[]'::jsonb) into roles_arr
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  where ur.user_id = (event->>'user_id')::uuid;

  claims := coalesce(event->'claims', '{}'::jsonb);
  claims := jsonb_set(claims, '{user_roles}', roles_arr);
  event  := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
grant select on public.user_roles, public.roles to supabase_auth_admin;

-- ---------------------------------------------------------------------------
-- Role / access helper predicates (SECURITY DEFINER -> bypass RLS, no recursion).
-- ---------------------------------------------------------------------------
create or replace function public.has_role(role_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid() and r.name = role_name
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role('admin') or public.has_role('super_admin');
$$;

create or replace function public.current_student_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.students where user_id = auth.uid();
$$;

create or replace function public.is_counselor_of(p_student_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.students s
    join public.counselors c on c.id = s.counselor_id
    where s.id = p_student_id and c.user_id = auth.uid()
  );
$$;

-- Can the current user see/act on a given student's records?
create or replace function public.can_access_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_admin()
    or exists (select 1 from public.students s where s.id = p_student_id and s.user_id = auth.uid())
    or public.is_counselor_of(p_student_id);
$$;

-- Can the current user see/act on records keyed by a user id (e.g. documents)?
create or replace function public.can_access_user(p_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    p_user_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.students s
      join public.counselors c on c.id = s.counselor_id
      where s.user_id = p_user_id and c.user_id = auth.uid()
    );
$$;

-- ---------------------------------------------------------------------------
-- Business trigger: notify admins when a student saves/likes a university.
-- ---------------------------------------------------------------------------
create or replace function public.notify_admins_on_university_interest()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, title, body, data)
  select ur.user_id, 'university_interest', 'New university interest',
         'A student expressed interest in a university.',
         jsonb_build_object('student_id', new.student_id, 'university_id', new.university_id)
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  where r.name in ('admin', 'super_admin');
  return new;
end;
$$;

create trigger student_university_interest_notify
  after insert on public.student_university_interest
  for each row execute function public.notify_admins_on_university_interest();
