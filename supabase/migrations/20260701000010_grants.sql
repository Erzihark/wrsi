-- Privileges for the PostgREST API roles. Row access is still gated by RLS;
-- these grants only allow the roles to reach the tables at all.
-- No grants to `anon`: the app has no unauthenticated endpoints.

grant usage on schema public to authenticated, service_role;

grant all on all tables in schema public to authenticated, service_role;
grant all on all sequences in schema public to authenticated, service_role;
grant execute on all routines in schema public to authenticated, service_role;

-- Apply the same defaults to objects created by future migrations.
alter default privileges in schema public grant all on tables to authenticated, service_role;
alter default privileges in schema public grant all on sequences to authenticated, service_role;
alter default privileges in schema public grant execute on routines to authenticated, service_role;
