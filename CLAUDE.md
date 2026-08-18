# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Scope discipline

`aim-simulator-prd.md` is the specification. v1 (§8's four phases) shipped and is verified
against §9. The project is now in **v2**: a multi-routine trainer with a home screen,
player-configurable sensitivity, and a difficulty manager — all marked **(v2)** in the
PRD's §3. Multiple concurrent targets, moving targets, and menus are **in** scope now;
the older text saying otherwise has been amended.

Still out of scope: no Python backend, no ML training or inference, no LLM integration,
no coaching/archetyping, no auth, no leaderboards, no sound.

Runtime dependencies are **only** `three` and `@supabase/supabase-js`. No frameworks —
the home screen and overlays are plain HTML/CSS. Adding a dependency or a framework is a
spec violation, not an improvement.

**Five routines have shipped**: precision flick, static flicking (gridshot), dynamic
reflex (spidershot), reactive strafing, and target switching.
`src/routines/index.js` is both the catalogue and the factory — it gates each tile with
`available`, and `isAvailable` also requires a registered factory, so a new routine needs
both. `src/difficulty.js` holds every per-routine parameter. Never mark a routine
available before its factory exists; the home screen renders straight from that flag.

Two scoring shapes exist. **Destructible** routines (flick, gridshot, spidershot,
switching) consume the target on a hit and spawn a replacement. **Tracking** routines
(strafing) deliberately do *not* — `resolveHit` is empty, because the
drill is staying on the target, and consuming it would turn it into a flick drill.

## Commands

```powershell
npm install
npm run dev        # Vite dev server on :5173
npm run build      # static bundle to dist/
npm run preview    # serve the built dist/ on :4173
```

Windows/PowerShell is the primary dev environment; use forward slashes in code.

There is no test runner and no linter — adding one would mean adding dependencies. See
"Verifying changes" below for how this codebase is actually exercised.

## Architecture

Plain ES modules, one factory function per file, no classes and no shared mutable state
between modules. `main.js` is the only composition point: it builds the scene, controls,
HUD and (optionally) the bot, injects them into `createGame()`, and owns the
`requestAnimationFrame` loop.

**Pointer lock is the session boundary.** `PointerLockControls` `lock`/`unlock` events
drive everything: lock switches to the PLAYING screen and calls `game.start()` with the
active difficulty's target radius (fresh `crypto.randomUUID()` session id, HUD counters
reset, first spawn); unlock calls `game.stop()` and shows PAUSED. Re-locking always
starts a new session — it never resumes the old one.

**The attempt is the span between resolutions** — the time the player had to find and
destroy the next target, not the life of one mesh. `beginAttempt()` stamps the clock,
opens a fresh telemetry buffer seeded with `{t:0,dx:0,dy:0}`, and points the bot at
`routine.aimTarget()`. A click runs `shoot()`: raycast, then **resolve the routine and
re-arm first**, and only then update the HUD and fire the insert. Everything after
`beginAttempt()` in `shoot()` is deliberately off the latency path.

A target that expires on its own (spidershot) counts as an attempt against accuracy but
writes **no telemetry row** — no click happened — and is excluded from the average time
via the separate `clicks` counter the HUD receives.

**Routines own their targets; `game.js` owns everything else.** Each routine exposes the
same shape: a live `targets` array to raycast against, `start`/`update`/`stop`,
`resolveHit`/`resolveMiss`, and `aimTarget()` for Bot Mode. `update()` returns
`{expired}` using frozen module-level constants, since it runs every frame. A routine is
built fresh per session, so mode and difficulty changes always take effect on the next
start — which means `stop()` must dispose its pool or meshes accumulate in the scene.
Targets are pooled (`createTargetPool` in `target.js`): allocating geometry mid-session
would stutter the frame.

**Bot mode is a camera driver, not a separate game.** `?bot=linear` or `?bot=smoothed`
makes `main.js` disable `controls.enabled` and pass a bot into the game. From then on
`game.update(now)` advances the flick one frame at a time, records the bot's own rotation
as synthetic mouse deltas, and calls the same `shoot()` a human click would. Human
mousemove is not recorded and human clicks are ignored, so a synthetic row can never be
contaminated. Without a bot, `game.update()` returns immediately.

**The home screen is the resting state.** `main.js` runs three screens — HOME, PLAYING,
PAUSED. Pointer lock still bounds a session, but HOME sits in front of it: Start requests
the lock, `Esc` unlocks into PAUSED, and PAUSED can return to HOME. `settings.js` owns
`{dpi, sens, difficulty, routine}`, persists to localStorage, sanitises everything it
reads back, and notifies subscribers; `src/ui/home.js` is the only module touching that DOM.

`constants.js` holds defaults and every tunable (FOV, spawn volume, flick timing). Numbers
belong there or in `difficulty.js`, not inline.

## Invariants that break silently if violated

- **`camera.updateMatrixWorld()` before every raycast.** Three only recomposes that matrix
  during `render()`, so without it a click is judged against the previous frame's aim.
  This was a real bug (commit `3c8c1c2`).
- **The telemetry buffer is replaced, never emptied in place.** `beginAttempt()` assigns a
  new array because the previous attempt's array is still travelling to Supabase; clearing
  it with `length = 0` would ship an empty `trajectory`.
- **Target radius must never scale with distance.** Depth variance in `SPAWN_VOLUME` is the
  whole point — constant screen size would make the Z axis cosmetic (PRD §5.3).
- **One sensitivity value, two consumers.** `sensitivity.js` converts DPI + in-game sens
  (Valorant scale, 0.07°/count) into both `controls.pointerSpeed` and the bot's
  `radiansPerMovementUnit`. `main.js` must push a settings change into *both*
  (`applySensitivity` and `bot.setRadiansPerMovementUnit`). If they drift, the game still
  looks fine while every synthetic bot row silently describes the wrong rotation. The
  `0.002` in `sensitivity.js` mirrors a PointerLockControls internal.
- **Target radius is changed by rebuilding geometry, never by scaling the mesh.** A non-unit
  scale would distort `worldToLocal` and corrupt every recorded click offset (`target.js`).
- **Bot deltas are integers with the rounding error carried between frames**, so they look
  like real mouse counts *and* still sum to exactly the rotation performed.
- **Never call Supabase from `mousemove`.** Buffer only.
- **Moving targets must `updateMatrixWorld()` after they move.** The routine runs before
  `renderer.render()`, and the click raycast reads `matrixWorld`, not `position`. Skip it
  and shots are judged against where the target was a frame ago.
- **Spawn inside the inset bounds before moving.** Targets spawn anywhere in
  `SPAWN_VOLUME`, but a moving one lives in that volume inset by its radius, so
  `clampInside` must run at launch or the first `bounce()` snaps it inward by up to a
  radius in one frame. This was a real bug, caught as a speed spike of 12.34 against a
  configured 5.
- **Only pass live targets to the raycaster.** Three does not skip invisible meshes, so a
  released target still in `scene.children` would register hits if it reached the ray. The
  pool keeps `active` to exactly what is on screen.

## Supabase

`schema.sql` creates `telemetry_logs` with RLS and an **anon insert-only** policy — the
browser cannot `SELECT`, so read rows from the dashboard. Credentials come from
`.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`); the value may be a
publishable key (`sb_publishable_...`) or a legacy anon key, never a secret/service_role
key. The URL must be the bare origin — a `/rest/v1` suffix produces 404s, since the client
appends the path itself.

Two behaviours worth knowing: with no credentials the app still runs, logging one warning
and dropping rows; and because Vite inlines `import.meta.env` at build time, `.env.local`
must exist **before** `npm run build` or the Supabase client is tree-shaken out of the
bundle entirely.

## Verifying changes

`scene.js` needs WebGL and only runs in a browser, but `game.js`, `bot.js`, `telemetry.js`
and `target.js` are DOM-light enough to drive headlessly in Node, which is how the game
logic has been validated (spawn distribution, hit/miss geometry, payload shape, buffer
isolation, bot flick profiles). To do that:

- Stub `globalThis.document` with `addEventListener`/`removeEventListener` that capture
  handlers, then invoke them directly; stub `globalThis.window = { location: { search } }`
  for `readBotMode()`. Pass plain objects for `hud` and `crosshair`.
- `supabase.js` reads `import.meta.env`, which does not exist in Node and throws. Redirect
  the module to a capturing stub with a `node:module` resolve hook rather than changing the
  source.
- A harness outside the project cannot resolve the bare `three` specifier; import it by
  absolute file URL to `node_modules/three/build/three.module.js`.
- Bot timing checks must measure angular *velocity* (step ÷ elapsed) within a single flick.
  Raw per-frame steps pooled across flicks are meaningless, since each flick covers a
  different angle over a different duration.
- `settings.js` needs `globalThis.window.localStorage` stubbed; a `Map` is enough.
  `createControls` needs a fake element carrying `ownerDocument` with add/removeEventListener.
- Sensitivity has a known-good reference: Valorant sens `0.4` @ `800` DPI is `40.8 cm/360`.

Movement is best checked by driving a routine directly on **synthetic timestamps**
(`routine.update(i * 8)`) rather than through the game and real sleeps: it is instant and
deterministic. Sample positions per frame, then derive speed and per-frame turn angle from
the displacement vectors. That is how "constant speed", "smooth arcs" and "abrupt cuts"
are verified as numbers rather than impressions.

**Bot Mode aims at where a target was when the flick began**, so against the moving
routines it will miss often. Synthetic rows are only trustworthy for the static routines
until the bot learns to lead a target.

Browser-only criteria — pointer lock, `Esc` pausing, mouse feel, and rows actually landing
in the database — still need a human to confirm.

## Conventions

Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`). Keep
modules small and single-purpose; the largest is `game.js` at ~150 lines. No dead code,
no TODOs left behind, no `.env.local` in git.
