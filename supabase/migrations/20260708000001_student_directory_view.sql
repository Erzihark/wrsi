-- Read-optimized view for the counselor/admin student list: joins counselor
-- name, high school name, and the student's latest lifecycle status (a
-- lateral join on status_history) so the list doesn't need N+1 queries.
--
-- security_invoker = true (PG15+) makes the view run with the CALLING user's
-- permissions, so it inherits RLS from students/status_history/counselors/
-- high_schools automatically — a counselor still only sees their assigned
-- students, exactly as querying `students` directly would. This view is
-- read-only; edits go straight to `public.students`.
create or replace view public.student_directory
with (security_invoker = true) as
select
  s.*,
  c.first_name as counselor_first_name,
  c.last_name  as counselor_last_name,
  hs.name      as high_school_name,
  latest.status_id,
  st.name      as status_name,
  st.color     as status_color,
  latest.changed_at as status_changed_at
from public.students s
left join public.counselors c on c.id = s.counselor_id
left join public.high_schools hs on hs.id = s.high_school_id
left join lateral (
  select sh.status_id, sh.changed_at
  from public.status_history sh
  where sh.student_id = s.id
  order by sh.changed_at desc
  limit 1
) latest on true
left join public.statuses st on st.id = latest.status_id;

grant select on public.student_directory to authenticated;
