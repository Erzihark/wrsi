# WX Study (WRSI) Platform

One platform that connects high-school students with their ideal universities and
replaces WX Study's fragmented workflow (Monday.com CRM, Google Drive, WhatsApp,
Squarespace) with a single source of truth for **students, counselors/admins, high schools
(prepas), and universities**.

**Current focus:** a mobile-first app (Expo, iOS + Android) for both students and
counselors/admins, backed by Supabase. A public website is planned for a later phase but the
backend is built as the shared source of truth so it slots in without rework.

> **Status & handoff:** see [`docs/PROGRESS.md`](docs/PROGRESS.md) for what's done, what's
> verified, and what's next. That file is the place to pick up from between sessions.

---

## Tech stack

| Layer       | Choice                                                              |
| ----------- | ------------------------------------------------------------------- |
| Monorepo    | Turborepo + Yarn 4 (Berry)                                          |
| Mobile      | Expo SDK 56, React Native 0.85, React 19                            |
| Navigation  | React Navigation (native-stack + bottom-tabs) — **not** Expo Router |
| Backend     | Supabase (Postgres, Auth, Storage, Realtime, Edge Functions, RLS)   |
| Data/client | `@supabase/supabase-js`, TanStack Query                             |
| Forms       | React Hook Form + Zod _(introduced with onboarding)_                |
| i18n        | i18next / react-i18next (Spanish default, English)                  |

## Repository layout

```
apps/
  mobile/            # Expo app (React Navigation) — student + counselor/admin roles
  web/               # deferred: public/marketing site — later phase (stub)
packages/
  api/               # typed Supabase client, React context, TanStack Query hooks
  ui/                # design tokens + ThemeProvider + wrapped primitives
  i18n/              # i18next config + es/en resources
  shared-types/      # generated Supabase types (src/database.types.ts) + helpers
  shared-utils/      # pure helpers (dedup normalization, dates, onboarding)
  typescript-config/ # shared tsconfig bases (base / node / react-native)
supabase/
  migrations/        # ordered SQL schema + RLS (source of truth)
  seed.sql           # reference/lookup seed data
  config.toml
docs/
  PROGRESS.md        # handoff log / current status
```

## Prerequisites

- **Node ≥ 20.19.4** (Expo SDK 56 requirement)
- **Yarn 4** — pinned via `packageManager`; run `corepack enable` if needed. Always use `yarn`, never `npm`.
- **Docker Desktop** — required to run Supabase locally.
- **Supabase CLI** — installed as a dev dependency; invoke via `yarn supabase …` (no global install needed).

## Setup

```bash
# 1. Install dependencies
yarn install

# 2. Start Docker Desktop, then bring up local Supabase (applies migrations + seed)
yarn supabase start

# 3. Configure the mobile env from the local Supabase output
cd apps/mobile
cp .env.example .env
yarn supabase status            # copy API URL + anon key into .env
#   iOS simulator: EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
#   Android emulator: use http://10.0.2.2:54321
#   Physical device: use your machine's LAN IP

# 4. Run the app — start Metro (see "Running on a device" below)
yarn workspace @wrsi/mobile start
```

## Running on a device

> **Expo Go does not work with this project.** It's pinned to SDK 56 (and uses native
> modules), so you must install a **development build** — your own app binary with the Expo
> dev client. You build it once; after that you just run Metro and it hot-reloads your JS.

**Build the dev client (one time, per native change).** Easiest path is EAS cloud build
(needs a free Expo account, `npx eas login` — no Apple/Google account required for an Android
dev APK):

```bash
cd apps/mobile
npx eas-cli build --profile development --platform android
# → download + install the APK on your phone when it finishes
```

Local alternative (no Expo account, needs Android Studio + a USB-connected phone/emulator):
`yarn workspace @wrsi/mobile android` (runs `expo run:android`).

**Then, each dev session:**

```bash
yarn workspace @wrsi/mobile start   # Metro; the QR opens your dev build, not Expo Go
```

**Talking to local Supabase from a physical phone:** `127.0.0.1` is the phone itself, so set
`EXPO_PUBLIC_SUPABASE_URL` in `apps/mobile/.env` to your computer's **LAN IP**
(e.g. `http://192.168.1.20:54321`), put the phone on the same Wi-Fi, and allow the port
through your firewall.


## Common commands

| Command                                   | What it does                                          |
| ----------------------------------------- | ----------------------------------------------------- |
| `yarn typecheck`                          | Typecheck every workspace (Turbo)                     |
| `yarn lint` / `yarn test` / `yarn build`  | Other Turbo tasks (add scripts per package as needed) |
| `yarn supabase start` / `stop` / `status` | Manage the local Supabase stack                       |
| `yarn supabase db reset`                  | Recreate the DB and re-apply all migrations + seed    |
| `yarn gen:types`   | Regenerate DB types from the local schema             |
| `yarn workspace @wrsi/mobile start`       | Start the Expo dev server                             |

## Working with the database

The schema lives in `supabase/migrations/` as ordered SQL — this is the source of truth.

1. Add a **new** migration file (`supabase/migrations/<timestamp>_name.sql`); don't edit
   applied ones.
2. Apply it: `yarn supabase db reset` (or `yarn supabase migration up`).
3. Regenerate types: `yarn gen:types`, then commit
   `packages/shared-types/src/database.types.ts`.

**Access model:** Row-Level Security is enabled on all tables. A student sees only their own
records; a counselor sees only their assigned students; admins see everything; directory data
(universities, high schools, events, statuses) is readable by any authenticated user. Roles
come from the `user_roles` join table (a signup trigger mirrors `auth.users` into
`public.users` and assigns the `student` role by default).

## Conventions

- **Schema:** junction tables use composite PKs; money is `numeric` + a `currency_id`;
  `timestamptz` for points in time, `date` for calendar-only fields; a polymorphic `statuses`
  catalog keyed by `entity_type`.
- **UI:** screens use the wrapped primitives from `@wrsi/ui` (never raw React Native
  components). Restyle the whole app from `packages/ui/src/theme/tokens.ts`.
- **Navigation:** React Navigation only (no file-based routing).
- **i18n:** all user-facing strings live in `packages/i18n`; Spanish is the default.
- **Git:** never leave finished work uncommitted; scoped commits with a clear _why_.
- **Docs:** update `README.md` and `docs/PROGRESS.md` as part of every meaningful change.

## License

Private / proprietary — client project for WX Study.
