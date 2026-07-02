# Progress & Handoff Log

> Purpose: let anyone (or a fresh AI agent) resume work without re-deriving context.
> **Update this file at the end of every working session.** Newest status at the top.

**Last updated:** 2026-07-02
**Current phase:** Phase 1 (MVP) — foundation complete, starting feature milestones.
**Full plan:** `~/.claude/plans/i-am-building-this-sunny-lynx.md` (architecture + roadmap).

---

## TL;DR — where we are

The backend and app **foundation are built, verified, and committed to `master`**. The app
compiles, typechecks, and bundles; local Supabase runs with the full schema + RLS. Next up is
the **student onboarding + dashboard** feature milestone. No feature screens have real
behavior yet beyond auth (login/sign-up) and a universities list.

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
- **Android emulator:** set `EXPO_PUBLIC_SUPABASE_URL=http://10.0.2.2:54321` in
  `apps/mobile/.env` (iOS simulator can use `127.0.0.1`). `.env` is git-ignored.
- **Supabase CLI** is a dev dependency — call it as `yarn supabase …`, not a global binary.
- After any schema change: new migration → `yarn supabase db reset` → regenerate types
  (`yarn workspace @wrsi/shared-types gen`) → commit the regenerated `database.types.ts`.

## Next milestone — Student onboarding + dashboard

- Onboarding forms with **React Hook Form + Zod** (add these deps to `apps/mobile`). Fields
  from the brief: countries of interest, desired intake term + year (`intake_year` current→+6),
  achieved education level + average grade, intended level of study, fields of study,
  nationality/passports, English level (CEFR + exams). Read the seeded lookups via `@wrsi/api`.
- On submit: upsert the `students` row + the `student_*_interest` / `student_passports` rows.
- Dashboard: show current application status + progress; subscribe to `status_history` via
  Supabase **Realtime** so counselor status changes reflect live.
- After this: documents upload to Storage, then the counselor CRM (single-pane-of-glass).

## Open items awaiting the client / owner

- **Apple Developer + Google Play accounts** — not yet created; critical path for a Sept
  launch (Apple org accounts can take 1–2+ weeks). Start ASAP.
- **Monday.com export** — client still cleaning data; need a sample export to build the
  idempotent import + dedup.
- **Application-status workflow** — the 3 open questions (which statuses, who changes them,
  backward transitions) are deferred; must be answered before building the status UI.
- **Atlas partner integration** — not scheduled, see decision log below. Waiting on
  Alejandro to confirm scope with Atlas before any engineering starts.

## Decisions log

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
