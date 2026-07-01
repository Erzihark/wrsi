-- Extensions, shared enums, and utility functions.
-- Applied first; everything else depends on these.

create extension if not exists pgcrypto with schema extensions;   -- gen_random_uuid()
create extension if not exists citext with schema extensions;      -- case-insensitive email
create extension if not exists btree_gist with schema extensions;  -- exclusion constraints (time overlap)

-- Fixed small value sets modeled as enums (larger/editable sets use lookup tables instead).
create type public.intake_term as enum ('fall', 'winter', 'spring_summer');
create type public.device_platform as enum ('ios', 'android', 'web');
create type public.task_status as enum ('open', 'in_progress', 'done', 'cancelled');

-- Auto-maintains updated_at on tables that have the column.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
