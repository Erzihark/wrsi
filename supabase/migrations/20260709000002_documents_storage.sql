-- Private Storage bucket for student documents + storage RLS.
--
-- The `public.documents` table (owner user_id, storage_path, type, ...) and its
-- `documents_access` RLS already exist; this adds the actual object store. Files
-- live under a `{owner_user_id}/…` key prefix so the same access rule that governs
-- the metadata row can be expressed on the object: the first path segment is the
-- owner, and `can_access_user()` decides who may read/write it (owner, an admin, or
-- the owner's assigned counselor — identical to `documents_access` and the
-- storage-policy sketch in the plan).

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- storage.objects already has RLS enabled by Supabase; scope a policy to this bucket.
-- (storage.foldername(name))[1] is the leading `{user_id}` folder of the object key.
create policy documents_bucket_access on storage.objects
  for all to authenticated
  using (
    bucket_id = 'documents'
    and public.can_access_user(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'documents'
    and public.can_access_user(((storage.foldername(name))[1])::uuid)
  );
