# Progress & Handoff Log

> Purpose: let anyone (or a fresh AI agent) resume work without re-deriving context.
> **Update this file at the end of every working session.** Newest status at the top.

**Last updated:** 2026-07-02
**Current phase:** Phase 1 (MVP) — foundation complete, starting feature milestones.
**Full plan:** `~/.claude/plans/i-am-building-this-sunny-lynx.md` (architecture + roadmap).

---

## TL;DR — where we are

Foundation + the **student onboarding + dashboard** milestone are built, verified, and
committed to `master`. A new student is routed through a 3-step onboarding wizard that writes
their profile atomically via an RPC, then lands on a dashboard showing their current lifecycle
status + progress timeline (live via Realtime) and pending tasks. Next up: **documents upload**
(Storage), then **universities search/filter + save/like**, then the **counselor CRM**.

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
  is safe and `eas build:list` shows status. Faster local build (needs Android Studio + JDK):
  `yarn workspace @wrsi/mobile run:android`. Then `yarn workspace @wrsi/mobile start` for
  daily JS iteration. App ids: `com.wxstudy.wrsi`, scheme `wrsi://`. See README "Running on a device".
- **Supabase URL by target:** Android emulator `http://10.0.2.2:54321`; physical phone → the
  computer's **LAN IP** (same Wi-Fi + firewall open); iOS simulator `127.0.0.1`. `.env` is git-ignored.
- **Supabase CLI** is a dev dependency — call it as `yarn supabase …`, not a global binary.
- After any schema change: new migration → `yarn supabase db reset` → regenerate types
  (`yarn workspace @wrsi/shared-types gen`) → commit the regenerated `database.types.ts`.

## Next milestone — Documents upload (Storage)

- Create a **private Storage bucket** for student documents + storage RLS policies (student
  owns their files under a `{user_id}/…` prefix; assigned counselor + admin can read — mirror
  the `can_access_user` predicate).
- Mobile Documents screen: pick a file (`expo-document-picker` / `expo-image-picker`), upload
  to Storage, insert a `documents` row (`storage_path`, `type_id`, `original_filename`,
  `mime_type`, `size_bytes`), list/download/categorize by `document_types`.
- Then: **universities search/filter + save/like** (`student_university_interest` →
  admin notification already wired), then the **counselor CRM**.

Known follow-ups from this milestone (not blockers): birth date is a validated text input
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
