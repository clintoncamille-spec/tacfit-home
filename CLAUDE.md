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

## Native iOS/Android apps (Capacitor)

The web app itself is still zero-build-step — `ios/` and `android/` are an *additive* native shell wrapped around it via [Capacitor](https://capacitorjs.com), published as **com.billscrub.tacfithome** (BillScrub LLC). This introduced the only build tooling in the repo: `package.json` + `node_modules` are for Capacitor's CLI only, not for the web app, which still loads via plain `<script>` tags exactly as before.

- **`www/` is a generated copy**, gitignored — Capacitor's `webDir` can't point at the repo root (that would ship `node_modules`, `.git`, etc. inside the app), so `npm run sync:web` (`rsync`) copies just `index.html`, `manifest.json`, `sw.js`, `css/`, `js/`, `icons/` into it. Every one of `cap:sync`/`cap:android`/`cap:ios` runs this first — **after editing any web asset, run one of those (not `npx cap sync` directly) or the native apps will keep serving the stale copy.**
- **Icons/splash**: generated once via `npx @capacitor/assets generate` from `assets/logo.png` (not an ongoing dependency — it was uninstalled after generating; reinstall it only if regenerating). Android's adaptive-icon foreground/legacy launcher icons were then re-generated a second time from `icons/icon-512-maskable.png` instead of the generate command's output, because that command centers the full-bleed square icon edge-to-edge — fine for iOS (which only rounds corners) but Android's adaptive-icon mask crops to an inner ~66% safe zone, clipping the full-bleed version. `icon-512-maskable.png` already has the correct safe-zone padding (it exists for the same reason in the PWA manifest's maskable icon entry) — any future icon regen for Android should use it, not the plain `icon-512.png`.
- **Orientation is locked to portrait** on both platforms (`android:screenOrientation="portrait"` in `AndroidManifest.xml`, single-entry `UISupportedInterfaceOrientations` in `Info.plist`), matching the PWA manifest's `"orientation": "portrait"` and the narrow mobile-card CSS layout, which isn't built for landscape/tablet.
- **iOS has no CocoaPods/Podfile** — Capacitor 8 wires plugins through Swift Package Manager (`ios/App/CapApp-SPM`) instead.
- **Building iOS requires full Xcode.app** (not just Command Line Tools) — install it from the App Store, then `npm run cap:ios` to open the workspace.
- **Building Android**: Android Studio bundles its own JDK (no system-wide `java`/`gradle` needed) — either open the project in Android Studio directly, or from the CLI: `JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew assembleDebug` from `android/`.
