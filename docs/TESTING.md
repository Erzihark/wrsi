# Testing Guide

WRSI has three test layers. **Tests are part of the definition of done** (see the "Testing
(REQUIRED)" section in `CLAUDE.md`): when you change code, run the relevant layers, update
tests the change affects, and add tests for new behavior.

| Layer | Where | Runner | Needs the Supabase stack? |
|-------|-------|--------|---------------------------|
| Unit (pure logic) | `packages/*/src/**/*.test.ts` | Vitest | No |
| Backend integration / security / edge | `tests/backend/**` | Vitest | **Yes** (live local stack) |
| Mobile E2E | `.maestro/**` | Maestro | Yes (stack) + emulator/dev build |

---

## 1. Unit tests (fast, no backend)

Pure functions with the Supabase client mocked or not involved at all.

```bash
yarn test                      # all workspaces' unit tests via Turbo
yarn workspace @wrsi/shared-utils test
yarn workspace @wrsi/api test
```

Covered today: `@wrsi/shared-utils` helpers (incl. `sanitizeSearchTerm`, the PostgREST
metacharacter stripper shared by `useUniversities` / `useStudentsList`), `@wrsi/api`
`queryKeys` factory, and `functionErrorMessage` (Edge Function error unwrapping).

`yarn test` runs **only** this layer — it never needs Docker, so it's safe to run anytime and
it's what the CI `checks` job gates on.

## 2. Backend integration / security / edge tests

These sign in as the seeded accounts and hit a **live local stack**, so they verify RLS,
triggers, RPC validation, and the Edge Functions for real. They live in the `@wrsi/backend-tests`
workspace (`tests/backend`) and are deliberately **not** wired into `yarn test` (they need
Docker), only into `yarn test:backend`.

### Prerequisites

```bash
# 1. Docker Desktop running, then:
yarn supabase start
yarn supabase db reset          # deterministic: re-applies migrations + seeds/dev.sql
# 2. In a second terminal (needed only for the edge-function tests):
yarn supabase functions serve
```

`seeds/dev.sql` creates the fixtures the tests assume — accounts (all password
`password123`): `admin@wrsi.dev`, `counselor@wrsi.dev` (assigned to student1 & student2),
`student1..4@wrsi.dev` (student3 has no counselor; student4 has no profile → onboarding),
`highschool1/2@wrsi.dev`, `university1/2@wrsi.dev`; plus one event with workshops and a
pre-registered student. Keep `tests/backend/helpers/ids.ts` in sync with that seed.

### Run

```bash
yarn test:backend                                   # integration + security + edge
yarn workspace @wrsi/backend-tests test:integration security   # subset by folder name
```

### Connection details / keys

`tests/backend/helpers/env.ts` defaults to the local stack (`http://127.0.0.1:54321`) and the
well-known local demo anon/service keys. **These are not secrets** and only work locally. If a
future Supabase CLI prints different keys in `yarn supabase status`, override without editing
code:

```bash
SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... yarn test:backend
```

CI does exactly this — it exports the keys from `yarn supabase status -o env`.

### What's covered

- **Integration:** universities read + `ilike` search path, `student_directory` list + counselor
  filter, `complete_student_onboarding` server-side validation.
- **Security (RLS + triggers):** per-role row visibility (student own-row, counselor
  assigned-vs-unassigned, admin all), admin-only tables invisible to non-admins (also proves a
  `user_roles` JWT claim can't be leveraged for DB access), the student-record write guards
  (own non-restricted column OK; counselor-reassign blocked; counselor can't edit the row),
  owner-portal writes, and the workshop time-overlap trigger.
- **Edge Functions:** `create-entity` / `delete-entity` — unauthenticated 401, non-admin
  rejected, admin create with correct role + cascade delete, duplicate-email rejection.

## 3. Mobile E2E (Maestro)

Native flows against a real dev build. Maestro is the Expo-recommended E2E tool and drives the
actual app, so native modules (document picker, secure store) work.

### Prerequisites

- **Maestro CLI** installed (on Windows, run it from **WSL2**):
  `curl -fsSL https://get.maestro.mobile.dev | bash`
- An Android emulator or iOS simulator running, with a **dev build** of `@wrsi/mobile`
  installed (`npx eas-cli build --profile development` from `apps/mobile`, or a local build).
  Expo Go does **not** work (SDK 56 native modules).
- The local Supabase stack up and freshly `yarn supabase db reset` (deterministic accounts).
- The app's `.env` pointing at the stack (Android emulator → `http://10.0.2.2:54321`).

### Run

```bash
maestro test .maestro                        # all flows
maestro test .maestro --include-tags auth    # just the login flows
```

App id (both platforms): `com.wxstudy.wrsi`.

### Runbook: this Windows machine + physical Android phone (dev-client build)

Repeatable step-by-step for running Maestro against the **installed dev-client build** on the
user's physical phone, from a clean start each time. (One-time environment setup — WSL2 Maestro
install, the ColorOS toggle — is a prerequisite and is covered separately below this runbook.)

1. **Start the backend** (Windows PowerShell, repo root):
   ```powershell
   yarn supabase start          # if not already running: yarn supabase status to check
   yarn supabase db reset       # optional — only if you need a clean DB for this run
   ```
2. **Set `apps/mobile/.env`** to point at `localhost` (not the LAN IP — we tunnel over USB):
   ```
   EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
   ```
   (Keep the anon key line as-is. **Remember to revert this to the LAN IP,
   `http://192.168.100.9:54321`, when done** — the LAN IP is what a from-scratch dev-build launch
   via `npx expo start --host lan` expects.)
3. **Start Metro** (Windows PowerShell, repo root):
   ```powershell
   yarn workspace @wrsi/mobile start
   ```
   Wait for `Waiting on http://localhost:8081` in its output.
4. **Connect the phone** — USB cable plugged in, then set up both tunnels (Windows PowerShell,
   with `platform-tools` on PATH):
   ```powershell
   adb devices                       # confirm the phone shows as "device", not "unauthorized"
   adb reverse tcp:8081 tcp:8081      # tunnels Metro to the phone's localhost:8081
   adb reverse tcp:54321 tcp:54321    # tunnels Supabase to the phone's localhost:54321
   ```
5. **For Maestro itself to reach the phone**, connect over WiFi from WSL2 (Maestro runs in WSL2,
   which cannot see USB devices or the Windows adb server — see "Environment notes" below):
   ```powershell
   # one-time per boot: put the phone's adbd into TCP mode via the USB connection
   adb tcpip 5555
   ```
   ```bash
   # from WSL2 — find the phone's WiFi IP first (Settings > About phone > Status, or
   # `adb -s <usb-serial> shell ip -f inet addr show wlan0` from Windows), then:
   adb connect <phone-wifi-ip>:5555
   adb devices                        # should show "<ip>:5555   device" (not "unauthorized" —
                                       # approve the "Allow wireless debugging?" prompt on the phone if it appears)
   ```
6. **Load the app** pointing at the tunneled Metro (from WSL2, or Windows adb targeting the WiFi
   serial):
   ```bash
   adb -s <phone-wifi-ip>:5555 shell am start -a android.intent.action.VIEW \
     -d 'wrsi://expo-development-client/?url=http://localhost:8081'
   ```
   Wait for the bundle to load (watch Metro's log for `Android Bundled ... modules`).
7. **Run a flow.** Because the installed build is a dev client, `launchApp: clearState` (the
   committed flows' preamble) drops back to the Expo launcher instead of the app — so for a
   dev-client run, use a copy of the flow with the preamble swapped for the `openLink` from step 6
   (the session persists across JS reloads, so it lands logged-in — skip the login steps too):
   ```bash
   maestro test path/to/your-flow.yaml
   ```
8. **Clean up** when done: revert `apps/mobile/.env` to the LAN IP, and optionally
   `adb reverse --remove-all` / stop Metro.

**Environment notes (why these specific steps):**
- Maestro CLI only runs on macOS/Linux, hence WSL2 on this Windows box (Ubuntu-20.04, converted
  from WSL1 — `wsl --set-version Ubuntu-20.04 2`).
- WSL2 cannot reach the Windows host or the phone's LAN IP directly on this machine (a past
  Bitdefender uninstall left the Windows Firewall rule store corrupted — `netsh advfirewall
  reset` + a reboot are the fix if this changes/breaks again). adb-over-WiFi (step 5) and
  `adb reverse` over USB (step 4) both route around that: WiFi adb goes phone-to-phone-IP
  directly, and `adb reverse` is set up from the *Windows* adb (which has USB access), tunneling
  Metro/Supabase to the phone's own `localhost` — nothing has to cross the WSL2/Windows boundary
  except Maestro's own control connection to the phone's WiFi IP.
- ColorOS (this phone's OEM Android skin) blocks `pm clear` (Maestro's `clearState`) by default:
  Developer Options → **"Disable permission monitoring"** must be ON.
- See [DECISIONS.md 2026-07-12](DECISIONS.md) for the original device-verification session this
  runbook was extracted from, including the exact failures each step avoids.

### What's covered / conventions

Runnable today: login as each role lands on the correct experience
(`.maestro/auth/login-{admin,counselor,student}.yaml`); the onboarding gate for a
profile-less student (`.maestro/student/onboarding-gate.yaml`); and the full admin high-school
**create / edit / delete** cycle (`.maestro/admin/high-school-{create,edit,delete}.yaml`) —
each a self-contained flow that also guards the stale-list refetch on its respective
create/update/delete path, and delete additionally exercises the themed confirm dialog and the
delete-entity Edge Function. **The high-school create/edit/delete cycle is device-verified**
(physical Android, 2026-07-12 — see DECISIONS.md). These rely on `testID`s: `login-email` /
`login-password` / `login-submit`; the role tab ids `admin-tab-students` /
`student-tab-dashboard` / `counselor-tab-students`; `onboarding-screen`; the admin high-school
ids `admin-tab-highschools` / `admin-add-highschool` / `admin-highschool-search` /
`highschool-edit` / `highschool-name-input` / `highschool-contact-first-input`; the shared
entity-form ids `entity-email-input` / `entity-submit` / `entity-delete`; and the confirm-dialog
ids `confirm-dialog-confirm` / `confirm-dialog-cancel`. The `searchTestID` / `editTestID` props
on the shared `EntityListScreen` are generic — wire them into the university/counselor/student
list screens to extend edit/delete flows to those entities.

**Device-verified flow conventions** (learned running the CRUD cycle on a physical device; apply
to every new admin-form flow):
- The entity form is longer than the viewport → `scrollUntilVisible` the `entity-submit` /
  `entity-delete` button before tapping it (`tapOn` does **not** auto-scroll).
- Forms use react-hook-form `onTouched` validation, so the submit button stays **disabled until a
  field blurs**. adb `inputText` + `hideKeyboard` don't fire a blur — after filling the last
  field, `tapOn` another field to trigger validation and enable submit.
- **Don't edit pre-filled text fields** (append/erase): tapping a populated field lands the cursor
  mid-string, corrupting the value. To verify an *edit*, populate an **empty** field instead (the
  high-school edit flow sets the contact first name and checks it in the list subtitle).

**Running against a local dev-client build** (what's installed on this machine's physical test
phone): a `developmentClient` build ships no JS bundle and `clearState` drops it to the Expo
launcher, so the committed flows' `launchApp: clearState` preamble needs a *standalone* (preview)
build instead. See the step-by-step **"Runbook: this Windows machine + physical Android phone"**
above for the exact repeatable procedure (Metro, `adb reverse` tunnels, `openLink` in place of
`clearState`).

**Extending E2E** (the incremental next step): add a `testID` to the element a new flow needs
(the `@wrsi/ui` `Button`/`Input`/`Screen` primitives already forward `testID`), then add a
flow. Prefer `testID`s over visible text — UI copy is i18n'd (Spanish default), so text
selectors are locale-fragile. To target one row in a list whose per-row controls share an id,
filter the list via its search box first (as the high-school edit/delete flows do). Deferred
flows to add next: full onboarding completion, document upload/delete, the rest of admin CRUD
(students/universities/counselors/events edit+delete), counselor read-only CRM, and the events
browse/register/workshop/1:1/notes flow.

Maestro E2E is **not** in CI yet (it needs an emulator + built app). That's a tracked
follow-up; for now run it locally for UI-affecting changes.
