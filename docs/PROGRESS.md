# Progress & Handoff Log

> Purpose: let anyone (or a fresh AI agent) resume work without re-deriving context.
> **Update this file at the end of every working session.** Newest status at the top.

**Last updated:** 2026-07-09
**Current phase:** Phase 1 (MVP) — foundation + onboarding/dashboard + admin student CRUD +
documents upload done.

**Client requirements (read this first if context was cleared):** `docs/REQUIREMENTS.md` —
the original client brief, feature list, and their phased roadmap, preserved separately from
our engineering decisions.
**Full plan:** `~/.claude/plans/i-am-building-this-sunny-lynx.md` (architecture + roadmap).

---

## TL;DR — where we are

Foundation, **student onboarding + dashboard**, and **admin student management (CRUD)** are
built, verified, and committed to `master`. A new student is routed through a 3-step
onboarding wizard (all fields required, search-select/date pickers, dial-code phone) that
writes their profile atomically via an RPC, then lands on a dashboard showing their current
lifecycle status + progress timeline (live via Realtime) and pending tasks. Admins/
super-admins have a dedicated Admin section to search/filter/edit student records; counselors
have read-only-on-the-record access (they keep status/notes/tasks writes) via their own
screen (still a placeholder pending their dedicated read-only student view). Local dev now
auto-seeds realistic dummy data + login-able test accounts on every `db reset`. Admins now
have full CRUD (create/edit/delete) for **students, high schools, and universities** — all
provisioned as login-capable accounts via service-role Edge Functions. Next up:
**documents upload** (Storage), then **universities search/filter + save/like**, then the
**counselor's read-only student view** and **admin CRUD for counselors**.

## Done (verified)

Two commits on `master`:
- `2276c44` — Establish Supabase backend and monorepo foundation
- `74c753e` — Add shared packages and the mobile app shell

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

## How to run / verify (quick)

```bash
yarn install
yarn supabase start                 # needs Docker Desktop
yarn typecheck                      # all workspaces should pass
cd apps/mobile && cp .env.example .env   # fill from `yarn supabase status`
yarn workspace @wrsi/mobile start
```
Local Supabase Studio: http://127.0.0.1:54323 · API: http://127.0.0.1:54321

## Environment gotchas

- **Node:** must be **≥ 20.19.4** for Expo SDK 56. (Dev machine had 20.18.3 — bundles fine but
  the dev server warns.)
- **Expo Go does NOT work** (SDK 56 mismatch + native modules). Must use a **development
  build**: `apps/mobile/eas.json` has a `development` profile → `npx eas-cli build --profile
  development --platform android` (free Expo account, no store account needed for an Android
  APK) — but the free-tier queue can be 30 min–2 h; the build runs server-side, so `Ctrl+C`
  is safe and `eas build:list` shows status. **Local Windows builds (`run:android`) currently
  fail** (see decisions log) — EAS is the recommended path; iOS requires EAS/Mac + an Apple
  account. Then `yarn workspace @wrsi/mobile start` for daily JS iteration. App ids:
  `com.wxstudy.wrsi`, scheme `wrsi://`. See README "Running on a device" + "Debugging".
- **EAS "Install dependencies" failure — FIXED.** Build log showed the worker runs global
  **Yarn 1.22.22** with Corepack disabled, so it can't honor `packageManager: yarn@4.12.0`.
  Fix: committed the Yarn 4.12.0 release binary (`.yarn/releases/yarn-4.12.0.cjs`) and set
  `yarnPath` in `.yarnrc.yml`, so any Yarn delegates to Yarn 4 (no Corepack needed). Also
  pinned `node: 20.19.4` in `eas.json`. Verified locally by running the exact EAS command
  `yarn install --inline-builds --immutable` → exit 0.
- **Supabase URL by target:** Android emulator `http://10.0.2.2:54321`; physical phone → the
  computer's **LAN IP** (same Wi-Fi + firewall open); iOS simulator `127.0.0.1`. `.env` is git-ignored.
- **Phone can't reach Supabase (`ConnectException` / `curl` HTTP 000 on :54321):** the local
  stack often ends up **half-up** after a PC sleep/restart — several containers (esp.
  `supabase_kong` on 54321, `supabase_rest`) exit with code 137 while db/auth stay up, so
  nothing serves the API. Fix: `yarn supabase status`; if anything is Exited,
  `yarn supabase stop && yarn supabase start` (data persists in the volume). Verify with
  `curl http://<LAN-IP>:54321/auth/v1/health` → 200. Docker mem (7.7 GB) is sufficient; not an
  OOM-config issue. If the LAN IP changed (DHCP), update `apps/mobile/.env`.
- **Supabase CLI** is a dev dependency — call it as `yarn supabase …`, not a global binary.
- After any schema change: new migration → `yarn supabase db reset` → regenerate types
  (`yarn workspace @wrsi/shared-types gen`) → commit the regenerated `database.types.ts`.

## Next milestone — Counselor CRM (read-only student view + operational writes)

- The counselor's dedicated student view (single pane per student: profile, docs, status,
  tasks) — read-only on the record, but keeps status/notes/tasks writes.
- Also pending: **admin CRUD for counselors** exists on branch `feat/admin-entity-crud`
  (commit `5c2ee44`) but was NOT included in merged PR #1 (which stopped at `e8a2402`) — it
  needs its own PR/merge so that work isn't lost.

**Just shipped — Universities search/filter + save/like** (branch `feat/universities-directory`):
enhanced `useUniversities(search)` + new `useUniversityPrograms` / `useMyUniversityInterests`
(returns a Set) / `useToggleUniversityInterest`; a reusable `SaveUniversityButton`; the student
Universities tab is now a stack — searchable list with per-card save toggle → detail screen
(description, website via `Linking`, requirements, programs). No migration (tables + RLS already
existed). *Verified:* `yarn typecheck` green; e2e via a student JWT — save → 201 + admin
`university_interest` notification fired (1→2), unsave → 204 row removed.

**Just shipped — Counselor CRM read-only student view** (branch `feat/counselor-crm`, parallel
to `feat/universities-directory`): the counselor's `Students` tab is now a stack — an
assigned-students list (reuses `useStudentsList`; the `student_directory` RLS already limits a
counselor to their own students) → a read-only single-pane student detail assembling existing
hooks (`useStudent` + `useStudentCurrentStatus` + `useStudentTasks` + `useDocuments`): profile
summary, current status badge, documents (open via a short-lived signed URL — counselors can
read assigned students' files through `can_access_user`), and tasks. **Deliberately read-only:**
the status-change workflow stays deferred pending the client's 3 open status questions; task/note
writes are a follow-up. *Verified:* `yarn typecheck` green; RLS e2e — admin sees all 3 seeded
students, the counselor sees only their 2 assigned, and an unassigned student's row returns 0
rows to the counselor. **Follow-up:** admin CRUD for counselors is committed on
`feat/admin-entity-crud` (`5c2ee44`) but was left out of merged PR #1 — needs its own PR.

Also on this branch: a **global top `AppHeader`** (in `RootNavigator`) now carries the brand +
a single **Log out** action across every signed-in experience (admin/counselor/student) — the
admin section previously had no logout affordance at all. Redundant per-screen logout buttons
were removed from the student dashboard and the counselor list. RootNavigator zeroes the top
safe-area inset for the nested navigator so screen headers don't double-pad under the notch.

**Just shipped — Documents upload (Storage)** (branch `feat/document-upload`): private
`documents` bucket + `storage.objects` RLS mirroring `can_access_user` via the `{user_id}/…`
key prefix; `@wrsi/api` `documents.ts` hooks (types/list/upload/delete/signed-URL); the student
`DocumentsScreen` (pick via `expo-document-picker` → read base64 via the SDK-56
`expo-file-system` `File` API → `base64-arraybuffer` decode → Storage upload → `documents`
row, with categorize/open/delete). **New native deps require a fresh EAS dev build before
on-device testing.** See decision log for verification.

Known follow-ups (not blockers): birth date is a validated text input
(YYYY-MM-DD) — consider a native date picker later; English level captured as CEFR; budget
captured as a bucket midpoint into `students.budget`.

## Open items awaiting the client / owner

- **Apple Developer + Google Play accounts** — not yet created; critical path for a Sept
  launch (Apple org accounts can take 1–2+ weeks). Start ASAP.
- **Monday.com export** — client still cleaning data. Two sample exports (leads + high
  schools) analyzed; structure, field→schema mapping, and schema gaps documented in
  [`docs/MIGRATION.md`](MIGRATION.md). Still need the *clean* data (ideally via the Monday
  API / with Item-ID relation columns) to build the importer.
- **Application-status workflow** — the 3 open questions (which statuses, who changes them,
  backward transitions) are deferred; must be answered before building the status UI.
- **Atlas partner integration** — not scheduled, see decision log below. Waiting on
  Alejandro to confirm scope with Atlas before any engineering starts.

## Decisions log

- **2026-07-09 — Documents upload / private Storage (branch `feat/document-upload`, off
  `master`).** Added the object store behind the pre-existing `documents` table +
  `documents_access` RLS. Migration `20260709000002`: a **private `documents` bucket** and a
  `storage.objects` FOR-ALL policy scoped to it that reuses `can_access_user(((storage.foldername(name))[1])::uuid)`
  — i.e. the object's leading `{user_id}` path segment is the owner, and the same predicate that
  guards the metadata row guards the file (owner / assigned counselor / admin). `@wrsi/api`
  `documents.ts`: `useDocumentTypes`, `useDocuments`, `useUploadDocument` (uploads then inserts
  the row; **removes the object if the row insert fails** so Storage doesn't orphan),
  `useDeleteDocument`, `useCreateDocumentSignedUrl` (60s TTL). Mobile `DocumentsScreen` picks a
  file (`expo-document-picker`), reads it via the SDK-56 `expo-file-system` **`File(uri).base64()`**
  API, decodes with `base64-arraybuffer`, uploads, and lists with open (signed URL →
  `Linking`) / delete. Also added a reusable `Button` `danger` variant (same change as the
  admin-CRUD branch — trivial merge). **New native deps (`expo-document-picker`,
  `expo-file-system`) mean the current dev build must be rebuilt (EAS) before the picker works
  on device** — JS-only iteration can't exercise it. **Verified against local Storage via the
  REST API:** bucket is private; a student uploads to their own `{id}/…` prefix (200) but is
  blocked from another user's prefix (403, RLS); `documents` row insert (201); signed-URL
  download returns the bytes (200); the student's **assigned counselor** sees the row while an
  **unrelated student** gets `[]` and a 403 on a foreign signed-URL; delete of object + row
  succeeds. `yarn typecheck` green; types regenerated.

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
