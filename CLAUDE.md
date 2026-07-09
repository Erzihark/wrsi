# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git Workflow (REQUIRED: branch → commit → push → STOP)

Never work directly on `master` unless the user explicitly asks for a change to land there in
the current turn (e.g. a small docs-only edit). For every task or meaningful chunk of work:

1. **Branch.** Create a feature branch off `master` (e.g. `feat/document-upload`,
   `fix/onboarding-validation`). Use the `compound-engineering:ce-worktree` skill to set up
   isolated work when it's available; otherwise `git checkout -b <name>`.
2. **Commit.** Commit with a clean, descriptive message explaining _why_ the change was
   made — no "wip", no vague "updates".
3. **Push and stop.** Push the branch to `origin` (repo: `Erzihark/wrsi`) so work is backed
   up remotely, then **stop** — do not open or merge a PR. **The user opens, reviews, and
   merges every PR themselves via GitHub's UI.** The connected GitHub token intentionally
   does not have `pull_requests: write` (the user declined to grant it), and even if it did,
   do not call `mcp__github__create_pull_request` / `mcp__github__merge_pull_request`, and do
   not `git merge`/`git push` a feature branch into `master` — that would be self-approving
   code onto the default branch with no human review. Give the user the compare/PR-creation
   URL (`https://github.com/Erzihark/wrsi/pull/new/<branch>`) so they can open it.
4. **Don't start new branches while one is pending review.** If the user is mid-review of a
   branch, wait for their approval/merge before starting unrelated new work, unless they say
   otherwise.

Keep each branch scoped to one coherent piece of work — don't bundle unrelated fixes into a
feature branch. A code review (the `code-review` skill, effort matched to risk) is still
valuable before handing a branch off, but it does not gate a merge you perform yourself.

## Testing (REQUIRED — part of "done")

Tests are a standing check on every piece of work, not a one-off. The full guide (how to run
each layer, prerequisites, what's covered) is [`docs/TESTING.md`](docs/TESTING.md). The rule:

1. **Run the affected layers before handing off a branch.** At minimum `yarn typecheck` +
   `yarn test` (fast unit layer, no Docker). If the change touches the API/DB/RLS/Edge
   Functions, also run `yarn test:backend` (needs `yarn supabase start` + `db reset`, and
   `yarn supabase functions serve` for the edge tests). If it changes mobile UI, run the
   relevant `.maestro` flow locally (WSL2 + emulator + dev build).
2. **Update tests the change affects.** When you alter behavior, update the tests that assert
   it — a red suite you caused is not "done".
3. **Add tests for new behavior.** New API hook / RLS policy / trigger / Edge Function → add
   backend coverage in `tests/backend`. New pure helper → a unit test. New user-facing flow →
   a Maestro flow (add a `testID` rather than relying on i18n'd text).
4. **Don't claim green without running it.** State which layers you ran; if a layer needs the
   stack/emulator and you couldn't run it, say so.

The three layers: **unit** (Vitest, `packages/*/src/**/*.test.ts`, no backend) · **backend
integration/security/edge** (Vitest, `tests/backend`, live local stack) · **mobile E2E**
(Maestro, `.maestro`, emulator + dev build). CI (`.github/workflows/ci.yml`) gates
typecheck + unit + backend on every push/PR; Maestro E2E is local-only for now.

## Session hygiene (token budget)

The user is on a metered usage window and wants it stretched, not burned fast:

- **Default to Sonnet.** Only use Opus for architecture calls with long-term lock-in,
  security-critical code (auth, payments, RLS *design*), a bug that resisted a first pass,
  genuinely ambiguous requirements, or a final pre-merge review of something risky. Routine
  CRUD screens/hooks/migrations/i18n/tests don't need it. (Only the human running `/model`
  can actually switch models — say which tier a task needs if it's non-obvious.)
- **Suggest a `/clear` at feature boundaries.** When a self-contained feature is shipped,
  committed, and verified, say so plainly and suggest clearing before starting the next
  unrelated one, rather than silently letting one session sprawl across many features.
- **Don't use subagents as a blanket cost-reduction trick.** Spawning one re-derives context
  cold, which is often *more* expensive than doing routine work inline. Reserve them for
  genuinely isolated/parallelizable work.
- **Keep `docs/PROGRESS.md` short** (~100–150 lines: current status + next milestone). Full
  dated write-ups go in `docs/DECISIONS.md` instead, since PROGRESS.md gets re-read/re-touched
  far more often.

## Documentation & progress (REQUIRED)

Keep the project self-documenting so any session can resume without re-explaining context:

- **`README.md`** — developer-facing guide (stack, setup, commands, conventions). Keep it current as the project changes.
- **`docs/PROGRESS.md`** — the short handoff log. **Read it first** when starting work, and **update it at the end of every meaningful session**: current status, env gotchas, and the next milestone. Newest status at the top. Keep it short (see Session hygiene above).
- **`docs/DECISIONS.md`** — the full dated decision log with verification write-ups. Append a new dated entry here when you ship something; don't grow `PROGRESS.md` with historical detail. Read on demand (not every session) when you need the reasoning behind a past change.
- Update `README.md` + `PROGRESS.md` as part of the same change that alters behavior/structure — don't defer docs to "later".

## Project state

**Read `docs/REQUIREMENTS.md` first** for the original client brief/feature list/roadmap
(preserved separately from engineering decisions) — especially after a `/clear`, since it's
not derivable from the codebase. Then `docs/PROGRESS.md` for the authoritative, up-to-date
build status.

Foundation, student onboarding + dashboard, and admin student management (CRUD) are built and
committed on `master`. In place: Supabase schema (`supabase/migrations`, 48 tables + a
`student_directory` view + RLS + seed + dev/staging seed data), the shared packages
(`@wrsi/api`, `ui`, `i18n`, `shared-types`, `shared-utils`), and the Expo mobile app (React
Navigation auth switch routing to Admin / Counselor / Student experiences). `apps/web` is
still a stub (public web is a later phase). Always check a package's actual contents before
assuming feature behavior exists — some screens (counselor's, most student tabs) are still
placeholders.

## Commands

- Package manager is **Yarn 4 (Berry)**, pinned via `packageManager` in package.json — always use `yarn`, not `npm`.
- Install: `yarn install`
- Run a task across the monorepo via Turborepo: `yarn <build|lint|test|typecheck>` (root scripts) or `yarn turbo run <task>`. `typecheck` is implemented across the code packages; `lint`/`test` are still no-ops until scripts are added.
- Run a script in one workspace: `yarn workspace <package-name> <script>`, e.g. `yarn workspace @wrsi/mobile start`.

### Supabase (local backend)

- Requires **Docker Desktop** running. The CLI is a dev dependency — call it via `yarn supabase …`.
- `yarn supabase start` / `stop` / `status` — manage the local stack (Studio on :54323, API on :54321).
- `yarn supabase db reset` — recreate the DB and re-apply all `supabase/migrations` + `seed.sql`.
- Schema changes = **new** migration file (never edit applied ones) → `db reset` → regenerate types (`yarn gen:types` from the repo root) → commit `packages/shared-types/src/database.types.ts`.

### Mobile app (`apps/mobile`, Expo/React Native)

- `yarn workspace @wrsi/mobile start` — start the Expo dev server
- `yarn workspace @wrsi/mobile android` — start with Android target
- `yarn workspace @wrsi/mobile ios` — start with iOS target
- `yarn workspace @wrsi/mobile web` — start with web target
- Uses Expo SDK ~56. **Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing Expo/React Native code** — the API has changed significantly across SDK versions and training knowledge may be stale.

## Architecture

Yarn workspaces monorepo (`apps/*`, `packages/*`) orchestrated by Turborepo (`turbo.json`), on a Supabase backend (`supabase/`).

- `apps/mobile` — Expo/React Native app. Entry `index.ts` → `App.tsx` → `AppProviders` → `NavigationContainer` → `RootNavigator` (auth switch by session + role). Source under `src/` (navigation, screens, providers, auth, lib, config). **Read the exact SDK 56 docs at https://docs.expo.dev/versions/v56.0.0/ before writing Expo/RN code.**
- `apps/web` — stub (`@wrsi/web`); public/marketing site is a later phase.
- `packages/api` — typed Supabase client factory, `SupabaseProvider`/`useSupabase`, query keys, TanStack Query hooks.
- `packages/ui` — design tokens + `ThemeProvider` + wrapped primitives; restyle everything from `src/theme/tokens.ts`.
- `packages/i18n` — i18next config + `es`/`en` resources (Spanish default).
- `packages/shared-types` — generated Supabase types (`src/database.types.ts`) + `Tables`/`Enums` helpers.
- `packages/shared-utils` — pure helpers (dedup normalization, onboarding/date utils).
- `packages/typescript-config` — shared tsconfig bases: `base.json`, `node.json`, `react-native.json`.
- `supabase/` — `migrations/` (ordered SQL schema + RLS, the source of truth), `seed.sql`, `config.toml`.
