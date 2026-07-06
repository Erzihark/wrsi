# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git Workflow (REQUIRED: branch → PR → review → merge)

Never work directly on `master`. For every task or meaningful chunk of work:

1. **Branch.** Create a feature branch off `master` (e.g. `feat/document-upload`,
   `fix/onboarding-validation`). Use the `compound-engineering:ce-worktree` skill to set up
   isolated work when it's available; otherwise `git checkout -b <name>`.
2. **Commit.** Commit with a clean, descriptive message explaining _why_ the change was
   made — no "wip", no vague "updates". Push the branch to `origin` (repo:
   `Erzihark/wrsi`) so work is backed up remotely, not just sitting locally.
3. **Open a PR.** Use the GitHub MCP tools (`mcp__github__create_pull_request`, etc.) — the
   `gh` CLI is not installed in this environment. Reach for the
   `compound-engineering:ce-commit-push-pr` skill for the commit+push+PR flow, or
   `compound-engineering:ce-compound` for writing up a durable learning once solved.
4. **Code review.** Run a review on the PR's diff before merging — use the
   `compound-engineering:ce-code-review` skill (or the plain `code-review` skill) at an
   effort level matched to the change's risk. Fix findings, or explicitly note why a finding
   doesn't apply, before merging.
5. **Merge.** Merge the PR into `master` via the GitHub MCP tools
   (`mcp__github__merge_pull_request`) once review is clean and CI (if any) passes. Prefer
   squash merges to keep `master` history readable, unless the branch's individual commits
   are independently meaningful.

Keep each branch/PR scoped to one coherent piece of work — don't bundle unrelated fixes into
a feature branch.

**Token permissions / fallback.** The GitHub MCP PR + merge tools require the connected
token to have `pull_requests: write` (fine-grained) or the `repo` scope (classic). If
`create_pull_request` / `merge_pull_request` return `403 Resource not accessible`, the token
is missing that scope — surface it to the user to fix. Until it's fixed, don't get blocked:
push the branch, then complete the merge locally with a **squash** merge into `master`
(`git merge --squash <branch>` → one clean commit → push), and note in the message that the
PR/review step was done locally because the MCP token lacked PR access.

## Documentation & progress (REQUIRED)

Keep the project self-documenting so any session can resume without re-explaining context:

- **`README.md`** — developer-facing guide (stack, setup, commands, conventions). Keep it current as the project changes.
- **`docs/PROGRESS.md`** — the handoff log. **Read it first** when starting work, and **update it at the end of every meaningful session**: what got done (with verification), env gotchas, and the next milestone. Newest status at the top.
- Update both as part of the same change that alters behavior/structure — don't defer docs to "later".

## Project state

Foundation is built and committed on `master` (see `docs/PROGRESS.md` for the authoritative, up-to-date status). In place: Supabase schema (`supabase/migrations`, 48 tables + RLS + seed), the shared packages (`@wrsi/api`, `ui`, `i18n`, `shared-types`, `shared-utils`), and the Expo mobile shell (React Navigation auth switch + providers + auth screens). `apps/web` is still a stub (public web is a later phase). Always check a package's actual contents before assuming feature behavior exists — most feature screens are still placeholders.

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
