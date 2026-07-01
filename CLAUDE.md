# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git Workflow

Never leave finished work uncommitted. To avoid losing progress:

- After completing a task (or a meaningful chunk of one), commit it with a clean, descriptive message explaining _why_ the change was made.
- Push commits to GitHub (`origin`) so work is backed up remotely, not just sitting locally.
- Keep commits scoped and messages free of noise — no "wip", no vague "updates".

## Project state

This is an early-stage Turborepo monorepo scaffold. Most workspaces are placeholder stubs (package.json with no source/scripts yet) rather than working apps — check a package's actual contents before assuming functionality exists. `supabase/` and `docs/` are currently empty directories reserved for future use.

## Commands

- Package manager is **Yarn 4 (Berry)**, pinned via `packageManager` in package.json — always use `yarn`, not `npm`.
- Install: `yarn install`
- Run a task across the monorepo via Turborepo: `yarn turbo run <build|lint|test|typecheck>` (these tasks are declared in `turbo.json` but most workspaces don't implement them yet, so expect many to be no-ops until a package adds the corresponding script).
- Run a script in one workspace: `yarn workspace <package-name> <script>`, e.g. `yarn workspace @wrsi/mobile start`.

### Mobile app (`apps/mobile`, Expo/React Native)

- `yarn workspace @wrsi/mobile start` — start the Expo dev server
- `yarn workspace @wrsi/mobile android` — start with Android target
- `yarn workspace @wrsi/mobile ios` — start with iOS target
- `yarn workspace @wrsi/mobile web` — start with web target
- Uses Expo SDK ~56. **Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing Expo/React Native code** — the API has changed significantly across SDK versions and training knowledge may be stale.

## Architecture

Yarn workspaces monorepo (`apps/*`, `packages/*`) orchestrated by Turborepo (`turbo.json`).

- `apps/mobile` — Expo/React Native app. Entry point is `index.ts` → registers `App.tsx`.
- `apps/web` — placeholder workspace (`@wrsi/web`), no source yet.
- `packages/shared-types` — placeholder workspace for types shared between apps, no source yet.
- `packages/shared-utils` — placeholder workspace for utilities shared between apps; `src/index.ts` currently empty.
- `packages/typescript-config` — intended to hold shared `tsconfig` bases for other workspaces to extend; currently empty.
