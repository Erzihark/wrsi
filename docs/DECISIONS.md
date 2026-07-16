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

- **2026-07-09 — Country → State/Province cascade in the admin directory forms (branch
  `feat/geography-cascade-directory`).** The high-school and university admin forms used a
  single flat `state_province_id` picker listing every seeded state with no country filter;
  only the event form had the cascading picker. Extracted a reusable
  `apps/mobile/src/components/CountryStateSelect.tsx` and wired it into
  `HighSchoolDetailScreen` + `UniversityDetailScreen`. **Key difference from the event form:**
  those two tables have **no `country_id` column** (only `state_province_id`, whose row already
  carries its `country_id`), so the country is **UI-only** — the component derives the initial
  country from the persisted state, uses it to scope the state list, and clears the state when
  the country changes; only `state_province_id` is persisted (no schema/API change, `toPayload`
  untouched). It's self-contained (takes `countries`/`states` arrays + `value`/`onChange`) and
  derives the initial country synchronously in a `useState` initializer, which is safe because
  the `EntityDetailScreen` scaffold only renders fields once `optionsReady` (incl. `states`) is
  true. The event form keeps its own inline cascade for now since it also persists `country_id`
  (not a drop-in for the component). *Verified:* `yarn typecheck` green across all 7 packages;
  unit tests green; `states_provinces` confirmed seeded per country (US 51, MX 32, IT 20, …) so
  the picker has real options. Not yet exercised on a device/emulator (no local RN E2E harness).

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

- **2026-07-09 — Admin CRUD for students + high schools + universities + counselors; entities
  are login-backed (branch `feat/admin-entity-crud`, merged into `master` via `feat/testing-
  foundation`'s follow-on merge after being left out of PR #1).** Product/architecture decision
  (with the user): all four admin-managed entities are first-class **login-capable accounts**.
  Students already required a login; **high schools and universities now do too** — migration
  `20260709000001` makes `high_schools.user_id` / `universities.user_id` **NOT NULL** and
  switches their FK to **ON DELETE CASCADE** (matching `students`), giving one uniform
  create/delete path. Because the client can't create/delete auth users, **create + delete go
  through two service-role Edge Functions** (`supabase/functions/create-entity`,
  `delete-entity`, sharing `_shared/{cors,admin-guard,entities}.ts`): create provisions the
  auth user (the signup trigger grants `student`; the function swaps it for
  `high_school`/`university`/`counselor` where needed), inserts the row from a per-entity
  column allow-list, and **rolls back the auth user if the insert fails**; delete removes the
  auth user so the cascade cleans up. **List/read/update stay client-side** (RLS already
  admin-gated). UI is DRY: generic `EntityDetailScreen` (form state, create-vs-edit save,
  delete-with-confirm, create-mode email/temp-password inputs) + `EntityListScreen` scaffolds,
  with a thin per-entity `renderFields`/config. `AdminNavigator` gained Students / High Schools
  / Universities tabs; `@wrsi/api` gained `useCreateEntity`/`useDeleteEntity`, HS/uni
  list+get+update, `useStatuses`/`useStatesProvinces`/`useEducationModels`.
  **Counselors** (commit `5c2ee44`, originally left out of the merged PR #1 which stopped at
  `e8a2402`) were folded into the same pattern with **no migration needed**
  (`counselors.user_id` was already `NOT NULL UNIQUE` + `ON DELETE CASCADE`, and
  `counselors_admin_write` RLS already allowed `is_admin()` writes): added `'counselor'` to the
  Edge Function `ENTITY_CONFIG` + client `EntityType`, `useCounselorsList`/`useCounselor`/
  `useUpdateCounselor` in `directory.ts`, a Counselors tab, and `CounselorsListScreen`/
  `CounselorDetailScreen` (name + phone) on the same scaffolds.
  **Verified:** `db reset` applies the migration on empty tables; types regenerated (HS/uni
  `user_id` now non-null); `yarn typecheck` green; Edge Functions exercised via curl — 403 for
  a non-admin, 201 create for all four types with the correct single role (no leftover
  `student` grant), clean duplicate-email error, orphan-user rollback on a failed insert, and
  delete cascading the row + auth user. **Note:** Edge Functions are a dev-loop dependency —
  run `yarn supabase functions serve` locally (`deploy` for staging). Seeds provision portal
  logins for the seeded HS/universities (`highschool{1,2}@`, `university{1,2}@`, same
  passwords).

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

## 2026-07-09 — Testing foundation (unit + backend + E2E scaffold + CI)

Introduced automated testing where there was none (both `lint` and `test` were no-op Turbo
tasks). Branched `feat/testing-foundation` off `master`, so events-specific API/E2E coverage is
deferred until `feat/student-events` merges (the events schema is on `master`, but `events.ts`
hooks and the event screens are not).

**Tooling choices.** *Vitest* for unit + backend (fast, ESM/TS-native, fits Yarn 4). *Maestro*
for mobile E2E (Expo-recommended; drives the real dev build, so native modules like the
document picker and secure store work — a web/Playwright route was rejected because
`react-native-web`/`react-dom` aren't wired and native modules wouldn't run). *GitHub Actions*
for CI.

**Layers.**
1. **Unit** — co-located `*.test.ts` in `packages/shared-utils` + `packages/api` (Vitest, node
   env). Extracted the copy-pasted PostgREST search-sanitize regex from `hooks.ts` /
   `students.ts` into a single tested `sanitizeSearchTerm` in `@wrsi/shared-utils` (behavior
   preserved; added a `@wrsi/api → @wrsi/shared-utils` dep). Also test the `queryKeys` factory
   and exported `functionErrorMessage` (Edge Function error unwrapping).
2. **Backend integration/security/edge** — new `@wrsi/backend-tests` workspace (`tests/backend`,
   added `tests/*` to root workspaces). Signs in as the seeded `dev.sql` accounts and hits a
   live local stack. Kept out of the default `yarn test` (it needs Docker) via a `test:integration`
   script invoked through the root `test:backend`. Helpers build anon/service/authed clients
   directly with `@supabase/supabase-js` (not `createWrsiClient`) to avoid pulling the
   React-flavored `@wrsi/api` barrel into a Node process. Covers per-role RLS visibility
   (incl. the `student3`-has-no-counselor negative and the point that a `user_roles` JWT claim
   can't be leveraged for DB access), the student-record write guards, owner-portal writes, the
   workshop-overlap trigger, `complete_student_onboarding` validation, and the
   `create-entity`/`delete-entity` Edge Functions (401 / non-admin / role-swap+cascade /
   duplicate-email). *Verified:* full suite green against the live stack — 19 backend tests
   (6 integration, 9 security, 4 edge) + 17 unit tests; whole monorepo typechecks.
3. **Mobile E2E** — `.maestro/` flows (app id `com.wxstudy.wrsi`). Added stable `testID`s
   (login fields/submit, role tab buttons via `tabBarButtonTestID`, onboarding screen) and made
   `@wrsi/ui` `Screen` forward props in scroll mode so `testID` threads through. Runnable flows:
   login-per-role landing + the onboarding gate. Not runnable in this environment (needs an
   emulator + dev build); deeper flows are a documented follow-up.

**CI** (`.github/workflows/ci.yml`): `checks` job (typecheck + `yarn test`) and `backend` job
(`supabase start` + `db reset` + `functions serve` + `test:backend`, keys exported from
`supabase status -o env`) gate every push/PR. Maestro E2E is intentionally not in CI yet
(emulator + build cost).

**Local demo keys gotcha.** The current Supabase CLI's local anon/service JWTs differ from the
older "classic" demo keys; `tests/backend/helpers/env.ts` uses the current ones as fallback and
honors `SUPABASE_*` env overrides (which CI sets from `supabase status`).

**Process.** Testing is now part of "done" — see the new "Testing (REQUIRED)" section in
`CLAUDE.md` and the full [`docs/TESTING.md`](TESTING.md) guide.

## 2026-07-10 — Confirmation dialogs + toast feedback (reusable UI)

Branched `feat/confirm-dialogs-and-toasts` off `master`. Two problems: (1) destructive actions
were inconsistently guarded — entity/document deletes had a native `Alert.alert` confirm, but
event/workshop unregister and 1:1 cancel had none; (2) action feedback was clunky blocking
`Alert.alert('Saved')` popups, and toggles/creates gave no confirmation at all, so the app felt
unresponsive.

**Two reusable, token-driven `@wrsi/ui` primitives, mounted once in `AppProviders`:**
- **`ToastProvider` + `useToast()`** — an animated, auto-dismissing (3s), tappable-to-dismiss
  toast reporting `success` / `error` / `info`. Non-blocking, unlike a native Alert.
- **`ConfirmProvider` + `useConfirm()`** — a themed modal returning `Promise<boolean>`, replacing
  ad-hoc native `Alert.alert(...)` confirms with one restyleable surface.

Both derive entirely from `tokens.ts` and take their **text from the caller** (where i18n `t` is
in scope), keeping `@wrsi/ui` decoupled from `@wrsi/i18n` — the same pattern `OptionPickerModal`
already uses. Provider order: `ThemeProvider > ConfirmProvider > ToastProvider > AuthProvider`,
so every screen (incl. onboarding/auth) can use them and both can read the theme; `SafeAreaProvider`
stays outermost for the toast's safe-area inset.

**What gets confirmed** (destructive / gives up a spot): delete student·high-school·university·
counselor·event, delete document, unregister from an event, unregister from a workshop, cancel a
1:1 booking, remove a university/workshop/1:1 slot from an event (admin), and the onboarding
exit-and-sign-out. **What does not** (opt-in, instantly reversible, already has visual state):
register/book, save/unsave a university, save an event note.

**One deliberate exception to "toast, don't Alert":** the admin create-account flow still uses a
blocking `Alert.alert` to show the generated password — a toast auto-dismisses before the admin
can copy the credentials. Auth login/sign-up error alerts were also left as native Alerts (out of
scope for this entity-action branch).

*Verified:* `yarn typecheck` (7/7 workspaces, incl. i18n es/en key-parity enforcement) and
`yarn test` (unit) pass. No backend/RLS/Edge surface touched, so `test:backend` not required. The
interactive confirm/toast flows still need an on-device/emulator pass (Maestro is local-only) —
a documented follow-up, along with adding a component test harness for `@wrsi/ui`.

- **2026-07-10 — Fix: newly-created directory rows didn't appear in admin lists until a full
  app reload (branch `fix/high-school-dropdown-stale-cache`).** Reported for high schools:
  create one → return to the High Schools tab → it isn't there → only a full Expo/JS reload
  shows it. **Root cause (the real one — an earlier pass misdiagnosed this as list-fine /
  dropdown-only):** every admin section is a native stack `List → Detail`. Pushing the create
  `Detail` screen keeps the `List` screen *mounted* underneath (react-navigation native-stack +
  react-native-screens freeze), so `goBack()` never remounts it — `refetchOnMount` never fires,
  and the `useCreateEntity` `onSuccess` `invalidateQueries` on a frozen/detached screen isn't
  reliably reflected. Net effect: the list keeps showing stale data until the whole JS bundle
  reloads. This affected **all** admin CRUD lists (students, high schools, universities,
  counselors, events) equally — the same List→Detail shape — not just high schools; the
  reporter's "universities seemed fine" was luck of timing, not different code. **Fix:** added
  `apps/mobile/src/lib/useRefetchOnFocus.ts` (refetches on `useFocusEffect`, skipping the first
  focus so we don't double-fetch on mount) and applied it to all five admin list screens. Screen
  *focus* is a navigation event independent of mount/freeze, so returning from any create/edit/
  delete now refetches the list. **Also fixed a real second bug found along the way:**
  `useHighSchools()` (`packages/api/src/lookups.ts`, the "assign high school" dropdown on student
  screens, which you *don't* navigate back to so focus-refetch can't help it) keyed under
  `queryKeys.lookup('high_schools')` — a different top-level key than the
  `queryKeys.highSchools()` that `useCreateEntity`/`useUpdateHighSchool`/`useDeleteEntity`
  invalidate — so that dropdown stayed stale up to an hour (`ONE_HOUR` staleTime). Pointed it at
  `queryKeys.highSchools()` (mirroring how `useCounselors()` shares `queryKeys.lookup('counselors')`
  with its admin list) and added a `'list'` segment to `useHighSchoolsList`'s key so the two
  don't collide. Audited universities/counselors/students for the same split-key pattern — none
  found. **Tests:** `packages/api/src/directory.test.ts` calls the real hooks (mocked
  `useQuery`/`useSupabase`) and asserts `listKey(entityType)` is a valid TanStack partial-match
  prefix of both the admin-list and lookup-hook keys for all three admin-managed lookup entities
  (guards the dropdown key contract). `.maestro/admin/high-school-create.yaml` drives the real
  UX: admin logs in, creates a high school, and asserts it's visible in the list with no reload —
  the flow that reproduces the reported bug (needs added `testID`s on the tab/add/email/name/
  submit controls). *Verified:* `yarn typecheck` (all 9 packages) + `yarn test` (unit) green;
  the dropdown-key regression was confirmed to fail the unit test when reintroduced. The
  focus-refetch fix and the Maestro flow are **not** yet run on-device (no local emulator/dev
  build in this session) — Maestro is local-only; that on-device pass is the remaining
  verification step.

## 2026-07-10 — Form validation standard (RHF + zod, phone & URL)

Branched `feat/form-validation-standards` off `master`. The forms had drifted into three
different validation styles: onboarding used react-hook-form + zod with per-field errors; the
admin entity forms used a homegrown `validate() → string` that fired a single toast **on submit
only**; the event form used a homegrown error-map, also submit-only. No form disabled its
submit button while invalid. Phone was a bare, unvalidated text box everywhere except
onboarding (which only had a loose `6–12 digits` check and no formatting); URL fields
(`website`, `logo_url`) were entirely unchecked.

**Decision (all three "recommended" options, confirmed with the user):** unify on
**react-hook-form + zod** as the single standard; use **`libphonenumber-js`** for real
per-country phone validity + as-you-type formatting; roll out to **every** form.

**Shared foundation:**
- `@wrsi/shared-utils/validation.ts` — pure predicates (`isEmail`/`isWebUrl`/`isImageUrl`,
  image URL requires an image extension), phone helpers (`makePhoneValue`/`parsePhone`/
  `formatPhoneAsYouType`, `PhoneValue` state shape), and reusable zod builders
  (`requiredString`, `emailField`, `webUrlField`, `imageUrlField`, `numericField`,
  `phoneField`/`phoneFieldOptional`). Unit-tested (`validation.test.ts`, 11 cases).
- `@wrsi/ui` `PhoneField` — dial-code dropdown (reuses `OptionPickerModal`) + a number input
  that formats as-you-type and emits a `PhoneValue` carrying E.164 + `isValid`.
- `apps/mobile/src/components/form` — RHF-bound wrappers (`FormInput`, `FormSelect`,
  `FormSearchSelect`, `FormMultiSelect`, `FormSearchMultiSelect`, `FormDateField`,
  `FormPhoneField`) that own the `Controller` binding + i18n error translation.
- `docs/VALIDATION.md` — the written standard + a new-form checklist.

**Rollout:** `EntityDetailScreen` reworked onto RHF (owns the profile form + a credentials
sub-form; submit disabled until both valid). University/Counselor/High School/Student forms now
declare zod schemas and render via the wrappers; Counselor/High School/Student gained the
dial-code phone dropdown they lacked, and University `website`/`logo_url` now validate as
URL/image-URL. Onboarding adopted `PhoneField` (persists composed E.164) with a gated submit.
The event main form moved to RHF; its workshop/1:1 slot adders now disable the Add button live.
Login/SignUp validate email (and sign-up password length) with gated submit.

**Bug fixed in passing:** the edit-mode `form.reset` seeding in `EntityDetailScreen` /
`EventDetailScreen` is now guarded by a ref — `initialForm`/`record.data` change identity on
re-render/refetch, so an unguarded effect would reset the form and wipe in-progress edits.

**Flag icons on the phone extension selector (same branch, follow-up).** Added a `CountryFlag`
to the `PhoneField` dial-code trigger + each picker row. Rejected two approaches: **flag emoji**
(don't render on most Android system fonts — this also prompted the new "iOS + Android parity"
rule in CLAUDE.md, committed to `master`), and **`react-native-country-flag`** (turned out to
fetch from `flagcdn.com` at runtime — an external-service coupling, no offline). Chose
**bundled SVG**: a `CountryFlag` primitive in `@wrsi/ui` using `country-flag-icons`
(`string/3x2` SVG strings) + `react-native-svg`, rendering offline with no third-party request.
`OptionPickerModal` gained an optional `renderLeading(value)` slot (existing callers untouched).
*Trade-off:* `react-native-svg` is a native module, so a **new EAS dev build is required** before
flags render on device.

*Verified:* `yarn turbo run typecheck` (all packages) + `yarn turbo run test` (unit) green;
new phone/URL/email logic covered by `shared-utils` unit tests; confirmed all **235** seed
countries resolve to a bundled flag (no blanks). **Not** run: the mobile emulator / Maestro E2E
layer (no local dev build in this session) — that on-device pass (PhoneField interaction,
disabled-submit behavior, and the SVG flags, which need the react-native-svg dev build) is the
remaining verification step.

## 2026-07-10 — Platform-parity audit (branch `fix/android-ios-parity-audit`)

**Context:** the flag-emoji incident (see the validation entry above) produced the CLAUDE.md
"iOS + Android parity" rule; this pass audited the whole codebase for the same class of
problems. Checked: Unicode/emoji glyphs in UI strings, `shadow*` vs `elevation`, keyboard
handling, date/time/file pickers, platform-only APIs (`ActionSheetIOS`, haptics, blur), and
`Platform.OS` branches (there were none).

**Found + fixed (2 real issues):**

1. **iOS keyboard covered inputs on scrollable forms.** `Screen` had no keyboard handling;
   Android was fine only because Expo defaults `softwareKeyboardLayoutMode` to `resize`
   (window shrinks, focused field scrolls into view), while iOS never resizes — on long forms
   (onboarding, admin entity/event forms) the keyboard hid the lower fields. Fix: the scroll
   variant of `Screen` now sets `automaticallyAdjustKeyboardInsets` on iOS (the iOS-native
   ScrollView mechanism; explicit no-op on Android where `adjustResize` already handles it) —
   each OS uses its own standard per the parity rule. Non-scroll screens keep inputs near the
   top (login/sign-up, list search bars) and needed no change.
2. **Glyphs with emoji variants in UI text.** `♥`/`♡` (U+2665/U+2661) were baked into the
   `universities.save`/`saved` i18n strings, and Toast's info icon was `ℹ` (U+2139). These
   have Unicode *emoji* presentation variants, so Android's font fallback routes them to the
   color-emoji font on many devices — they render as colored emoji that ignore the text color
   (and differ from iOS). Same failure class as the flag emoji. Fix: new bundled SVG icon set
   `packages/ui/src/components/icons.tsx` (`CheckIcon`/`CloseIcon`/`InfoIcon`/`HeartIcon`,
   `react-native-svg` — already a dep, so **no new dev build needed**). Toast now renders SVG
   icons for all three types; `Button` gained an optional `icon(color)` render prop (receives
   the variant's foreground color) and `SaveUniversityButton` passes a filled/outline
   `HeartIcon`, with the hearts stripped from both locales (presentation no longer lives in
   translation strings).

**Verified safe (no action):** text-presentation-only symbols `✓ ✕ ▾ ▸ ‹ · … —` (no emoji
variant; covered by both platforms' text fonts) — kept in `OptionPickerModal`, selects, chips,
and list separators. Toast already paired iOS `shadow*` with Android `elevation`; `DateField`/
`TimeField` are custom cross-platform dropdowns (no native picker divergence);
`expo-document-picker` + `Linking.openURL` are cross-platform. **The working rule:** a glyph in
UI text is safe only if it has no emoji variant; anything heart/info/flag-like becomes a
bundled SVG in `packages/ui/src/components/icons.tsx`.

*Verified:* `yarn typecheck` (7 packages) + `yarn test` (31 unit tests) green. **Not** run:
on-device iOS/Android passes (no dev build in this session) — the keyboard-inset behavior on
an iOS device and the SVG icon rendering on both platforms are the remaining verification.

## 2026-07-12 — Admin high-school CRUD E2E, device-verified (branch `test/expand-e2e-coverage`)

Expanded the Maestro slice from create-only to the full admin high-school **create / edit /
delete** cycle, and — for the first time — **ran the flows on a physical Android device against
the live local Supabase stack**. What shipped:

- New flows `.maestro/admin/high-school-{edit,delete}.yaml` (create was already there), each
  self-contained (creates its own row) and each guarding the stale-list focus-refetch on its
  path. Delete also exercises the `ConfirmProvider` dialog + the delete-entity Edge Function.
- Supporting `testID`s (reusable, not locale-fragile text): `confirm-dialog-{confirm,cancel}`
  on the shared `ConfirmDialog`, `entity-delete` on `EntityDetailScreen`, generic
  `searchTestID`/`editTestID` on `EntityListScreen` (wired into `HighSchoolsListScreen`), and
  `highschool-contact-first-input` (added during device verification — see below).

**Device-run conventions discovered** (each was a real failure on the device, now baked into the
flows + documented in TESTING.md):
1. *Long form* — `entity-submit`/`entity-delete` sit below the fold; `tapOn` doesn't auto-scroll,
   so the flows `scrollUntilVisible` first.
2. *RHF onTouched gating* — the submit button stays disabled until a field blurs; adb `inputText`
   + `hideKeyboard` don't fire a blur, so the flows tap another field to trigger validation.
3. *Pre-filled text is unreliable to edit* — tapping a populated field lands the cursor
   mid-string, so both append and erase corrupt the value (observed: `E2E Editada
   178388440898208982`). The edit flow now sets the **empty** contact first name and verifies it
   in the list subtitle instead of mutating the name.

**Environment (Windows) — how it was run, for reproducibility:** Maestro CLI runs in WSL2
(Ubuntu-20.04 had to be converted from WSL1). The physical phone is an OPPO/ColorOS device: adb
`pm clear` (Maestro's `clearState`) is blocked until ColorOS Developer Options → "Disable
permission monitoring" is enabled. WSL2→Windows-host networking was blocked (a Bitdefender
uninstall left the Windows Firewall rule store corrupted — `netsh advfirewall reset` + reboot were
the user's fix). We sidestepped host networking entirely with **adb over WiFi for Maestro control
+ `adb reverse` over USB** to tunnel Metro (8081) and Supabase (54321) to the phone's `localhost`;
`apps/mobile/.env` was pointed at `http://localhost:54321` for the run and restored afterward.
Because the installed build is a **dev client** (clearState → Expo launcher), the on-device run
used `openLink: wrsi://expo-development-client/?url=http://localhost:8081` in place of the flows'
`launchApp: clearState` + login preamble (session persists across JS reloads → lands logged-in).

**Verification:** `yarn typecheck` + `yarn test` green. The full create→edit→delete cycle **passed
end-to-end on the physical device** (every step COMPLETED, incl. the confirm dialog and the
stale-list refetch on all three paths). The committed flows keep the `launchApp: clearState` +
login preamble for a standalone/preview build (CI/emulator); that exact preamble was **not** run
on the dev build (clearState is incompatible with it), though its two halves were verified
separately (the `login-*` flows pass; the CRUD body passed via `openLink`).

## 2026-07-12 — API documentation + "API changes" workflow rules (branch `docs/api-documentation`)

Groundwork for the API-change wave expected once the app designer delivers: agent-first API
docs + a binding checklist. The project has **no hand-written REST server** (PostgREST + RLS
via `@wrsi/api` hooks, 2 Edge Functions, 2 client-called RPCs), so "API docs" here means:

- **`docs/API.md`** — a hand-maintained **contract index**: one table row per exported hook
  (operation, cache key/invalidations, auth & RLS) per domain file, mirroring
  `packages/api/src`. Behavior prose deliberately stays in each hook's JSDoc — API.md rows
  are what an agent reads to plan a change without opening every file.
- **`docs/openapi.yaml`** — hand-authored OpenAPI 3.1 for the hand-written surface only
  (`create-entity`, `delete-entity`, `complete_student_onboarding`, `is_admin`). Explicitly
  **not** a snapshot of the generated 48-table PostgREST spec — RLS + generated types are
  the source of truth there, and the snapshot would be churn-heavy noise.
- **Scalar rendering with zero committed deps** — `yarn docs:api` runs `yarn dlx serve docs`;
  `docs/api-reference.html` loads the `@scalar/api-reference` CDN bundle against the local
  `openapi.yaml`. Chose this over `@scalar/cli` because the CLI (both v2 and v1.9.9)
  requires Node ≥ 24 and this environment runs Node 22; over TypeDoc/codegen because a
  dependency-free markdown index can hold the cross-cutting columns (invalidation graph,
  RLS) generated output can't.
- **Sync gate as a unit test, not CI plumbing** — `packages/api/src/docs-coverage.test.ts`
  asserts every `export function use*` in the domain files appears in `docs/API.md`; runs in
  the existing `yarn test` layer CI already gates. Presence-only by design (content
  freshness is the checklist's job) so the gate can't flake.
- **CLAUDE.md "API changes (REQUIRED)"** — the ordered checklist for any data-layer change:
  migration → `db reset` → `gen:types` → hook + JSDoc (keys via `queryKeys.ts`, mutations
  invalidate) → API.md row (+ openapi.yaml if Edge/RPC) → `tests/backend` → run layers →
  PROGRESS/DECISIONS.

**Verification:** `yarn typecheck` + `yarn test` green (docs-coverage adds 10 tests covering
all 62 hooks across 9 domain files). Scalar page served and rendered: sidebar shows both
Edge Function operations, the rpc group, and Models with no spec-parse errors.
`yarn test:backend` not run — no DB/API behavior changed (docs + a filesystem-only unit test).

## 2026-07-16 — Student-home redesign, PR 1: backend/data layer (branch `feat/student-home-backend`)

The designer's first page (student dashboard, orange brand) arrived. Implementation is split
into 4 sequential PRs: **(1) backend/API** (this) → (2) UI kit (orange tokens, icons,
ProgressBar/Ring/Avatar/Carousel) → (3) nav restructure + Home/Notifications/Counselor
screens → (4) Profile/Applications screens + photo upload. Full plan:
`~/.claude/plans/i-finally-was-given-snappy-charm.md`.

**Schema (`20260716000001_student_home.sql`, `…02_avatars_storage.sql`):**

- `events` + `image_url text` (admin pastes a URL — mirrors `universities.logo_url`; no
  upload flow yet), `start_time`/`end_time time` (day schedule, independent of the multi-day
  date range), and `location` formalized (column comment) as the **venue name** — the column
  existed but was unpopulated since events moved to structured geography.
- `students.photo_url` + `counselors.photo_url`, backed by a **public `avatars` bucket**
  (`{owner_user_id}/avatar-{ts}.{ext}`; writes: own folder or admin; public read).
  **Privacy tradeoff, decided:** avatars are display-everywhere images so a public bucket
  keeps rendering trivial (`getPublicUrl`, no signed-URL churn); anyone with the exact URL
  can view, mitigated by the unguessable uuid path prefix. Signed-URL hardening logged as a
  follow-up if the client wants it.
- **New RPC `update_student_profile`** — post-onboarding profile editing. Clone of
  `complete_student_onboarding` **including its full validation block** (all fields stay
  required — an edit can't blank what onboarding required) but UPDATE-only and with **no
  lifecycle side effects**: no `status_history` append (reusing the onboarding RPC for edits
  would regress the student's journey back to "Onboarding" on every save) and
  `onboarding_completed_at` untouched. The validation duplication is deliberate: applied
  migrations are immutable, so the shared block can't be factored out; the backend test pins
  the behavior.

**"Evento principal" decision:** no `is_featured` flag — the dashboard's card is "Tu próximo
evento", so the *soonest upcoming event* (end_date ?? start_date ≥ today) is the principal
one, computed by `selectNextUpcomingEvent` in `@wrsi/shared-utils` (unit-tested). Revisit
with a flag only if the client asks for editorial control.

**Hooks (`@wrsi/api`)** — all documented in API.md (docs-coverage green): `useMyCounselor`
(embed via `students.counselor_id`), `useMyApplications` (first hooks over the existing
`student_applications` table; read-only, staff manage applications),
`useUnreadNotificationsCount` (`head:true` count for the bell badge) +
`useMarkNotificationRead`/`useMarkAllNotificationsRead` (owner-only via RLS),
`useUploadMyAvatar`/`useUploadCounselorPhoto` (upload + `photo_url` persist, object removed
on row-update failure — same orphan-protection pattern as documents),
`useUpdateMyStudentProfile` + `useMyStudentInterestSelections` (edit-form prefill).
`queryKeys` additions: `myCounselor`, `myApplications`, `notificationsUnread` (leaf under the
`notifications` base so one invalidation refreshes list + badge), `myInterestSelections`.

**Shared-utils dashboard helpers** (all pure + unit-tested): `computeProfileCompletion`
(6 fixed profile *sections*, matching the mockup's "X de 6"), `computeJourneyProgress`
(percent/current/next/remaining over the ordered status catalog), `formatEventDateBadge` +
`formatTime12h/Range` (hand-rolled es/en month/weekday maps — Hermes `Intl` locale data is
incomplete; dates parsed as UTC to avoid off-by-one-day), `timeOfDayKey`, `waChatUrl`
(libphonenumber → digits-only `wa.me` link, `MX` default country for numbers stored without
`+`; null → caller hides the CTA).

**Admin event form** gained venue / image URL (validated `imageUrlField`) / start-end time
fields (new `FormTimeField` RHF wrapper in `apps/mobile/src/components/form`).

**Verified:** `supabase db reset` clean · `yarn typecheck` · `yarn test` (69 unit, incl.
docs-coverage) · `yarn test:backend` (62, incl. 19 new: applications RLS scoping,
notifications owner-only mark-read + scoped unread count, avatars bucket policies
(own-folder ok / foreign folder blocked / admin ok / public URL fetch 200), events new
columns admin-write/student-read, and the RPC's no-status-append + validation + no-profile
+ unauthenticated paths). No UI change in this PR, so no device pass.

## 2026-07-16 — Student-home redesign, PR 3: navigation + the designed dashboard (branch `feat/student-home`)

**Tabs are now the designed five** — Inicio / Universidades / Eventos / Consejero / Mi perfil.
Documents left the tab bar for the Home stack (the design gives it a quick-access tile, not a
tab). Tab param lists use `NavigatorScreenParams` so cross-tab jumps stay type-safe (the event
card → `navigate('Events', { screen: 'EventDetail', … })`).

**Header ownership / the Log-out move.** `AppHeader` (brand + the app's only Log out) used to
sit above *every* signed-in experience, with `RootNavigator` zeroing the top safe-area inset for
the navigator beneath it. The design replaces it for students with `StudentHeader`, so:
- `RootNavigator` now wraps only admin/counselor in `AppHeaderShell` (the header + inset-zeroing
  contract, extracted so both shells share it). Students render unwrapped, keeping **real**
  insets.
- Because the real top inset now reaches the student navigators, *something* must consume it or
  content renders under the status bar. Inicio hides its tab header (its stack supplies
  `StudentHeader`, which consumes the inset itself); **every other student tab keeps its tab
  header**, which handles the inset for free. This is why the redesign didn't blanket-set
  `headerShown: false`.
- Log out moved to the Profile tab. The onboarding wizard keeps `AppHeader` — before the tabs
  exist it's the only way out.

**`StudentHeader` is presentational.** Navigation is injected by the Home stack's `header`
option from the `navigation` object the navigator passes it. React Navigation documents that
prop as the contract for custom headers; `useNavigation()` inside a header is not documented,
and this PR couldn't be exercised on a device, so we took the guaranteed path.

**No i18next pluralization.** "Faltan N pasos" picks between `remainingOne`/`remaining` in code
rather than i18next's `_one`/`_other` suffixes: those need `Intl.PluralRules`, which Hermes
doesn't reliably ship, there's no polyfill in the app, and the repo has no plural precedent —
the same reasoning that made the month/weekday maps in `shared-utils` hand-rolled.

**Applications shipped here, not in PR 4** (a plan deviation): `useMyApplications` already
existed from PR 1, and routing the "My Apps" tile to a placeholder would have been churn. PR 4
is now Profile + photos + the second design's new fields.

**Review catch worth recording:** the quick-access tiles were content-sized in a
`space-between` row. React Native defaults `flexShrink` to **0**, so the four translated labels
(~355px) would have overflowed a 343px content width and clipped the last tile — `numberOfLines`
never triggers because nothing constrains the Text width. Fixed with `flex: 1` per tile.

**Verified:** `yarn typecheck` + `yarn test` (69 unit) green. **Not exercised on device** —
this box can't run a local Expo build; `.maestro/student/dashboard.yaml` covers the flow when
the rig is available. Existing flows were updated off the retired `student-tab-dashboard` testID.

## 2026-07-16 — Student-home redesign, PR 2: UI kit + orange brand (branch `feat/ui-brand-foundation`)

`packages/ui`-only, no behavior/screen changes — the visual foundation PR 3/4 consume.

**Brand recolor is app-wide, by design.** `tokens.color.primary` `#4f46e5` → **`#f97316`**;
added `primaryDark #ea580c` and `primarySoft #fff7ed`. Because every experience reads
`t.color.primary`, this restyles auth, admin, and counselor screens too — that's the intended
one-file design-swap the tokens file was built for, not a regression. Contrast note: white on
`#f97316` is ~2.8:1 (fine for large CTAs, too low for small text), so `primaryDark` is the
token for pressed states and small text on white; `primarySoft` backs badges/selected rows/
icon-tile squares.

**New primitives** (all themed via `useTheme`): `ProgressBar` (journey bar), `ProgressRing`
(svg arc from 12 o'clock, centered content slot — the completion ring), `Avatar` (remote photo
with 2-letter initials fallback on `primarySoft` + a corner badge slot for the camera/WhatsApp
overlays), `IconTile` (quick-access tile), `Carousel` (paging `ScrollView` + dot indicators;
page width measured via `onLayout` not `Dimensions`, so it's correct inside padded containers;
no new dependency, identical on both platforms), `SectionHeader` (title + optional "Ver todos ›").

**18 new SVG icons** added to `icons.tsx` following the existing stroke convention (1.75
stroke, rounded caps): Home, Bell, Person, ChevronRight, ArrowLeft, Calendar, Clock, MapPin,
GraduationCap, FileText, Folder, Camera, Play, Shield, Mail, Users, Book, Target, Chat, plus
solid-fill brand marks WhatsApp/Instagram/TikTok/LinkedIn/YouTube. Rationale unchanged from the
parity audit: glyphs with emoji variants render as color emoji on Android, so every icon is a
bundled SVG that honors `color`.

**Verified:** `yarn typecheck` green across all packages incl. `@wrsi/mobile` (the recolor
touched no types — colors are referenced by token key). **Not exercised on device**: nothing
in the app renders these components yet (PR 3 mounts them), and this box can't run a local
Expo build (repo path has a space; EAS dev build needed). On-device visual check happens when
PR 3 wires the components into the dashboard.

## Key decisions (for context)

Custom build on Supabase; app-first (students + counselors in one Expo app for Sept, web
later); React Navigation (not Expo Router); themeable wrapped-component UI; hybrid auth
(import existing students + self-register new ones). Rationale in the plan file and in the
memory notes `wrsi-architecture-decisions` / `prefers-react-navigation`.
