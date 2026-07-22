-- Defense-in-depth for sponsors_and_allies.email/links: the admin app validates
-- format client-side (packages/shared-utils/src/validation.ts: isEmail/isWebUrl),
-- but nothing enforced it at the DB layer, so a direct write (or a client bug)
-- could store a malformed value. These CHECK constraints mirror the same
-- pragmatic patterns used by the app's zod fields (allow null/empty; only the
-- rest of the codebase's email/website columns rely on app-layer validation
-- alone, but this table's rows are hand-entered admin reference data with no
-- other guard, so belt-and-suspenders here is warranted).
alter table public.sponsors_and_allies
  add constraint sponsors_and_allies_email_format_check
    check (email is null or email::text ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  add constraint sponsors_and_allies_links_format_check
    check (links is null or links ~* '^https?://[^\s/$.?#][^\s]*\.[^\s]+$');
