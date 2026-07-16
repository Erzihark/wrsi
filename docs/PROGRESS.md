# Progress & Handoff Log

> Purpose: let anyone (or a fresh AI agent) resume work without re-deriving context.
> **Update this file at the end of every working session.** Newest status at the top. Kept
> short on purpose — full historical write-ups and dated reasoning live in
> [`docs/DECISIONS.md`](DECISIONS.md), which is **not** meant to be read every session.

**Last updated:** 2026-07-16
**Current phase:** Phase 1 (MVP) — foundation, onboarding/dashboard, admin CRUD (students/high
schools/universities/counselors), documents upload, student university directory, the
counselor's read-only CRM view, and event management (registration/workshops/1:1s/notes +
admin event CRUD) are all built and merged to `master`. **The designer's student-dashboard
design arrived** — implementation planned as 4 sequential PRs (backend → UI kit → home/nav →
profile/apps); plan in `~/.claude/plans/i-finally-was-given-snappy-charm.md`.

**Merged:** `feat/student-home-backend` — **PR 1 of 4** (student-home redesign). Events gain
`image_url`/`start_time`/`end_time` (+ `location` formalized as venue) with the admin event
form updated; `students`/`counselors` gain `photo_url` + a public `avatars` bucket; new
`update_student_profile` RPC (onboarding's validation, UPDATE-only, **no** status/onboarding
side effects); new hooks (`useMyCounselor`, `useMyApplications`,
`useUnreadNotificationsCount`, `useMark(All)NotificationRead`, `useUploadMyAvatar`,
`useUploadCounselorPhoto`, `useUpdateMyStudentProfile`, `useMyStudentInterestSelections`);
dashboard display helpers in `@wrsi/shared-utils`.

**In review:** `feat/ui-brand-foundation` — **PR 2 of 4** (UI kit, `packages/ui` only, no
behavior change). Brand recolored **app-wide** to orange: `tokens.color.primary` → `#f97316`,
+ `primaryDark #ea580c` (pressed / small text — white-on-orange is only ~2.8:1) + `primarySoft
#fff7ed` (tinted surfaces). This restyles **every** experience (auth/admin/counselor buttons &
links go orange) — intended, it's the one-file design-swap mechanism. New primitives:
`ProgressBar`, `ProgressRing` (svg, centered slot), `Avatar` (initials fallback + badge slot),
`IconTile`, `Carousel` (paging ScrollView + dots, no new deps), `SectionHeader`. 18 new SVG
icons in `icons.tsx` (Home/Bell/Person/Chevron/Calendar/Clock/MapPin/GraduationCap/FileText/
Folder/Camera/Play/Shield/Mail/Users/Book/Target/Chat + WhatsApp/Instagram/TikTok/LinkedIn/
YouTube brand marks). Verified: `yarn typecheck` green (incl. mobile — recolor broke no types).
**Not yet rendered on device** — nothing consumes these until PR 3 wires them into screens.

**Next:** PR 3 (nav restructure → 5 tabs + Home/Notifications/Counselor screens), PR 4
(Profile/Applications + photo upload + the profile-screen new fields — see the second design's
schema in the plan file `~/.claude/plans/i-finally-was-given-snappy-charm.md`).

**All previously-in-review branches are merged to `master`** (PRs merged via GitHub UI; local
branches cleaned up). What landed since the last handoff:

- **`fix/android-ios-parity-audit`** — codebase-wide audit for the CLAUDE.md iOS+Android parity
  rule (prompted by the flag-emoji incident). (1) `Screen`'s scroll variant now sets
  `automaticallyAdjustKeyboardInsets` on iOS so long forms don't hide fields behind the keyboard;
  (2) glyphs with emoji variants (`♥`/`♡`, `ℹ`) → bundled SVG icons in
  `packages/ui/src/components/icons.tsx`. `Button` gained an `icon(color)` prop. Rule of thumb:
  text-only symbols (`✓ ✕ ▾ ·`) are safe in strings; anything with an emoji variant becomes an
  SVG icon. On-device iOS/Android pass not run.
- **`feat/form-validation-standards`** — one validation standard across every form: react-hook-form
  + zod, real-time (`mode: onTouched`), submit disabled until valid. Shared kit in
  `@wrsi/shared-utils` (url/image-url/email predicates + `libphonenumber-js` helpers + zod field
  builders), a `PhoneField` primitive + RHF field wrappers in `apps/mobile/src/components/form`.
  Converted: onboarding, all 4 admin entity forms, the event form, and auth Login/SignUp. Bundled
  offline flag icons (`CountryFlag` in `@wrsi/ui`). Standard in [`docs/VALIDATION.md`](VALIDATION.md).
  **Added a native module (`react-native-svg` 15.15.4) → a new EAS dev build is required before it
  renders on device.** Mobile emulator/Maestro layer not run.
- **`fix/high-school-dropdown-stale-cache`** — admin CRUD lists not reflecting create/edit/delete
  until a full reload (native-stack keeps the List mounted, so `goBack()` never remounts it).
  Fix: `useRefetchOnFocus` on every admin list; also fixed a stale "assign high school" dropdown
  (query-key mismatch in `useHighSchools`). Adds `packages/api/src/directory.test.ts` + Maestro
  flow `.maestro/admin/high-school-create.yaml`. Not yet run on-device. See [[native-stack-list-refetch]].
- **`feat/confirm-dialogs-and-toasts`** — `ConfirmProvider`/`useConfirm()` + `ToastProvider`/
  `useToast()` in `@wrsi/ui` (mounted in `AppProviders`). Destructive actions go through a themed
  confirm; create/edit/delete/toggle outcomes report via non-blocking toasts. The generated-password
  alert on admin account creation stays a blocking Alert on purpose.

See DECISIONS.md 2026-07-10 for the full write-ups.

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
login-able test accounts on every `db reset`. **Events:** students can browse/register for
events, book workshops and Open Fair Day 1:1 slots, and capture per-university notes/ranking;
admins get an Events tab to create/manage events and their universities/workshops/1:1 slots.
Admin high-school, university, and event forms all use a cascading **Country → State/Province**
picker (`apps/mobile/src/components/CountryStateSelect.tsx`).

## How to run / verify (quick)

```bash
yarn install
yarn supabase start                 # needs Docker Desktop
yarn typecheck                      # all workspaces should pass
yarn test                           # fast unit tests (no Docker)
yarn supabase db reset && yarn test:backend   # integration/security/edge (stack up)
cd apps/mobile && cp .env.example .env   # fill from `yarn supabase status`
yarn workspace @wrsi/mobile start
```
Local Supabase Studio: http://127.0.0.1:54323 · API: http://127.0.0.1:54321

## Testing (see `docs/TESTING.md` + CLAUDE.md "Testing (REQUIRED)")

Three layers, now a standing part of "done": **unit** (Vitest, `yarn test`, no Docker) ·
**backend integration/security/edge** (Vitest, `tests/backend`, `yarn test:backend` against a
live local stack + `supabase functions serve`) · **mobile E2E** (Maestro, `.maestro`, needs an
emulator + dev build; run in WSL2 on Windows). CI (`.github/workflows/ci.yml`) gates typecheck
+ unit + backend on every push/PR. `edge` tests need `yarn supabase functions serve` running.

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

## Next milestone — counselor write actions (blocked)

- Counselor **write** actions (status/notes/tasks) are the stated next milestone but are
  **blocked** on the application-status workflow questions below (which statuses, who changes
  them, backward transitions).
- Unblocked candidates while that's pending: a notifications inbox UI (the `notifications`
  table/hook/triggers exist but have no surface), and expanding the Maestro E2E slice.

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
- **Geography cascade** is now shared across the event, high-school, and university admin forms
  via `CountryStateSelect` (`apps/mobile/src/components`). Note: high schools/universities
  persist only `state_province_id` (the country is a UI-only filter derived from the state),
  whereas events store `country_id` explicitly. Verified at typecheck + data layer (states
  seeded per country); the picker interaction itself is not yet exercised on a device/emulator.
  The event form still has its own inline cascade — could be refactored onto `CountryStateSelect`
  later (it also persists `country_id`, so not a drop-in).
- Workshop/1:1 slot date/time now use `DateField`/new `TimeField` (hour/minute/AM-PM dropdowns,
  `packages/ui`) with inline errors, including a check that the slot date falls within the
  event's own start/end range. `TimeField` is event-scoped only so far — reuse it wherever
  else a time (not just a date) gets captured.
- `states_provinces` seed covers the primary study-abroad countries only; extend per ISO
  3166-2 as new destinations come up (the field is optional for unlisted countries).
- **Testing — expand the E2E slice.** Backend coverage is solid (incl. events, see
  `tests/backend/security/events.test.ts`); Maestro covers login-per-role, the onboarding gate,
  and the full admin high-school **create / edit / delete** cycle
  (`.maestro/admin/high-school-{create,edit,delete}.yaml`) — each also guarding the stale-list
  refetch on its path; delete additionally covers the themed confirm dialog + delete-entity Edge
  Function. Added generic `searchTestID`/`editTestID` on the shared `EntityListScreen` + fixed
  `confirm-dialog-{confirm,cancel}`/`entity-delete`/`highschool-contact-first-input` testIDs, so
  extending edit/delete flows to universities/counselors/students is now mostly wiring those props
  in. **The high-school cycle is device-verified** (physical Android, live local stack, 2026-07-12
  — see DECISIONS.md), which baked three conventions into every admin-form flow: `scrollUntilVisible`
  before submit/delete (long form), tap a field to blur so RHF `onTouched` enables submit, and
  edit an *empty* field (contact name) rather than mutating pre-filled text (cursor lands
  mid-string and corrupts it). Still to add (and `testID`s) for: full onboarding completion,
  document upload/delete, the rest of admin CRUD (students/universities/counselors/events
  edit+delete), counselor read-only CRM, and events browse/register/workshop/1:1/notes.
- **Testing — Maestro in CI.** E2E isn't wired into GitHub Actions yet (needs an Android
  emulator + a built dev app). Add a dedicated workflow when worth the runner cost.
