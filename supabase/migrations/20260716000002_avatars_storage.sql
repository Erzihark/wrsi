-- Public Storage bucket for profile photos (students + counselors) + storage RLS.
--
-- Unlike `documents` (private, signed URLs), avatars are display-everywhere images:
-- a public bucket keeps rendering trivial via getPublicUrl. Privacy tradeoff
-- (documented in docs/DECISIONS.md): anyone with the exact URL can view the image;
-- the `{owner_user_id}/avatar-{timestamp}.{ext}` key starts with an unguessable
-- uuid, and signed-URL hardening is logged as a follow-up.
--
-- Writes are owner-or-admin: the first path segment must be the caller's own
-- user_id (a student manages their own photo), or the caller is an admin (admins
-- upload counselor photos into the counselor's user folder).

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy avatars_bucket_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (((storage.foldername(name))[1])::uuid = auth.uid() or public.is_admin())
  );

create policy avatars_bucket_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (((storage.foldername(name))[1])::uuid = auth.uid() or public.is_admin())
  )
  with check (
    bucket_id = 'avatars'
    and (((storage.foldername(name))[1])::uuid = auth.uid() or public.is_admin())
  );

create policy avatars_bucket_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (((storage.foldername(name))[1])::uuid = auth.uid() or public.is_admin())
  );

-- The bucket is public (anonymous reads by URL); this covers authenticated
-- API-level listing/reading of one's own folder and admin listing.
create policy avatars_bucket_read on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars');
