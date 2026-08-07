# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

No build step, no package manager, no bundler — this is plain vanilla JS/CSS/HTML. There is no test suite or linter configured.

- **Run locally**: `python3 -m http.server 8092` from within this directory (matches the `tacfit-home` entry in the root `.claude/launch.json`). Any static file server works equally well.
- **Ship a change**: after editing anything in `js/`, `css/`, or `index.html`, bump the `CACHE` version string at the top of `sw.js`. The service worker is cache-first, so without a version bump, anyone who already loaded the app won't see the update until they happen to clear site data.

## Architecture

**Script loading is the module system.** There's no bundler and no ES modules — `index.html` loads each `js/*.js` file via a plain `<script>` tag, in a specific order, and every file shares one global scope. Load order matters where one file's top-level code reads globals defined by another (e.g. `auth.js` must load before `sync.js`, since `sync.js` calls `Auth.onChange(...)` at the top level). When adding a new file, add its `<script>` tag in both `index.html` and `sw.js`'s `ASSETS` cache list.

**Routing (`app.js`)**: a single hash router — `route()` reads `location.hash`, `go(path)` sets it, `render()` dispatches on it. Most routes (`dashboard`, `library`, `analytics`, `settings`) share the tab-bar chrome, built once in `render()`. A few — `onboarding`, `session`, `templates`, `exercise-history` — are full-screen sub-flows that render themselves with no tab bar and their own back button. Because `go()` only re-renders on an actual hash *change*, navigating to a route you're already on (e.g. one exercise-history page linking to another) is a no-op — call the route's render function directly if that's ever needed.

**State has two tiers, and mixing them up is the main way to introduce bugs:**
- **Persisted** — everything under `Store` (`storage.js`), which serializes one JSON blob to `localStorage` (key `tacfit_v1`). `defaultDB()` is the schema. Every mutating `Store` method calls `saveDB` and then `Sync.schedulePush()` (a no-op when signed out). `currentPlan`, `activeSession`, and `workoutTemplates` are deliberately *not* synced to Supabase — plans and sessions are derived/rebuilt from `profile` + `workoutHistory`, and templates were scoped local-only to avoid needing delete-tombstone logic.
- **Ephemeral UI state** — the global `App` object in `app.js` (current draft objects, timer handles, in-memory route params like `App.historyExerciseId`). Never persisted; a hard reload resets it.

**Optional accounts/sync layer** (`supabaseClient.js`, `auth.js`, `sync.js`): the app is fully functional signed-out — `supabaseClient` is `null` until `SUPABASE_URL`/`SUPABASE_ANON_KEY` are filled in, and every `Auth`/`Sync` method checks for that before doing anything. `Sync.pushLocal`/`pullRemote` mirror specific `Store` collections to matching Supabase tables (see `supabase/schema.sql`, which the user applies by hand in their Supabase SQL editor — it is not run automatically, so schema changes here mean asking the user to re-run it). Merge strategy: last-write-wins by `updatedAt` for the single-row `profile`; additive union (never delete on pull) for log-shaped tables. Progress photo *files* go straight to Supabase Storage at upload time — `progress_photos` in Postgres only stores the pointer.

**Exercise/plan domain logic**: `exercises.js` + `poses.js` hold the static exercise library (category, target muscle groups, injury-conflict list, per-experience-level set/rep scaling, pose SVGs). `workout-generator.js` (`buildWeeklyPlan`) turns a profile into a week of days, filtering exercises against the user's injuries (`safeForProfile`) and scaling sets/reps to their stated experience and current strength (`scaleFor`). `fitness.js` holds pure BMI/strength-level formulas. Analytics features (Strength Gains, weekly muscle-group volume, the day-of-week heatmap) all read from `workoutHistory[].exerciseResults`, attributing volume through each exercise's `targets` array and excluding sets flagged `warmupSetsDone`.

**Charts** (`charts.js`): two dependency-free canvas primitives, `drawLineChart`/`drawBarChart`, reused for everything from the full Progress-page charts down to the small per-exercise sparklines — they just read colors from CSS custom properties at draw time, so they don't need separate dark-mode handling.

**Theming**: CSS custom properties on `:root` in `styles.css`, overridden under `@media (prefers-color-scheme: dark)` and again under `:root[data-theme="dark"]`/`:root[data-theme="light"]` for the manual toggle. Any new UI should be styled through the existing tokens (`--bg`, `--surface`, `--text`, `--accent`, etc.), never with hardcoded colors, or it'll break in one theme.
