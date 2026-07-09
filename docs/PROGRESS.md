# Progress & Handoff Log

> Purpose: let anyone (or a fresh AI agent) resume work without re-deriving context.
> **Update this file at the end of every working session.** Newest status at the top. Kept
> short on purpose — full historical write-ups and dated reasoning live in
> [`docs/DECISIONS.md`](DECISIONS.md), which is **not** meant to be read every session.

**Last updated:** 2026-07-08
**Current phase:** Phase 1 (MVP) — foundation, onboarding/dashboard, admin CRUD (students/high
schools/universities/counselors), documents upload, student university directory, and the
counselor's read-only CRM view are all built and merged to `master`. Student event
registration/workshops/1:1s/notes is built on `feat/student-events`, awaiting PR review.
**Client requirements (read this first if context was cleared):** `docs/REQUIREMENTS.md` —
the original client brief, feature list, and their phased roadmap.
**Full plan:** `~/.claude/plans/i-am-building-this-sunny-lynx.md` (architecture + roadmap).
**Full history:** [`docs/DECISIONS.md`](DECISIONS.md) — every dated decision + verification
write-up, oldest foundation work through the latest merged features.

---

## TL;DR — where we are

A new student is routed through a 3-step onboarding wizard that writes their profile
atomically via an RPC, then lands on a dashboard showing lifecycle status (live via Realtime)
and pending tasks. **Admins/super-admins** have a dedicated section with full create/edit/
delete for students, high schools, universities, and counselors — all provisioned as
login-capable accounts via service-role Edge Functions (`create-entity`/`delete-entity`).
**Students** can upload/manage private documents (Storage), and browse/search the university
directory with a save/like button. **Counselors** have a read-only "single pane of glass" per
assigned student (profile, status, documents, tasks) — no status/note writes yet, pending
client answers on the status workflow. A global top app bar carries the brand + the one
Log-out action across every experience. Local dev auto-seeds realistic dummy data +
login-able test accounts on every `db reset`. On `feat/student-events` (unmerged): students
can browse/register for events, book workshops and Open Fair Day 1:1 slots, and capture
per-university notes/ranking; admins get an Events tab to create/manage events and their
universities/workshops/1:1 slots.

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

- **Node:** must be **≥ 20.19.4** for Expo SDK 56.
- **Expo Go does NOT work** (SDK 56 + native modules incl. `expo-document-picker`/
  `expo-file-system`). Must use a **development build**, rebuilt via EAS whenever a native
  dep changes. `npx eas-cli build --profile development --platform android` **run from
  `apps/mobile`** (not the repo root — see DECISIONS.md 2026-07-09 stray-root-config entry).
  Local `expo run:android` is blocked by the repo path containing a space (see DECISIONS.md).
- **Supabase URL by target:** Android emulator `http://10.0.2.2:54321`; physical phone → the
  computer's LAN IP; iOS simulator `127.0.0.1`. `.env` is git-ignored.
- **Phone can't reach Supabase:** the local stack often ends up half-up after a PC
  sleep/restart. `yarn supabase status`; if anything is Exited, `yarn supabase stop && yarn
  supabase start` (data persists). Verify with `curl http://<LAN-IP>:54321/auth/v1/health`.
- **Supabase CLI** is a dev dependency — call it as `yarn supabase …`, not a global binary.
- After any schema change: new migration → `yarn supabase db reset` → regenerate types
  (`yarn workspace @wrsi/shared-types gen`, run via `yarn supabase gen types typescript
  --local --schema public > packages/shared-types/src/database.types.ts` if the package
  script's bare `supabase` isn't on PATH) → commit `database.types.ts`.
- Edge Functions run on Deno; test locally with `yarn supabase functions serve`.

## Next milestone — counselor write actions

- Event management is built end-to-end on `feat/student-events`, not yet merged: students
  browse/register for events, book workshops and Open Fair Day 1:1 slots, and capture
  per-university notes/ranking (`packages/api/src/events.ts` + student `EventsScreen`/
  `EventDetailScreen`). Admins get a new Events tab to create/edit/delete events and manage
  each event's participating universities, workshop schedule, and 1:1 slots (admin
  `EventsListScreen`/`EventDetailScreen`) — skips the login-provisioning Edge Function flow
  used for high schools/universities since events aren't login-capable entities.
  Event geography is a structured **Country → State/Province** cascade (migration
  `20260710000001_event_country.sql` adds `events.country_id` + a state-belongs-to-country
  trigger; `states_provinces` is now seeded for MX/US/CA/GB/AU/ES/DE/FR/IT/NL/IE — it was
  previously an empty table). Verified at the data layer this session (trigger cases + the
  PostgREST embed) but not yet on a device/emulator.
- Next up: counselor **write** actions (status/notes/tasks) — blocked on the application-
  status workflow questions below.

## Open items awaiting the client / owner

- **Apple Developer + Google Play accounts** — not yet created; critical path for a Sept
  launch (Apple org accounts can take 1–2+ weeks). Start ASAP.
- **Monday.com export** — client still cleaning data. Structure/mapping/gaps in
  [`docs/MIGRATION.md`](MIGRATION.md). Still need the *clean* data to build the importer.
- **Application-status workflow** — 3 open questions (which statuses, who changes them,
  backward transitions) block the status-change UI for counselors/students.
- **Atlas partner integration** — not scheduled; waiting on Alejandro to confirm scope.

## Known follow-ups (not blockers)

- Birth date is a validated text input (YYYY-MM-DD) — consider a native date picker later.
- English level captured as CEFR; budget captured as a bucket midpoint into `students.budget`.
- **Geography cascade only wired into the event form.** The high-school and university admin
  forms still use a single flat `state_province_id` picker (all states, no country filter,
  `useStatesProvinces()` unfiltered). Now that `states_provinces` is seeded, give those the
  same Country → State/Province cascade for consistency.
- Workshop/1:1 slot date/time now use `DateField`/new `TimeField` (hour/minute/AM-PM dropdowns,
  `packages/ui`) with inline errors, including a check that the slot date falls within the
  event's own start/end range. `TimeField` is event-scoped only so far — reuse it wherever
  else a time (not just a date) gets captured.
- `states_provinces` seed covers the primary study-abroad countries only; extend per ISO
  3166-2 as new destinations come up (the field is optional for unlisted countries).
- **Confirmed not yet merged:** commit `5c2ee44` (admin CRUD for counselors) is still only on
  `feat/admin-entity-crud`, built after PR #1 merged (which stopped at `e8a2402`). Needs its
  own PR before admins can create/delete counselor accounts through the app.
