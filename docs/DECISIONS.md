# Engineering Decision Log

> Historical, dated write-ups of what was built and why — moved out of `docs/PROGRESS.md`
> (2026-07-09) to keep that file short. **Not auto-loaded into every session** — read this
> when you need the reasoning/verification behind a past change; read `PROGRESS.md` first for
> current status.

## Foundation (early milestones, verified)

Two commits on `master`: `2276c44` (Supabase backend + monorepo foundation), `74c753e`
(shared packages + mobile app shell).

1. **Monorepo hygiene** — Yarn 4 + Turborepo; TypeScript aligned to `~6.0.3`; shared tsconfig
   bases (`base` / `node` / `react-native`) in `packages/typescript-config`; turbo tasks wired.
2. **Supabase schema** — 10 migrations, 48 tables, all reviewed decisions applied
   (composite-PK junctions, numeric money + currency, timestamptz vs date, `education_models`
   rename, polymorphic `statuses`, `student_passports` for multi-nationality, polymorphic
   `comments`, `push_tokens`, one-to-ones, workshop-overlap trigger). *Verified:* `supabase
   db reset` applies cleanly.
3. **RLS + auth** — RLS on all 48 tables (86 policies); security-definer helpers
   (`is_admin`, `can_access_student`, `can_access_user`, …); signup trigger
   (`auth.users` → `public.users` + default `student` role); JWT role-claim hook;
   interest→admin-notification trigger; `authenticated`/`service_role` grants (migration
   `0010`). *Verified:* a student can read only their own `students` row; directory tables
   readable; cross-student access blocked.
4. **Shared packages** — `@wrsi/shared-types` (generated DB types), `@wrsi/shared-utils`,
   `@wrsi/api` (typed client + `SupabaseProvider`/`useSupabase` + query keys + example hooks),
   `@wrsi/ui` (tokens + `ThemeProvider` + `Screen/Text/Button/Input/Card/Badge`),
   `@wrsi/i18n` (es default + en). *Verified:* `yarn typecheck` passes.
5. **Mobile shell** — Expo SDK 56 + React Navigation. Root auth switch mounts
   Auth / Student / Counselor navigators by session + role; providers wired (SafeArea,
   TanStack Query, Supabase, i18n, Theme, Auth); Supabase session persisted via
   `expo-secure-store`; login/sign-up work against Supabase; placeholder student tabs +
   counselor screen. *Verified:* `yarn typecheck` passes and `expo export` bundles 985 modules.
6. **Onboarding + dashboard.** Migration `0011`:
   `students.onboarding_completed_at`, the `complete_student_onboarding()` RPC (atomic,
   idempotent, forces `user_id = auth.uid()`, sets initial `Onboarding` status), and
   `status_history` added to the `supabase_realtime` publication. `@wrsi/ui`: `Chip` /
   `Select` / `MultiSelect`. `@wrsi/api`: lookup hooks, `useCompleteOnboarding`,
   `useStudentCurrentStatus` (Realtime), `useStudentTasks`. Mobile: a `StudentGate` routes to
   a 3-step RHF+Zod onboarding wizard until `onboarding_completed_at` is set, then a rebuilt
   dashboard (status badge + progress timeline + pending tasks). *Verified:* migration applies;
   RPC + student-RLS reads tested via psql; `yarn typecheck` passes; `expo export` bundles
   1008 modules.

## Dated decisions

- **2026-07-09 — Global top app bar with Log-out (branch `feat/counselor-crm`).** The admin
  experience had no logout affordance at all (its tabs hide the tab header; inner stacks only
  show screen titles). Added one persistent `AppHeader` in `RootNavigator`, shown above every
  signed-in experience (admin/counselor/student), carrying the brand + a single Log-out
  action. `RootNavigator` zeroes the top safe-area inset for the nested navigator so screen
  headers don't double-pad under the notch. Removed the now-redundant inline logout buttons
  from the student dashboard and counselor list. Verified: `yarn typecheck` green.

- **2026-07-09 — Counselor CRM read-only student view (branch `feat/counselor-crm`).** The
  counselor's `Students` tab is now a stack: an assigned-students list (reuses
  `useStudentsList`; the `student_directory` RLS already limits a counselor to their own
  students) → a read-only single-pane student detail assembling existing hooks (`useStudent`
  + `useStudentCurrentStatus` + `useStudentTasks` + `useDocuments`): profile summary, current
  status badge, documents (opened via a short-lived signed URL — counselors can read assigned
  students' files through `can_access_user`), and tasks. Deliberately read-only: the
  status-change workflow stays deferred pending the client's 3 open status questions;
  task/note writes are a follow-up. No migration (reuses existing tables/RLS/hooks). Verified:
  `yarn typecheck` green; RLS e2e — admin sees all 3 seeded students, the counselor sees only
  their 2 assigned, and an unassigned student's row returns 0 rows to the counselor.

- **2026-07-09 — Universities search/filter + save/like (branch `feat/universities-directory`).**
  Enhanced `useUniversities(search)` + new `useUniversityPrograms` /
  `useMyUniversityInterests` (returns a Set) / `useToggleUniversityInterest`; a reusable
  `SaveUniversityButton`; the student Universities tab is now a stack — searchable list with
  per-card save toggle → detail screen (description, website via `Linking`, requirements,
  programs). No migration (tables + RLS already existed). Verified: `yarn typecheck` green;
  e2e via a student JWT — save → 201 + admin `university_interest` notification fired (1→2),
  unsave → 204 row removed.

- **2026-07-09 — Admin CRUD for counselors (branch `feat/admin-entity-crud`, commit
  `5c2ee44`).** Folded counselors into the existing student/high-school/university
  admin-entity CRUD pattern (create/edit/delete via the service-role `create-entity` /
  `delete-entity` Edge Functions). **Note:** this commit was left out of merged PR #1 (which
  stopped at `e8a2402`) — confirm it has landed in `master` before relying on it; if not, it
  needs its own PR/cherry-pick.

- **2026-07-09 — Documents upload / private Storage (branch `feat/document-upload`, off
  `master`).** Added the object store behind the pre-existing `documents` table +
  `documents_access` RLS. Migration `20260709000002`: a **private `documents` bucket** and a
  `storage.objects` FOR-ALL policy scoped to it that reuses
  `can_access_user(((storage.foldername(name))[1])::uuid)` — i.e. the object's leading
  `{user_id}` path segment is the owner, and the same predicate that guards the metadata row
  guards the file (owner / assigned counselor / admin). `@wrsi/api` `documents.ts`:
  `useDocumentTypes`, `useDocuments`, `useUploadDocument` (uploads then inserts the row;
  **removes the object if the row insert fails** so Storage doesn't orphan),
  `useDeleteDocument`, `useCreateDocumentSignedUrl` (60s TTL). Mobile `DocumentsScreen` picks
  a file (`expo-document-picker`), reads it via the SDK-56 `expo-file-system`
  **`File(uri).base64()`** API, decodes with `base64-arraybuffer`, uploads, and lists with
  open (signed URL → `Linking`) / delete. Also added a reusable `Button` `danger` variant.
  **New native deps (`expo-document-picker`, `expo-file-system`) mean the current dev build
  must be rebuilt (EAS) before the picker works on device** — JS-only iteration can't
  exercise it. **Verified against local Storage via the REST API:** bucket is private; a
  student uploads to their own `{id}/…` prefix (200) but is blocked from another user's
  prefix (403, RLS); `documents` row insert (201); signed-URL download returns the bytes
  (200); the student's **assigned counselor** sees the row while an **unrelated student** gets
  `[]` and a 403 on a foreign signed-URL; delete of object + row succeeds. `yarn typecheck`
  green; types regenerated.

- **2026-07-09 — Stray root `app.json`/`eas.json`/`tsconfig.json` broke EAS builds.**
  Untracked stub files at the monorepo root (wrong Android package id, generic `eas.json`
  defaults) made the repo root look like an Expo project, so `eas build` run from root ran
  `yarn expo prebuild` there instead of in `apps/mobile` — `expo` isn't a root dependency,
  hence `Couldn't find a script named "expo"`. Fix: deleted the three root strays (never
  committed). **Always run `eas build` from `apps/mobile`.**

- **2026-07-08 — Admin student management (CRUD) + role model refinement (branch
  `feat/counselor-students-crud`).** Product decisions locked: (a) **counselors keep
  operational writes** (status/notes/tasks on assigned students) but **cannot edit the
  student record** — `students_update` RLS tightened to admin-or-self (migration
  `20260708000002`); (b) the student **management feature is admin/super-admin only**; (c)
  admins get a **dedicated Admin section**. Implemented: `AuthContext` experience is now
  `admin | counselor | student` (was `staff | student`); `RootNavigator` routes admin →
  new `AdminNavigator` (tabbed, one tab per manageable table — Students today). New
  `student_directory` **security_invoker view** (migration `20260708000001`) joins counselor
  name + high-school name + latest status, inheriting RLS automatically (verified: counselor
  sees 2 assigned, admin sees 3, student sees own). API: `useStudentsList` (infinite-query,
  filterable), `useStudent`, `useUpdateStudent`, `useCounselors`, `useHighSchools`. UI:
  filterable/paginated `StudentsListScreen` (name search + counselor/high-school/status/grad-
  year/nationality/budget-range filters) → `StudentDetailScreen` (full record edit, admin can
  reassign counselor). Verified: RLS tests (counselor edit blocked, status write kept, admin
  edit allowed); typecheck green; 1016-module bundle. Follow-ups: counselors currently still
  see only the placeholder Students screen — their read-only student view is a separate task;
  program/state/program-type filters and the other admin tables (counselors/high-schools/
  universities CRUD) are next.

- **2026-07-07 — Relationship-integrity audit + polymorphic guards (branch
  `fix/relationship-integrity`).** User reported an apparently orphaned
  `user_roles.role_id` → verified live: **false alarm** — the row resolved to
  `super_admin`; 0 orphans anywhere; the schema's 77 FK constraints cover every real
  relationship (audited `information_schema` for `*_id` columns without FKs: only the
  intentionally polymorphic `comments/activities/audit_logs.entity_id` + the
  `special_partners.wrsi_id` business code). Likely cause: role ids regenerated by a
  `db reset` compared against a stale Studio view. Fixes shipped anyway: (1) roles now
  seed with **fixed uuids** (`…-4000-8000-000000000001..6`) so ids are identical across
  resets/environments; (2) migration `20260707000002`: polymorphic refs are now enforced
  like FKs — write-time triggers on `comments`/`activities` reject unknown entity types and
  missing targets, and delete triggers on the 6 target tables clean up polymorphic children
  (audit_logs deliberately excluded — audit records must survive entity deletion). Verified
  with 6 psql tests (fixed ids, reject orphan/typo, accept valid, cleanup cascade).

- **2026-07-07 — Onboarding back navigation (branch `fix/onboarding-back-navigation`).**
  Root cause: `RootNavigator` swaps its whole subtree by session state, so a fresh sign-up
  (email confirmation disabled locally) drops the user straight into `OnboardingScreen` with
  **no navigation stack** behind it — nothing for the phone's back button to pop. Fix: added
  a header control + wired `BackHandler` (Android hardware back) to the same
  `handleBack()` — steps backward through the wizard on steps 2–3, and on step 1 shows a
  confirm dialog then `signOut()` (which naturally routes back to Login via the existing auth
  state swap). Login → Sign-up itself already had working back navigation (native-stack
  default); the complaint was specifically about post-signup onboarding having none.
  Verified: typecheck green; 1012-module bundle.

- **2026-07-07 — Environments, seed data, countries, dial codes (branch
  `feat/environments-seed-data`).** (1) Explained/solved "my users disappeared": data
  persists across stop/start; `db reset` (needed per new migration) wipes it — so local dev
  now auto-seeds dummy data + login-able test accounts on every reset
  (`supabase/seeds/dev.sql`, lorem-ipsum flavored, wired via `config.toml` sql_paths;
  accounts in README). (2) `supabase/seeds/staging.sql` mirrors it with realistic fake names
  for the future hosted staging project (manual runbook in README); reference catalogs stay
  identical across envs in `seed.sql`. (3) Countries is now the full standard catalog
  (236 entries) with `name_es` + `calling_code` (migration `20260707000001`); country labels
  localize by app language. (4) New convention: every phone input is preceded by a dial-code
  selector; numbers stored as `+<code><digits>` — onboarding updated (phone_country_id +
  local number, composed at submit). (5) Fixed duplicate admin notifications from the
  interest trigger (per-role join → distinct). Verified: real GoTrue logins for seeded
  student + admin via curl; 236/236 countries with dial+es; typecheck green; 1012-module
  bundle. Pending user decisions: staging project hosting + admin CRUD scope (see questions
  in session notes).

- **2026-07-03 — Onboarding: all fields required + dual validation + pro inputs (migration
  `20260703000002`).** Product decision: every onboarding field is mandatory. Enforced in
  BOTH layers: Zod schema (i18n-keyed messages, per-step validation gates, submit jumps to
  the first invalid step) and a strict `complete_student_onboarding` RPC (required fields,
  phone normalization to `+`digits, birth-date 10–100y, grade 0–100, CEFR whitelist, intake
  year now→+6, non-empty passport/interest arrays; clear error messages). Table CHECK
  constraints stay NULL-tolerant so the Monday import isn't blocked. New `@wrsi/ui`
  components: `SearchSelect` / `SearchMultiSelect` (full-screen modal, accent-insensitive
  type-to-filter, selection-only) used for nationality/passports/countries-of-interest, and
  `DateField` (day/month/year dropdowns with real calendar validation) for birth date —
  deliberately pure-JS (no native date picker) so **no dev-build rebuild is needed**.
  Verified: 6 RPC validation tests via psql; typecheck green; bundle 1012 modules.
- **2026-07-03 — User/role management direction.** No self-serve or bootstrap flow for
  creating staff. Admins/super-admins will manage ALL user types (students, counselors,
  high schools, universities) through dedicated admin CRUD pages (e.g. `/students`,
  `/counselors`) built with the CRM milestone. Creating login-capable users requires the
  auth Admin API (service role), so those pages will call a **service-role Edge Function**
  — not a client RPC. The interim `assign_role`/`revoke_role` RPC migration was rejected
  and removed before being applied. Roles remain many-to-many (`user_roles`); signup only
  ever grants `student`.
- **2026-07-03 — Architecture review + security hardening (migration `20260703000001`).**
  Full re-audit of schema/RLS/decisions before feature buildout. Architecture held up (no
  structural changes); found and fixed at the policy/constraint level:
  (1) `comments` were readable by all authenticated users → entity-scoped read (comments on a
  student require `can_access_student`); (2) students could insert/edit their own
  `status_history` (+ `application_status_history`) → read stays, writes are staff-only
  (the onboarding RPC still works via SECURITY DEFINER); (3) students could reassign their own
  `counselor_id`/`user_id`/`high_school_id` → column-guard trigger (admin; counselor may fix
  prepa); (4) users could self-change `is_active`/`email` → guard trigger; (5) one-to-one
  booking allowed editing slot times and blocked cancelling → booking guard trigger (book
  free slot / cancel own only) + relaxed WITH CHECK; (6) workshop-overlap check was racy →
  per-student `pg_advisory_xact_lock`; (7) added hot-path indexes (`status_history(student_id,
  changed_at desc)`, `notifications(user_id, created_at desc)`, event/workshop reverse
  lookups). All verified via 11 psql RLS regression tests (T1–T11); types regenerated;
  typecheck green. Guards intentionally no-op for service contexts (`auth.uid() is null`) so
  imports/Edge Functions are unaffected.

- **2026-07-02 — Dev builds via EAS; local Windows build blocked.** Expo Go can't run SDK 56,
  so testing needs a dev build (added `expo-dev-client` + `eas.json`). Local `expo run:android`
  on the dev machine fails at the New-Arch C++ link: `ld.lld: undefined symbol` for libc++
  (`__cxa_pure_virtual`, `std::bad_alloc`) with a `CLANG_~1` short-name — caused by the **space
  in the repo path** (`C:\Users\Manuel Carretero\…`) + old bundled CMake 3.22.1 (NDK is correct:
  RN 0.85 pins 27.1.12297006, and the build used it). Decision: **use EAS cloud builds** as the
  primary path (Linux workers dodge the issue; also the only iOS option on Windows). Local
  fallback = clone to a space-free path like `C:\dev\wrsi` + newer CMake. Generated
  `apps/*/android` + `apps/*/ios` are now git-ignored (CNG regenerates them).
- **2026-07-02 — Monday migration analysis (planning only).** Analyzed two sample Monday
  exports (student leads + high schools). Key findings: subitems are inline sub-tables
  (leads subitems = university applications; HS subitems = service/plan lines); groups encode
  counselor + intake; multi-line quoted cells + UTF-8 mojibake; `Item ID` is the stable key.
  Surfaced ~11 schema gaps (need `monday_item_id` + `monday_raw jsonb`, budget-as-range +
  living budget, HE/SC service tracks, application offer/scholarship/deposit/credentials, HS
  email/estimated-students/city/tier). Full write-up + client questions in `docs/MIGRATION.md`.
- **2026-07-02 — Atlas integration (no code changes, planning only).** Client is in early
  talks with Atlas (vocational-orientation platform) about a hand-off: Atlas matches a
  student's profile, then an "international universities" action should surface WX Study's
  university directory. Recommendation (written into the plan file, not the Sept roadmap):
  build a one-off Supabase Edge Function (`supabase/functions/partner-directory/`) with its
  own `partner_api_keys` auth (not user JWT/RLS — current posture is zero `anon` grants and
  should stay that way), returning a small versioned (`api_version`) projection of matching
  universities/programs plus a deep-link/URL handoff — no student PII crosses the boundary.
  Explicitly **not** building a general partner SDK yet (one partner, no signed agreement);
  keep the naming/versioning generic so it's cheap to extract later if more partners commit.
  Full writeup + 4 open confirmation questions for Alejandro: see "Future: Partner
  Integration (Atlas)" section in the plan file.

## Key decisions (for context)

Custom build on Supabase; app-first (students + counselors in one Expo app for Sept, web
later); React Navigation (not Expo Router); themeable wrapped-component UI; hybrid auth
(import existing students + self-register new ones). Rationale in the plan file and in the
memory notes `wrsi-architecture-decisions` / `prefers-react-navigation`.
