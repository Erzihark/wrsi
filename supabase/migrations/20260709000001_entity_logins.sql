-- Make high schools and universities first-class login-capable accounts, exactly
-- like students. Both were left with a nullable user_id as a placeholder for the
-- future self-service portals; we now provision a login-capable auth user for each
-- at create time (via the admin `create-entity` Edge Function), so user_id becomes
-- mandatory and deleting the auth user cascades to the entity row (matching
-- students.user_id, which is already NOT NULL + ON DELETE CASCADE).
--
-- Safe on a fresh `db reset`: migrations apply to empty tables before seeds run, and
-- no hosted environment has null rows yet (staging isn't stood up). The seed files
-- provision users for the seeded high schools/universities in the same change.

-- high_schools ---------------------------------------------------------------
alter table public.high_schools
  drop constraint high_schools_user_id_fkey;
alter table public.high_schools
  alter column user_id set not null;
alter table public.high_schools
  add constraint high_schools_user_id_fkey
    foreign key (user_id) references public.users (id) on delete cascade;

-- universities ---------------------------------------------------------------
alter table public.universities
  drop constraint universities_user_id_fkey;
alter table public.universities
  alter column user_id set not null;
alter table public.universities
  add constraint universities_user_id_fkey
    foreign key (user_id) references public.users (id) on delete cascade;
